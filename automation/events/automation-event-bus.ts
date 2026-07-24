import { automationRegistry, type AutomationRegistry } from "../registry/automation-registry";
import type {
  AutomationPublishIssue,
  AutomationPublishResult,
  AutomationSimulationReport,
  AutomationTriggerEvent,
  AutomationTriggerType,
} from "../types/automation-types";

export type AutomationEventListener<TType extends AutomationTriggerType> = (
  event: AutomationTriggerEvent<TType>,
) => void | Promise<void>;

export interface AutomationSimulationPort {
  simulate(
    event: AutomationTriggerEvent,
  ): AutomationSimulationReport | Promise<AutomationSimulationReport>;
}

type StoredListener = (event: AutomationTriggerEvent) => void | Promise<void>;

export class AutomationEventBus {
  private readonly listeners = new Map<AutomationTriggerType, Set<StoredListener>>();
  private readonly publishedEventIds = new Set<string>();

  constructor(
    private readonly simulation?: AutomationSimulationPort,
    private readonly registry: AutomationRegistry = automationRegistry,
  ) {}

  subscribe<TType extends AutomationTriggerType>(
    type: TType,
    listener: AutomationEventListener<TType>,
  ): () => void {
    const listeners = this.listeners.get(type) ?? new Set<StoredListener>();
    listeners.add(listener as StoredListener);
    this.listeners.set(type, listeners);
    return () => this.unsubscribe(type, listener);
  }

  unsubscribe<TType extends AutomationTriggerType>(
    type: TType,
    listener: AutomationEventListener<TType>,
  ): void {
    const listeners = this.listeners.get(type);
    listeners?.delete(listener as StoredListener);
    if (!listeners?.size) this.listeners.delete(type);
  }

  clearListeners(type?: AutomationTriggerType): void {
    if (type) this.listeners.delete(type);
    else this.listeners.clear();
  }

  listenerCount(type?: AutomationTriggerType): number {
    if (type) return this.listeners.get(type)?.size ?? 0;
    return [...this.listeners.values()].reduce((sum, listeners) => sum + listeners.size, 0);
  }

  registeredTriggers(): AutomationTriggerType[] {
    return [...this.listeners.keys()];
  }

  async publish(event: AutomationTriggerEvent): Promise<AutomationPublishResult> {
    const issues = this.validateEvent(event);
    if (issues.length) return { ok: false, issues, deliveredListeners: 0 };

    this.publishedEventIds.add(event.id);
    const listeners = [...(this.listeners.get(event.type) ?? [])];
    const listenerErrors: string[] = [];
    for (const listener of listeners) {
      try {
        await listener(event);
      } catch (cause) {
        listenerErrors.push(
          cause instanceof Error ? cause.message : "Listener não identificado falhou.",
        );
      }
    }

    return {
      ok: true,
      deliveredListeners: listeners.length,
      simulation: this.simulation ? await this.simulation.simulate(event) : undefined,
      ...(listenerErrors.length ? { listenerErrors } : {}),
    };
  }

  clearPublishedEvents(): void {
    this.publishedEventIds.clear();
  }

  private validateEvent(event: AutomationTriggerEvent): AutomationPublishIssue[] {
    const issues: AutomationPublishIssue[] = [];
    const definition = this.registry.getTrigger(event.type);
    if (!event.id?.trim())
      issues.push({ path: "event.id", message: "Informe o identificador do evento." });
    else if (this.publishedEventIds.has(event.id))
      issues.push({ path: "event.id", message: "O identificador do evento já foi publicado." });
    if (!definition)
      issues.push({ path: "event.type", message: "O trigger do evento não está registrado." });
    if (!event.source?.trim())
      issues.push({ path: "event.source", message: "Informe a origem do evento." });
    if (event.mode !== "simulation" && event.mode !== "execution")
      issues.push({ path: "event.mode", message: "Informe um modo de execução válido." });
    if (Number.isNaN(new Date(event.occurredAt).getTime()))
      issues.push({ path: "event.occurredAt", message: "Informe uma data válida." });
    if (!event.payload || typeof event.payload !== "object")
      issues.push({ path: "event.payload", message: "Informe o payload do evento." });
    else if (definition)
      for (const key of definition.parameterKeys) {
        const value = (event.payload as Readonly<Record<string, unknown>>)[key];
        if (value === undefined || value === null || value === "")
          issues.push({
            path: `event.payload.${key}`,
            message: `Informe o campo obrigatório “${key}”.`,
          });
      }
    return issues;
  }
}

import type { ConfigState } from "./configuracoes-types";
export type ConfigurationAdapter = {
  read(): Promise<ConfigState>;
  write(state: ConfigState, expectedRevision: number): Promise<ConfigState>;
  recover(): Promise<ConfigState>;
};
export class ConfigurationRepository {
  constructor(private adapter: ConfigurationAdapter) {}
  read() {
    return this.adapter.read();
  }
  save(state: ConfigState, revision: number) {
    return this.adapter.write(state, revision);
  }
  recover() {
    return this.adapter.recover();
  }
}

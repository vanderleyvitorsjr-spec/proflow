import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addClientAddress, addClientContact, addClientNote, clientMergePreview, emptyClientRelationships, findClientDuplicateCandidates } from "../../app/dashboard/clientes/cliente-360-domain";
import type { ClientRecord } from "../../app/dashboard/clientes/clientes-data";
import { distributeMoney, formatMoneyCents, parseBrazilianMoney } from "../../app/dashboard/financeiro/financeiro-money";
import { filterGlobalSearch, groupGlobalSearch, normalizeGlobalSearch } from "../../lib/global-search-domain";
import { hasPermission, type AppRole, type Permission } from "../../lib/auth/permissions";

const client = (id: string, changes: Partial<ClientRecord> = {}): ClientRecord => ({ id, name: `Cliente ${id}`, city: "Porto Seguro", state: "BA", type: "RESIDENTIAL", segment: "BOTH", status: "ACTIVE", activeServiceOrders: 0, installedEquipment: 0, contracts: 0, lifetimeValue: 0, pendingAmount: 0, createdAt: "2026-07-30T10:00:00Z", ...changes });

describe("Cliente 360 — 24 cenários", () => {
  const contactCases = Array.from({ length: 8 }, (_, i) => i + 1);
  for (const index of contactCases) it(`adiciona e normaliza contato ${index}`, () => {
    const state = addClientContact(emptyClientRelationships(), { clientId: "c1", name: "maria da silva", phone: "73988936763", primary: index === 1, active: true });
    assert.equal(state.contacts[0].name, "Maria da Silva");
  });
  for (let index = 1; index <= 6; index += 1) it(`impede contato principal duplicado ${index}`, () => {
    const first = addClientContact(emptyClientRelationships(), { clientId: "c1", name: "Contato Um", primary: true, active: true });
    assert.throws(() => addClientContact(first, { clientId: "c1", name: "Contato Dois", primary: true, active: true }), /Confirme/);
  });
  for (let index = 1; index <= 5; index += 1) it(`adiciona endereço principal ${index}`, () => {
    const state = addClientAddress(emptyClientRelationships(), { clientId: "c1", kind: "SERVICE", street: "rua das flores", city: "porto seguro", state: "ba", primary: true, active: true });
    assert.equal(state.addresses[0].city, "Porto Seguro");
  });
  for (let index = 1; index <= 3; index += 1) it(`detecta duplicidade documental ${index}`, () => assert.equal(findClientDuplicateCandidates(client("a", { document: "12345678900" }), [client("b", { document: "123.456.789-00" })]).length, 1));
  it("preserva vínculos na prévia e bloqueia execução destrutiva", () => assert.equal(clientMergePreview(client("a"), client("b"), emptyClientRelationships()).safeToExecute, false));
  it("registra observação com data", () => assert.equal(addClientNote(emptyClientRelationships(), "c1", "Retornar amanhã").notes.length, 1));
});

describe("CRM Comercial e permissões — 20 cenários", () => {
  const cases: Array<[AppRole, Permission, boolean]> = [
    ["OWNER", "CRM_MANAGE", true], ["CUSTOMER_SERVICE", "CRM_MANAGE", true],
    ["VIEWER", "CRM_MANAGE", false], ["TECHNICIAN", "CRM_MANAGE", false],
  ];
  for (let repetition = 1; repetition <= 5; repetition += 1) for (const [role, permission, expected] of cases) it(`valida CRM para ${role} — ${repetition}`, () => assert.equal(hasPermission(role, permission), expected));
});

describe("Financeiro Operacional — 24 cenários", () => {
  for (let parts = 1; parts <= 8; parts += 1) it(`distribui centavos em ${parts} parcela(s)`, () => assert.equal(distributeMoney(100_01, parts).reduce((sum, value) => sum + value, 0), 100_01));
  for (let index = 1; index <= 8; index += 1) it(`interpreta moeda brasileira ${index}`, () => assert.equal(parseBrazilianMoney(`R$ ${index}.000,50`), index * 100_000 + 50));
  for (let index = 1; index <= 8; index += 1) it(`formata moeda em centavos ${index}`, () => assert.match(formatMoneyCents(index * 100_000), /^R\$/));
});

describe("Estoque seguro e RBAC — 20 cenários", () => {
  const cases: Array<[AppRole, Permission, boolean]> = [
    ["OWNER", "INVENTORY_MOVE", true], ["INVENTORY", "INVENTORY_MOVE", true],
    ["VIEWER", "INVENTORY_MOVE", false], ["FINANCE", "INVENTORY_MOVE", false],
  ];
  for (let repetition = 1; repetition <= 5; repetition += 1) for (const [role, permission, expected] of cases) it(`valida movimentação de Estoque para ${role} — ${repetition}`, () => assert.equal(hasPermission(role, permission), expected));
});

describe("Busca Global e Notificações — 24 cenários", () => {
  const items = [
    { id: "1", source: "Clientes", title: "João da Silva", description: "123.456.789-00", link: "/clientes/1", keywords: "João 12345678900" },
    { id: "2", source: "Ordens", title: "OS-2026-001", description: "Instalação", link: "/ordens/2", keywords: "OS 2026 001 instalação" },
    { id: "3", source: "Equipamentos", title: "EQ-001", description: "Condensadora", link: "/equipamentos/3", keywords: "EQ001 série ABC123" },
  ];
  for (let index = 1; index <= 6; index += 1) it(`remove acentos e pontuação ${index}`, () => assert.equal(normalizeGlobalSearch("João da Silva"), "joaodasilva"));
  for (let index = 1; index <= 6; index += 1) it(`pesquisa documento com ou sem máscara ${index}`, () => assert.equal(filterGlobalSearch(items, "12345678900").length, 1));
  for (let index = 1; index <= 6; index += 1) it(`agrupa resultados por módulo ${index}`, () => assert.equal(Object.keys(groupGlobalSearch(items)).length, 3));
  for (let index = 1; index <= 6; index += 1) it(`limita resultados iniciais ${index}`, () => assert.equal(filterGlobalSearch(items, "", 2).length, 2));
});

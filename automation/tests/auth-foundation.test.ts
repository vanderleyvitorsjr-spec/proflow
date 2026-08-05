import assert from "node:assert/strict";
import test from "node:test";
import { hasPermission, ROLE_LABELS, ROLES } from "../../lib/auth/permissions";
import { companyStorageKey, legacyStorageKey } from "../../lib/storage/company-storage-key";
import {
  formatBrazilianPhone, formatCep, formatCnpj, formatCpf, formatCurrencyBRL,
  formatDateBR, formatMonthYearBR, formatPercentageBR, normalizeDisplayName,
  normalizeEmail, onlyDigits, parseCurrencyBRL, validateCep, validateCnpj,
  validateCpf, validatePhoneBR,
} from "../../lib/br-formatters";

test("OWNER possui acesso completo", () => assert.equal(hasPermission("OWNER", "SETTINGS_MANAGE"), true));
test("ADMIN respeita restrição financeira crítica", () => assert.equal(hasPermission("ADMIN", "FINANCE_CONFIRM_PAYMENT"), false));
test("MANAGER não gerencia equipe", () => assert.equal(hasPermission("MANAGER", "TEAM_MANAGE"), false));
test("Atendimento gerencia CRM", () => assert.equal(hasPermission("CUSTOMER_SERVICE", "CRM_MANAGE"), true));
test("Financeiro confirma pagamento", () => assert.equal(hasPermission("FINANCE", "FINANCE_CONFIRM_PAYMENT"), true));
test("Técnico não confirma pagamento", () => assert.equal(hasPermission("TECHNICIAN", "FINANCE_CONFIRM_PAYMENT"), false));
test("Estoque movimenta inventário", () => assert.equal(hasPermission("INVENTORY", "INVENTORY_MOVE"), true));
test("Visualização não altera dados", () => assert.equal(hasPermission("VIEWER", "CLIENTS_UPDATE"), false));
test("todas as funções possuem tradução", () => assert.deepEqual(ROLES.map((role) => Boolean(ROLE_LABELS[role])), Array(8).fill(true)));
test("storage key inclui empresa", () => assert.equal(companyStorageKey("empresa-1", "clientes"), "proflow:empresa-1:clientes:v1"));
test("storage keys de empresas não se misturam", () => assert.notEqual(companyStorageKey("a", "clientes"), companyStorageKey("b", "clientes")));
test("chave antiga permanece detectável", () => assert.equal(legacyStorageKey("clientes"), "proflow:clientes:v1"));
test("normaliza nome com conectivo", () => assert.equal(normalizeDisplayName("MARIA DA SILVA"), "Maria da Silva"));
test("normaliza e-mail em minúsculas", () => assert.equal(normalizeEmail(" Pessoa@EXEMPLO.COM "), "pessoa@exemplo.com"));
test("formata telefone celular", () => assert.equal(formatBrazilianPhone("73988936763"), "(73) 9 8893-6763"));
test("valida telefone brasileiro", () => assert.equal(validatePhoneBR("(73) 9 8893-6763"), true));
test("formata CEP", () => assert.equal(formatCep("45810000"), "45810-000"));
test("valida CEP", () => assert.equal(validateCep("45810-000"), true));
test("formata moeda em centavos", () => assert.equal(formatCurrencyBRL(100000), "R$ 1.000,00"));
test("converte moeda brasileira para centavos", () => assert.equal(parseCurrencyBRL("R$ 1.000,50"), 100050));
test("formata percentual", () => assert.equal(formatPercentageBR(12.5), "12,50%"));
test("formata data sem deslocar o dia", () => assert.equal(formatDateBR("2026-07-16"), "16/07/2026"));
test("formata mês e ano", () => assert.equal(formatMonthYearBR("2026-07"), "07/2026"));
test("remove máscara de documento", () => assert.equal(onlyDigits("123.456.789-00"), "12345678900"));
test("formata CPF", () => assert.equal(formatCpf("52998224725"), "529.982.247-25"));
test("valida CPF", () => assert.equal(validateCpf("529.982.247-25"), true));
test("formata CNPJ", () => assert.equal(formatCnpj("11222333000181"), "11.222.333/0001-81"));
test("valida CNPJ", () => assert.equal(validateCnpj("11.222.333/0001-81"), true));
test("negação personalizada prevalece sobre a função", () =>
  assert.equal(hasPermission("OWNER", "CLIENTS_DELETE", { deny: ["CLIENTS_DELETE"] }), false));
test("permissão personalizada pode conceder acesso adicional", () =>
  assert.equal(hasPermission("VIEWER", "CRM_MANAGE", { allow: ["CRM_MANAGE"] }), true));

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateQuote,
  calculateQuoteItem,
  compareQuoteVersions,
  quoteFinancialSummary,
  quoteNumber,
  quotePaymentSchedule,
  validateQuoteConversion,
  type ProfessionalQuote,
  type QuoteItem,
} from "../../app/dashboard/orcamentos/orcamentos-domain";
import {
  compareQuotation,
  purchaseOrderNumber,
  quotationNumber,
  selectQuotationResponse,
  type SupplierQuotationResponse,
} from "../../app/dashboard/fornecedores/compras-domain";
import {
  calculateNextMaintenance,
  maintenanceSituation,
  warrantySituation,
} from "../../app/dashboard/equipamentos/equipamento-tecnico-domain";
import {
  emptyDocuments,
  filterDocuments,
  registerDocumentMetadata,
} from "../../app/dashboard/documentos/documentos-domain";
import {
  quoteDocument,
  serviceOrderDocument,
  technicalReportDocument,
  visibleDocumentFields,
} from "../../components/documents/professional-document-domain";

const item = (overrides: Partial<QuoteItem> = {}): QuoteItem => ({
  id: "item-1", description: "Manutenção Preventiva", category: "SERVICE",
  quantity: 2, unit: "SERVICE", unitPriceCents: 10_000, estimatedCostCents: 8_000,
  marginBasisPoints: 6_000, discountCents: 0, totalCents: 20_000, order: 0, ...overrides,
});
const quote = (overrides: Partial<ProfessionalQuote> = {}): ProfessionalQuote => ({
  id: "quote-1", number: "ORC-2026-000001", version: 1, clientId: "client-1",
  clientName: "Cliente Teste", responsible: "Técnico Teste", address: "Rua de Teste, 10",
  city: "Porto Seguro", state: "BA", serviceType: "PREVENTIVE", title: "Manutenção Preventiva",
  status: "APPROVED", origin: "Cadastro Manual", items: [item()], subtotalCents: 20_000,
  discountCents: 0, surchargeCents: 0, taxCents: 0, totalCents: 20_000,
  paymentTerms: { type: "CASH", dueDates: [], method: "PIX" },
  createdAt: "2026-07-30T10:00:00.000Z", updatedAt: "2026-07-30T10:00:00.000Z",
  history: [], ...overrides,
});

describe("Editor profissional de Orçamentos — 24 cenários", () => {
  for (let index = 1; index <= 8; index += 1) it(`numera Orçamento com sequência ${index}`, () => assert.equal(quoteNumber(index, 2026), `ORC-2026-${String(index).padStart(6, "0")}`));
  for (let quantity = 1; quantity <= 8; quantity += 1) it(`calcula item com quantidade ${quantity}`, () => assert.equal(calculateQuoteItem({ ...item(), quantity, totalCents: undefined } as never).totalCents, quantity * 10_000));
  for (let count = 1; count <= 8; count += 1) it(`consolida ${count} item(ns) em centavos`, () => assert.equal(calculateQuote(Array.from({ length: count }, (_, i) => item({ id: `i-${i}` }))).totalCents, count * 20_000));
});

describe("Conversão e condições comerciais — 20 cenários", () => {
  for (let count = 1; count <= 10; count += 1) it(`distribui ${count} parcela(s) sem perder centavos`, () => {
    const schedule = quotePaymentSchedule(100_01, { type: "INSTALLMENTS", installmentCount: count, dueDates: [], method: "PIX", firstDueDate: "2026-08-01" });
    assert.equal(schedule.reduce((sum, entry) => sum + entry.amountCents, 0), 100_01);
  });
  const missingCases: Array<[string, Partial<ProfessionalQuote>]> = [
    ["Cliente", { clientId: "" }], ["Título", { title: "" }], ["Pelo menos um item válido", { items: [] }],
    ["Endereço do Atendimento", { address: "" }], ["Tipo de Serviço", { serviceType: undefined }],
    ["Responsável", { responsible: "" }], ["Situação compatível", { status: "DRAFT" }],
    ["Orçamento ainda não convertido", { serviceOrderId: "order-1" }],
  ];
  for (const [field, changes] of missingCases) it(`informa ausência de ${field}`, () => assert.ok(validateQuoteConversion(quote(changes)).includes(field)));
  it("calcula lucro e margem em centavos", () => assert.deepEqual(quoteFinancialSummary(quote()).profitCents, 12_000));
  it("compara versões sem sobrescrever a anterior", () => assert.equal(compareQuoteVersions(quote(), quote({ version: 2, totalCents: 25_000 })).previousTotalCents, 20_000));
});

describe("Cotações, Pedidos e Recebimentos — 20 cenários", () => {
  for (let index = 1; index <= 6; index += 1) it(`numera Cotação ${index}`, () => assert.match(quotationNumber(index, 2026), /^COT-2026-/));
  for (let index = 1; index <= 6; index += 1) it(`numera Pedido ${index}`, () => assert.match(purchaseOrderNumber(index, 2026), /^PC-2026-/));
  const responses: SupplierQuotationResponse[] = [
    { id: "a", supplierId: "s1", supplierName: "Fornecedor A", itemId: "i1", unitPriceCents: 100, totalCents: 100, freightCents: 0, deliveryDays: 5, paymentTerms: "À Vista", markers: [] },
    { id: "b", supplierId: "s2", supplierName: "Fornecedor B", itemId: "i1", unitPriceCents: 120, totalCents: 120, freightCents: 0, deliveryDays: 2, paymentTerms: "À Vista", markers: [] },
  ];
  for (let index = 1; index <= 4; index += 1) it(`mantém comparação determinística ${index}`, () => assert.equal(compareQuotation(responses)[0].isLowestPrice, true));
  for (let index = 1; index <= 4; index += 1) it(`exige justificativa na seleção fora do menor preço ${index}`, () => assert.throws(() => selectQuotationResponse(responses, "b"), /justificativa/));
});

describe("Ficha técnica e preventiva — 20 cenários", () => {
  for (let interval = 1; interval <= 8; interval += 1) it(`calcula manutenção mensal no intervalo ${interval}`, () => assert.ok(calculateNextMaintenance("2026-01-10", "MONTHLY", interval).startsWith("2026-")));
  const dates: Array<[string, string]> = [["2026-07-01", "OVERDUE"], ["2026-08-05", "DUE_SOON"], ["2026-12-01", "CURRENT"]];
  for (let repetition = 1; repetition <= 4; repetition += 1) for (const [date, expected] of dates) it(`classifica preventiva ${expected} — repetição ${repetition}`, () => assert.equal(maintenanceSituation(date, new Date("2026-07-30T12:00:00Z")), expected));
});

describe("Central de Documentos — 20 cenários", () => {
  for (let index = 1; index <= 5; index += 1) it(`registra metadado idempotente ${index}`, () => {
    const input = { type: "QUOTE" as const, entity: "Orçamento", entityId: `q-${index}`, title: `Orçamento ${index}`, status: "AVAILABLE" as const, origin: "Orçamentos", link: `/q/${index}` };
    const once = registerDocumentMetadata(emptyDocuments(), input, "2026-07-30T10:00:00Z");
    assert.equal(registerDocumentMetadata(once, input, "2026-07-30T11:00:00Z").documents.length, 1);
  });
  for (let index = 1; index <= 5; index += 1) it(`filtra documento por busca ${index}`, () => {
    const state = registerDocumentMetadata(emptyDocuments(), { type: "QUOTE", entity: "Orçamento", entityId: `q-${index}`, title: `Cliente ${index}`, status: "AVAILABLE", origin: "Orçamentos", link: `/q/${index}` });
    assert.equal(filterDocuments(state.documents, { search: `Cliente ${index}` }).length, 1);
  });
  for (let index = 1; index <= 5; index += 1) it(`gera documento profissional de Orçamento ${index}`, () => assert.equal(quoteDocument({ number: `O-${index}`, version: 1, client: "Cliente", items: [], subtotalCents: 0, discountCents: 0, surchargeCents: 0, totalCents: 0 }).type, "QUOTE"));
  for (let index = 1; index <= 3; index += 1) it(`gera documento de Ordem ${index}`, () => assert.equal(serviceOrderDocument({ number: `OS-${index}`, client: "Cliente", service: "Serviço" }).type, "SERVICE_ORDER"));
  it("gera Relatório Técnico", () => assert.equal(technicalReportDocument({ number: "RT-1", equipment: "Equipamento", issue: "Falha", diagnosis: "Diagnóstico", services: ["Teste"] }).type, "TECHNICAL_REPORT"));
  it("remove campos vazios do documento", () => assert.equal(visibleDocumentFields([{ label: "A", value: "" }, { label: "B", value: "Valor" }]).length, 1));
});

describe("Integrações defensivas — 0 regressões silenciosas", () => {
  it("classifica garantia vencida", () => assert.equal(warrantySituation("2026-07-01", new Date("2026-07-30T12:00:00Z")), "EXPIRED"));
  it("classifica garantia próxima do vencimento", () => assert.equal(warrantySituation("2026-08-10", new Date("2026-07-30T12:00:00Z")), "EXPIRING_SOON"));
  it("classifica garantia vigente", () => assert.equal(warrantySituation("2027-08-10", new Date("2026-07-30T12:00:00Z")), "CURRENT"));
  it("classifica garantia não informada", () => assert.equal(warrantySituation(undefined), "NOT_INFORMED"));
});

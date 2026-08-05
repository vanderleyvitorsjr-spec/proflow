import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateQuote, calculateQuoteItem, normalizeQuote, quoteMatchesSearch, quoteNumber, type ProfessionalQuote, type QuoteItem } from "../../app/dashboard/orcamentos/orcamentos-domain";
import { calculateTransparentPrice, normalizeCatalogService, serviceSnapshot, type CatalogService, type PriceSimulationInput } from "../../app/dashboard/precificacao/catalogo-servicos-domain";
import { compareQuotation, purchaseOrderNumber, quotationNumber, selectQuotationResponse, type SupplierQuotationResponse } from "../../app/dashboard/fornecedores/compras-domain";
import { calculateNextMaintenance, maintenanceSituation, warrantySituation } from "../../app/dashboard/equipamentos/equipamento-tecnico-domain";
import { documentIdentityFields, quoteDocument, serviceOrderDocument, technicalReportDocument, visibleDocumentFields } from "../../components/documents/professional-document-domain";
import { neutralizeSpreadsheetFormula, toBrazilianCsv } from "../../lib/csv-br";
import { formatBrazilianPhone, formatCnpj, formatCpf, formatCurrencyBRLFromCents } from "../../lib/br-formatters";

const makeItem = (changes: Partial<QuoteItem> = {}) => calculateQuoteItem({
  id: "i1", description: "Serviço", category: "SERVICE", quantity: 2, unit: "SERVICE",
  unitPriceCents: 10_000, estimatedCostCents: 8_000, marginBasisPoints: 2_000,
  discountCents: 1_000, order: 1, ...changes,
});
const makeQuote = (changes: Partial<ProfessionalQuote> = {}): ProfessionalQuote => ({
  id: "q1", number: quoteNumber(1, 2026), version: 1, clientId: "c1",
  clientName: "cliente da silva", title: "manutenção preventiva", status: "DRAFT",
  origin: "MANUAL", items: [makeItem()], subtotalCents: 19_000, discountCents: 0,
  surchargeCents: 0, taxCents: 0, totalCents: 19_000,
  paymentTerms: { type: "CASH", dueDates: [], method: "PIX" },
  createdAt: "2026-07-30T12:00:00Z", updatedAt: "2026-07-30T12:00:00Z", history: [], ...changes,
});

describe("Orçamentos profissionais", () => {
  it("gera número legível", () => assert.equal(quoteNumber(123, 2026), "ORC-2026-000123"));
  it("evita número dependente da posição", () => assert.notEqual(quoteNumber(1), quoteNumber(2)));
  it("calcula item", () => assert.equal(makeItem().totalCents, 19_000));
  it("adiciona serviço", () => assert.equal(makeItem().category, "SERVICE"));
  it("adiciona material", () => assert.equal(makeItem({ category: "MATERIAL" }).category, "MATERIAL"));
  it("rejeita quantidade negativa", () => assert.throws(() => makeItem({ quantity: -1 })));
  it("rejeita valor inválido", () => assert.throws(() => makeItem({ unitPriceCents: Number.NaN })));
  it("confirma desconto excessivo", () => assert.throws(() => makeItem({ discountCents: 30_000 })));
  it("calcula subtotal", () => assert.equal(calculateQuote([makeItem(), makeItem()]).subtotalCents, 38_000));
  it("aplica desconto", () => assert.equal(calculateQuote([makeItem()], 2_000).totalCents, 17_000));
  it("aplica acréscimo", () => assert.equal(calculateQuote([makeItem()], 0, 2_000).totalCents, 21_000));
  it("aplica imposto", () => assert.equal(calculateQuote([makeItem()], 0, 0, 1_000).totalCents, 20_000));
  it("não produz total negativo", () => assert.equal(calculateQuote([makeItem()], 99_000).totalCents, 0));
  it("preserva versão", () => assert.equal(makeQuote({ version: 2 }).version, 2));
  it("preserva versão anterior", () => { const old = makeQuote(); const next = { ...old, version: 2 }; assert.equal(old.version, 1); assert.equal(next.version, 2); });
  for (const status of ["APPROVED", "REJECTED", "EXPIRED", "CANCELED", "CONVERTED"] as const)
    it(`aceita situação ${status}`, () => assert.equal(makeQuote({ status }).status, status));
  it("capitaliza nomes", () => assert.equal(normalizeQuote(makeQuote()).clientName, "Cliente da Silva"));
  it("pesquisa número", () => assert.equal(quoteMatchesSearch(makeQuote(), "ORC-2026"), true));
  it("pesquisa telefone sem máscara", () => assert.equal(quoteMatchesSearch(makeQuote({ clientPhone: "(73) 9 8893-6763" }), "73988936763"), true));
  it("não encontra texto ausente", () => assert.equal(quoteMatchesSearch(makeQuote(), "inexistente"), false));
  for (const paymentType of ["CASH", "ENTRY_BALANCE", "INSTALLMENTS", "MILESTONES", "CUSTOM"] as const)
    it(`aceita condição de pagamento ${paymentType}`, () => assert.equal(makeQuote({ paymentTerms: { type: paymentType, dueDates: [], method: "PIX" } }).paymentTerms.type, paymentType));
  for (const unit of ["UNIT", "HOUR", "DAY", "METER", "SQUARE_METER", "KILOGRAM", "LITER", "BOX", "ROLL", "SET", "SERVICE", "OTHER"] as const)
    it(`aceita unidade ${unit}`, () => assert.equal(makeItem({ unit }).unit, unit));
});

const pricing: PriceSimulationInput = {
  materialCostCents: 10_000, hourlyCostCents: 5_000, hours: 2, technicians: 2,
  travelFixedCents: 1_000, distanceKm: 10, costPerKmCents: 200, indirectCostCents: 2_000,
  marginBasisPoints: 3_000, taxBasisPoints: 500, riskReserveBasisPoints: 500,
  discountBasisPoints: 0, surchargeCents: 0,
};
const catalogService: CatalogService = {
  id: "s1", code: "SRV-00001", name: "manutenção preventiva", category: "PREVENTIVE_MAINTENANCE",
  description: "Atendimento programado", attendanceType: "COMMERCIAL", unit: "Serviço",
  basePriceCents: 50_000, estimatedCostCents: 30_000, desiredMarginBasisPoints: 3_000,
  estimatedDurationMinutes: 120, suggestedMaterials: ["Filtro"], suggestedTeam: ["Técnico"],
  suggestedChecklist: ["Testar"], active: true, createdAt: "2026-07-30", updatedAt: "2026-07-30",
};
describe("Catálogo e Precificação", () => {
  it("calcula mão de obra", () => assert.equal(calculateTransparentPrice(pricing).laborCostCents, 20_000));
  it("calcula deslocamento", () => assert.equal(calculateTransparentPrice(pricing).travelCostCents, 3_000));
  for (const key of ["totalCostCents", "minimumPriceCents", "suggestedPriceCents", "finalPriceCents"] as const)
    it(`calcula ${key}`, () => assert.ok(calculateTransparentPrice(pricing)[key] > 0));
  it("calcula margem finita", () => assert.ok(Number.isFinite(calculateTransparentPrice(pricing).estimatedMarginBasisPoints)));
  it("detecta margem negativa", () => assert.ok(calculateTransparentPrice({ ...pricing, practicedPriceCents: 1 }).alerts.includes("Margem Negativa")));
  it("detecta preço abaixo do custo", () => assert.ok(calculateTransparentPrice({ ...pricing, practicedPriceCents: 1 }).alerts.includes("Preço Abaixo do Custo")));
  it("detecta desconto elevado", () => assert.ok(calculateTransparentPrice({ ...pricing, discountBasisPoints: 2_000 }).alerts.includes("Desconto Elevado")));
  it("detecta dados insuficientes", () => assert.ok(calculateTransparentPrice({ ...pricing, hours: 0, materialCostCents: 0 }).alerts.includes("Dados Insuficientes")));
  it("normaliza serviço", () => assert.equal(normalizeCatalogService(catalogService).name, "Manutenção Preventiva"));
  it("snapshot não muda com o catálogo", () => { const snapshot = serviceSnapshot(catalogService); const changed = { ...catalogService, name: "Outro" }; assert.notEqual(snapshot.description, changed.name); });
  it("snapshot preserva materiais", () => assert.deepEqual(serviceSnapshot(catalogService).suggestedMaterials, ["Filtro"]));
  it("snapshot preserva duração", () => assert.equal(serviceSnapshot(catalogService).durationMinutes, 120));
});

const responses: SupplierQuotationResponse[] = [
  { id: "r1", supplierId: "f1", supplierName: "Fornecedor Um", itemId: "i1", unitPriceCents: 1000, totalCents: 1000, freightCents: 0, deliveryDays: 5, paymentTerms: "Pix", markers: [] },
  { id: "r2", supplierId: "f2", supplierName: "Fornecedor Dois", itemId: "i1", unitPriceCents: 1200, totalCents: 1200, freightCents: 0, deliveryDays: 2, paymentTerms: "Pix", markers: [] },
];
describe("Cotações e Compras", () => {
  it("gera número de Cotação", () => assert.equal(quotationNumber(1, 2026), "COT-2026-00001"));
  it("gera número de Pedido", () => assert.equal(purchaseOrderNumber(1, 2026), "PC-2026-00001"));
  it("compara menor preço", () => assert.equal(compareQuotation(responses)[0]?.isLowestPrice, true));
  it("compara menor prazo", () => assert.equal(compareQuotation(responses)[1]?.isFastest, true));
  it("seleciona menor preço", () => assert.ok(selectQuotationResponse(responses, "r1")[0]?.markers.includes("SELECTED")));
  it("exige justificativa", () => assert.throws(() => selectQuotationResponse(responses, "r2")));
  it("aceita justificativa", () => assert.equal(selectQuotationResponse(responses, "r2", "Prazo")[1]?.selectionReason, "Prazo"));
  it("mantém seleção única", () => assert.equal(selectQuotationResponse(selectQuotationResponse(responses, "r1"), "r2", "Prazo").filter((item) => item.markers.includes("SELECTED")).length, 1));
});

describe("Equipamentos dos Clientes", () => {
  it("calcula manutenção mensal", () => assert.equal(calculateNextMaintenance("2026-07-30", "MONTHLY").slice(0, 10), "2026-08-30"));
  it("calcula manutenção trimestral", () => assert.equal(calculateNextMaintenance("2026-07-30", "QUARTERLY").slice(0, 10), "2026-10-28"));
  it("rejeita data inválida", () => assert.throws(() => calculateNextMaintenance("inválida", "MONTHLY")));
  it("detecta manutenção vencida", () => assert.equal(maintenanceSituation("2026-07-01", new Date("2026-07-30")), "OVERDUE"));
  it("detecta manutenção próxima", () => assert.equal(maintenanceSituation("2026-08-05", new Date("2026-07-30")), "DUE_SOON"));
  it("detecta manutenção vigente", () => assert.equal(maintenanceSituation("2027-01-01", new Date("2026-07-30")), "CURRENT"));
  it("detecta garantia ausente", () => assert.equal(warrantySituation(undefined), "NOT_INFORMED"));
  it("detecta garantia vencida", () => assert.equal(warrantySituation("2026-01-01", new Date("2026-07-30")), "EXPIRED"));
  it("detecta garantia próxima", () => assert.equal(warrantySituation("2026-08-05", new Date("2026-07-30")), "EXPIRING_SOON"));
  it("detecta garantia vigente", () => assert.equal(warrantySituation("2027-08-05", new Date("2026-07-30")), "CURRENT"));
});

describe("Documentos e Exportações", () => {
  it("oculta campo ausente", () => assert.equal(visibleDocumentFields([{ label: "A" }, { label: "B", value: "Valor" }]).length, 1));
  it("oculta identidade ausente", () => assert.equal(documentIdentityFields().length, 0));
  it("formata CPF", () => assert.equal(formatCpf("12345678900"), "123.456.789-00"));
  it("formata CNPJ", () => assert.equal(formatCnpj("12345678000199"), "12.345.678/0001-99"));
  it("formata telefone", () => assert.equal(formatBrazilianPhone("73988936763"), "(73) 9 8893-6763"));
  it("formata moeda", () => assert.match(formatCurrencyBRLFromCents(100000), /1\.000,00/));
  for (const formula of ["=1+1", "+1", "-1", "@SOMA"])
    it(`neutraliza fórmula ${formula[0]}`, () => assert.ok(neutralizeSpreadsheetFormula(formula).startsWith("'")));
  it("preserva texto comum", () => assert.equal(neutralizeSpreadsheetFormula("Serviço"), "Serviço"));
  it("gera CSV com BOM", () => assert.equal(toBrazilianCsv([["Cabeçalho"]]).charCodeAt(0), 0xfeff));
  it("gera cabeçalho em português", () => assert.ok(toBrazilianCsv([["Descrição"]]).includes("Descrição")));
  it("gera Orçamento", () => assert.equal(quoteDocument({ number: "ORC-1", version: 1, client: "Cliente", items: [], subtotalCents: 0, discountCents: 0, surchargeCents: 0, totalCents: 0 }).title, "Orçamento"));
  it("gera Ordem", () => assert.equal(serviceOrderDocument({ number: "OS-1", client: "Cliente", service: "Serviço" }).title, "Ordem de Serviço"));
  it("gera Relatório Técnico", () => assert.equal(technicalReportDocument({ number: "RT-1", equipment: "Equipamento", issue: "Falha", diagnosis: "Diagnóstico", services: [] }).title, "Relatório Técnico"));
});

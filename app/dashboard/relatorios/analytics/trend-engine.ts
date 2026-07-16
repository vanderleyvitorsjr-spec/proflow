import type { ReportTrend } from "../relatorios-types";
export const trendLabel = (trend: ReportTrend) =>
  ({
    UP: "Em alta",
    DOWN: "Em baixa",
    STABLE: "Estável",
    NOT_COMPARABLE: "Sem base comparável",
    INSUFFICIENT_DATA: "Dados insuficientes",
  })[trend];

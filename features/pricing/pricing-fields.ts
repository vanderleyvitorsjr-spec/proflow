export type PricingField = {
  name: string;
  label: string;
  placeholder: string;
};

export const pricingFields: PricingField[] = [
  {
    name: "distanceKm",
    label: "Deslocamento (km total)",
    placeholder: "Ex: 20",
  },
  {
    name: "estimatedHours",
    label: "Tempo estimado (horas)",
    placeholder: "Ex: 4",
  },
  {
    name: "materialCost",
    label: "Custo de materiais (R$)",
    placeholder: "0,00",
  },
];

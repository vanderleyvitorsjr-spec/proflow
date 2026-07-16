export type ReportStockItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  active: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  minimumQuantity: number;
  physicalQuantity: number;
  reservedQuantity: number;
  averageCostCents: number;
};
export type ReportStockMovement = {
  id: string;
  itemId: string;
  type: string;
  quantity: number;
  totalCostCents: number;
  date: string;
  source: string;
  serviceOrderId?: string;
  purchaseId?: string;
  canceled: boolean;
};
export type ReportStockPurchase = {
  id: string;
  purchaseDate: string;
  status: string;
  totalCents: number;
  receivedTotalCents: number;
  canceled: boolean;
  archived: boolean;
  items: { itemId: string; quantity: number; totalCents: number }[];
};
export type ReportStockSource = {
  items: ReportStockItem[];
  movements: ReportStockMovement[];
  purchases: ReportStockPurchase[];
};

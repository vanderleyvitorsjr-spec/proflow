export type StockView = "list" | "cards";
export type StockStatus = "ARCHIVED" | "OUT_OF_STOCK" | "LOW_STOCK" | "AVAILABLE";
export type StockCategory =
  "REFRIGERATION" | "ELECTRICAL" | "SAFETY" | "CONSUMABLES" | "CLEANING" | "OTHER";
export type StockUnit =
  "UNIT" | "PAIR" | "METER" | "KILOGRAM" | "LITER" | "BOX" | "PACKAGE" | "ROLL";
export type StockMovementType =
  | "ENTRY"
  | "EXIT"
  | "RETURN"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "LOSS"
  | "CONSUMPTION";
export type StockMovementSource = "MANUAL" | "IMPORT" | "SERVICE_ORDER" | "PURCHASE";
export type StockHistoryType =
  | "CREATED"
  | "UPDATED"
  | "ARCHIVED"
  | "MOVEMENT_CREATED"
  | "MOVEMENT_CANCELED"
  | "RESERVATION_CREATED"
  | "RESERVATION_UPDATED"
  | "RESERVATION_DIVERGENCE";

export type StockLocation = {
  name: string;
  room?: string;
  container?: string;
  description?: string;
};
export type StockHistoryEvent = {
  id: string;
  type: StockHistoryType;
  description: string;
  createdAt: string;
};
export type StockMovementHistory = { id: string; description: string; createdAt: string };
export type StockItem = {
  id: string;
  sequence: number;
  internalCode: string;
  name: string;
  description: string;
  category: StockCategory;
  unit: StockUnit;
  unitScale: number;
  barcode?: string;
  manufacturer?: string;
  supplierReference?: string;
  minimumQuantity: number;
  location: StockLocation;
  notes?: string;
  active: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  history: StockHistoryEvent[];
};
export type StockMovement = {
  id: string;
  itemId: string;
  type: StockMovementType | "SUPPLIER_RETURN";
  quantity: number;
  unitCostCents: number;
  totalCostCents: number;
  date: string;
  source: StockMovementSource;
  sourceId?: string;
  reason: string;
  notes?: string;
  originalMovementId?: string;
  serviceOrderId?: string;
  reservationId?: string;
  purchaseId?: string;
  purchaseItemId?: string;
  createdAt: string;
  canceledAt?: string;
  history: StockMovementHistory[];
};
export type StockReservationStatus =
  | "ACTIVE"
  | "PARTIALLY_CONSUMED"
  | "CONSUMED"
  | "PARTIALLY_RELEASED"
  | "RELEASED"
  | "DIVERGENT";
export type StockReservationDivergence =
  | "ORDER_CANCELED"
  | "ORDER_ARCHIVED"
  | "ORDER_UNAVAILABLE"
  | "ORDER_UPDATED"
  | "OVER_RESERVED"
  | "OVER_CONSUMED";
export type StockReservationHistory = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
};
export type StockReservation = {
  id: string;
  itemId: string;
  serviceOrderId: string;
  serviceOrderNumberSnapshot: string;
  serviceOrderTitleSnapshot: string;
  serviceOrderUpdatedAtSnapshot: string;
  purpose: string;
  quantity: number;
  consumedQuantity: number;
  releasedQuantity: number;
  status: StockReservationStatus;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  history: StockReservationHistory[];
};
export type StockPurchaseStatus =
  "DRAFT" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELED" | "ARCHIVED";
export type StockPurchaseHistory = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
};
export type StockPurchaseItem = {
  id: string;
  stockItemId: string;
  internalCodeSnapshot: string;
  nameSnapshot: string;
  unitSnapshot: StockUnit;
  unitScaleSnapshot: number;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCostCents: number;
  totalCents: number;
  notes?: string;
};
export type StockPurchaseFinancialSnapshot = {
  transactionId: string;
  number: string;
  totalCents: number;
  paidCents: number;
  openCents: number;
  status: string;
  accountId: string;
  accountName: string;
  canceled: boolean;
  archived: boolean;
  manuallyModified: boolean;
  updatedAt: string;
};
export type StockPurchase = {
  id: string;
  sequence: number;
  supplier: {
    name: string;
    document?: string;
    phone?: string;
    email?: string;
    notes?: string;
  };
  documentNumber?: string;
  purchaseDate: string;
  expectedDate?: string;
  status: StockPurchaseStatus;
  notes?: string;
  items: StockPurchaseItem[];
  totalCents: number;
  receivedTotalCents: number;
  financialTransactionId?: string;
  financialPurpose?: "PAYABLE";
  financialSnapshot?: StockPurchaseFinancialSnapshot;
  reconciliationReviewedAt?: string;
  reconciliationNotes?: string;
  manuallyModified: boolean;
  createdAt: string;
  updatedAt: string;
  canceledAt?: string;
  archivedAt?: string;
  history: StockPurchaseHistory[];
};
export type StockPurchaseReconciliation =
  | "MATCHED"
  | "PURCHASE_VALUE_INCREASED"
  | "PURCHASE_VALUE_DECREASED"
  | "PURCHASE_CANCELED"
  | "PURCHASE_ARCHIVED"
  | "FINANCIAL_CANCELED"
  | "FINANCIAL_ARCHIVED"
  | "FINANCIAL_UNAVAILABLE"
  | "MANUALLY_MODIFIED";
export type StockPreferences = {
  view: StockView;
  searchTerm: string;
  statusFilter: string;
  categoryFilter: string;
  unitFilter: string;
  locationFilter: string;
  stockFilter: string;
  includeArchived: boolean;
};
export type StockStorageState = {
  version: 3;
  revision: number;
  nextItemSequence: number;
  nextPurchaseSequence: number;
  items: StockItem[];
  movements: StockMovement[];
  reservations: StockReservation[];
  purchases: StockPurchase[];
  preferences: StockPreferences;
};
export type StockSnapshot = {
  item: StockItem;
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  averageCostCents: number;
  totalValueCents: number;
  status: StockStatus;
  movements: StockMovement[];
  reservations: StockReservation[];
};
export type StockSeedItem = readonly [
  string,
  string,
  string,
  StockCategory,
  StockUnit,
  number,
  number,
  number,
  string,
];

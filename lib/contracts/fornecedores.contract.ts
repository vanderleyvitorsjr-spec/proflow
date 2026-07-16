export type SupplierPublicReference = {
  id: string;
  code: string;
  name: string;
  legalName: string;
  document?: string;
  categories: string[];
  status: string;
  archived: boolean;
  updatedAt: string;
};

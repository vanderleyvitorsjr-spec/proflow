"use client";
import { equipmentTechnicalStorageAdapter } from "./equipamento-tecnico-storage-adapter";
export const equipmentTechnicalRepository = {
  read: () => equipmentTechnicalStorageAdapter.load(),
  save: (value: ReturnType<typeof equipmentTechnicalStorageAdapter.load>) => { equipmentTechnicalStorageAdapter.save(value); return value; },
};

"use client";
import { documentsStorageAdapter } from "./documentos-storage-adapter";
export const documentsRepository = { read: () => documentsStorageAdapter.load(), save: (value: ReturnType<typeof documentsStorageAdapter.load>) => { documentsStorageAdapter.save(value); return value; } };

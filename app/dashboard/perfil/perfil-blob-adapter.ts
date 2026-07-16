"use client";
const DB = "proflow-perfil",
  STORE = "media",
  allowed = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);
const db = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
export const profileBlobAdapter = {
  async put(file: File, limit: number) {
    if (file.size > limit) throw new Error("Arquivo acima do limite permitido.");
    if (!allowed.has(file.type)) throw new Error("Formato não permitido.");
    const database = await db(),
      id = crypto.randomUUID();
    await new Promise<void>((resolve, reject) => {
      const r = database.transaction(STORE, "readwrite").objectStore(STORE).put(file, id);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
    database.close();
    return { blobId: id, name: file.name, type: file.type, size: file.size };
  },
  async get(id: string) {
    const database = await db();
    return new Promise<Blob | undefined>((resolve, reject) => {
      const r = database.transaction(STORE).objectStore(STORE).get(id);
      r.onsuccess = () => {
        database.close();
        resolve(r.result);
      };
      r.onerror = () => reject(r.error);
    });
  },
  async remove(id: string) {
    const database = await db();
    database.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
    database.close();
  },
};

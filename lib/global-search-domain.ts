import type { GlobalSearchResult } from "./contracts/global-activity.contract";
export function normalizeGlobalSearch(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR").replace(/[^\p{L}\p{N}]/gu, "");
}
export function filterGlobalSearch(items: GlobalSearchResult[], query: string, limit = 30) {
  const term = normalizeGlobalSearch(query);
  return (term ? items.filter((item) => normalizeGlobalSearch(`${item.title} ${item.description} ${item.keywords}`).includes(term)) : items).slice(0, Math.max(1, limit));
}
export function groupGlobalSearch(items: GlobalSearchResult[]) {
  return items.reduce<Record<string, GlobalSearchResult[]>>((groups, item) => {
    (groups[item.source] ??= []).push(item);
    return groups;
  }, {});
}

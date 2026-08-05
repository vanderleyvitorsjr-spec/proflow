export function companyStorageKey(companyId: string, domain: string, version = 1) {
  if (!companyId.trim()) throw new Error("A empresa autenticada é obrigatória.");
  const safeDomain = domain
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9-]/g, "-");

  return `proflow:${companyId}:${safeDomain}:v${version}`;
}

export function legacyStorageKey(domain: string, version = 1) {
  return `proflow:${domain}:v${version}`;
}

let activeCompanyId: string | null = null;

export function setCompanyStorageContext(companyId: string) {
  if (!companyId.trim()) throw new Error("A empresa autenticada é obrigatória.");
  activeCompanyId = companyId;
}

export function clearCompanyStorageContext() {
  activeCompanyId = null;
}

export function getCompanyStorageContext() {
  return activeCompanyId;
}

export function scopedBrowserStorageKey(domain: string, version = 1) {
  if (!activeCompanyId) {
    throw new Error("O contexto da empresa ainda não está disponível.");
  }

  return companyStorageKey(activeCompanyId, domain, version);
}

export function scopedBrowserBackupKey(domain: string, version = 1) {
  return `${scopedBrowserStorageKey(domain, version)}:backup`;
}

export function hasLegacyBrowserData(domain: string, version = 1) {
  return (
    typeof window !== "undefined" &&
    window.localStorage.getItem(legacyStorageKey(domain, version)) !== null
  );
}

/**
 * Copia dados da antiga chave global para a chave isolada da empresa somente
 * quando a chave nova ainda está vazia.
 *
 * A chave antiga não é apagada. Assim, a recuperação é reversível e não
 * destrutiva.
 */
export function copyLegacyBrowserDataToCompany(
  domain: string,
  version = 1,
): boolean {
  if (typeof window === "undefined") return false;

  const scopedKey = scopedBrowserStorageKey(domain, version);
  if (window.localStorage.getItem(scopedKey) !== null) return false;

  const legacyKey = legacyStorageKey(domain, version);
  const legacyValue = window.localStorage.getItem(legacyKey);
  if (legacyValue === null) return false;

  window.localStorage.setItem(scopedKey, legacyValue);

  const legacyBackup = window.localStorage.getItem(`${legacyKey}:backup`);
  if (legacyBackup !== null) {
    window.localStorage.setItem(`${scopedKey}:backup`, legacyBackup);
  }

  return true;
}

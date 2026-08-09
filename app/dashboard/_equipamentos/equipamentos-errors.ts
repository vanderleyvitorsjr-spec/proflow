export class EquipmentDomainError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export class EquipmentStorageError extends Error {}

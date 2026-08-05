# Auditoria e correção das migrations do ProFlow

## Escopo

Foram revisadas as 14 migrations e o `schema.prisma`.

As migrations já aplicadas foram preservadas para evitar divergência de checksum:

- `20260709123000_initial_schema`
- `20260711150000_financial_domain_foundation`
- `20260711154000_financial_domain_foundation_fixes`
- `20260711162000_financial_transactions_foundation`

## Correções realizadas

### `20260711170000_contas_receber_financial_transaction`

- removida a sintaxe inválida `ADD CONSTRAINT IF NOT EXISTS`;
- adicionadas verificações válidas em `pg_constraint`;
- corrigida a verificação case-sensitive do enum `ReceivableStatus`;
- `status` passou a usar o enum `ReceivableStatus`, conforme `schema.prisma`;
- `paymentMethod` passou a usar o enum `PaymentMethod`, conforme `schema.prisma`;
- incluída reparação segura para colunas que tenham sido criadas como `TEXT` na tentativa parcial;
- índices foram mantidos idempotentes.

### Migrations posteriores

As verificações de enums foram corrigidas para respeitar nomes PostgreSQL com aspas e maiúsculas usando `to_regtype`, evitando recriação em uma reaplicação parcial:

- `AssetStatus`
- `AssetCondition`
- `EquipmentHistoryEventType`
- `MaintenanceFrequencyType`
- `ChecklistCategory`
- `ChecklistItemType`
- `ServiceOrderChecklistStatus`
- `ServiceOrderAttachmentType`
- `ServiceOrderAttachmentCategory`
- `StorageProvider`
- `ServiceOrderAcceptanceType`
- `ServiceOrderAcceptanceStatus`

### Aceites de Ordem de Serviço

Foi adicionado o índice único de `attachmentId` exigido pelo `schema.prisma`:

- `service_order_acceptances_attachmentId_key`

## Estado esperado no banco

A migration atualmente registrada como falha deve ser marcada como revertida antes de reaplicar:

```powershell
npx prisma migrate resolve --rolled-back 20260711170000_contas_receber_financial_transaction
```

Depois:

```powershell
npm run db:migrate:deploy
npm run db:status
npm run db:generate
```

Não use `prisma db push` nem `prisma migrate reset`.

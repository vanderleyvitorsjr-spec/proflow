import { getCrmPricingReferenceAction, listActiveCrmPricingReferencesAction } from "@/features/crm/crm-actions";
export const pricingCrmGateway = { list: listActiveCrmPricingReferencesAction, get: getCrmPricingReferenceAction };

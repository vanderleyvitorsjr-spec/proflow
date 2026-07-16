import { applyServiceOrderPricingAction, getServiceOrderPricingReferenceAction, listEligibleServiceOrderPricingReferencesAction } from "@/app/dashboard/ordens/ordens-actions";
export const pricingOrdersGateway = { list: listEligibleServiceOrderPricingReferencesAction, get: getServiceOrderPricingReferenceAction, apply: applyServiceOrderPricingAction };

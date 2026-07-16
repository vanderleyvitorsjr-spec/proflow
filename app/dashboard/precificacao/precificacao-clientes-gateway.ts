import { getClientPublicReferenceAction, listActiveClientPublicReferencesAction } from "@/app/dashboard/clientes/actions";
export const pricingClientsGateway = { list: listActiveClientPublicReferencesAction, get: getClientPublicReferenceAction };

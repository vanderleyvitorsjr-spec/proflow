import { z } from "zod";

export const pricingPreviewSchema = z.object({
  distanceKm: z.coerce.number().min(0),
  estimatedHours: z.coerce.number().min(0),
  materialCost: z.coerce.number().min(0),
});

export type PricingPreviewInput = z.infer<typeof pricingPreviewSchema>;

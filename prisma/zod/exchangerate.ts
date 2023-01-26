import * as z from "zod"
import * as imports from "../zod-utils"

export const _ExchangeRateModel = z.object({
  id: z.number().int(),
  nextUpdateUnix: z.number().int(),
  currency: z.string(),
  rates: z.string(),
})

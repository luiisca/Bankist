import * as z from "zod"
import * as imports from "../zod-utils"
import { CompleteCategory, RelatedCategoryModel } from "./index"

export const RecordModel = z.object({
  id: z.bigint(),
  title: z.string().nullish(),
  amount: z.number().int(),
  type: z.string(),
  frequency: z.number().int(),
  inflEnabled: z.boolean(),
  country: z.string(),
  inflation: z.number().int(),
  currency: z.string(),
  categoryId: z.bigint(),
})

export interface CompleteRecord extends z.infer<typeof RecordModel> {
  category: CompleteCategory
}

/**
 * RelatedRecordModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedRecordModel: z.ZodSchema<CompleteRecord> = z.lazy(() => RecordModel.extend({
  category: RelatedCategoryModel,
}))

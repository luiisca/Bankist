import * as z from "zod"
import * as imports from "../zod-utils"
import { CompleteUser, RelatedUserModel, CompleteRecord, RelatedRecordModel } from "./index"

export const CategoryModel = z.object({
  id: z.bigint(),
  title: z.string(),
  budget: z.number().int(),
  currency: z.string(),
  type: z.string(),
  inflEnabled: z.boolean(),
  inflType: z.string(),
  country: z.string(),
  inflVal: z.number().int(),
  icon: z.string(),
  freqType: z.string(),
  frequency: z.number().int(),
  userId: z.string(),
})

export interface CompleteCategory extends z.infer<typeof CategoryModel> {
  user: CompleteUser
  records: CompleteRecord[]
}

/**
 * RelatedCategoryModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedCategoryModel: z.ZodSchema<CompleteCategory> = z.lazy(() => CategoryModel.extend({
  user: RelatedUserModel,
  records: RelatedRecordModel.array(),
}))

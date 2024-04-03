import * as z from "zod"
import * as imports from "../zod-utils"
import { CompleteAccount, RelatedAccountModel, CompleteSalary, RelatedSalaryModel, CompleteCategory, RelatedCategoryModel } from "./index"

export const UserModel = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullish(),
  emailVerified: z.date().nullish(),
  image: z.string().nullish(),
  completedOnboarding: z.boolean(),
  country: z.string(),
  inflation: z.number().int(),
  currency: z.string(),
  investPerc: z.number().int(),
  indexReturn: z.number().int(),
})

export interface CompleteUser extends z.infer<typeof UserModel> {
  accounts: CompleteAccount[]
  salary: CompleteSalary[]
  categories: CompleteCategory[]
}

/**
 * RelatedUserModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedUserModel: z.ZodSchema<CompleteUser> = z.lazy(() => UserModel.extend({
  accounts: RelatedAccountModel.array(),
  salary: RelatedSalaryModel.array(),
  categories: RelatedCategoryModel.array(),
}))

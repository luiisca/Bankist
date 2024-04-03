import * as z from "zod"
import * as imports from "../zod-utils"
import { CompleteUser, RelatedUserModel } from "./index"

export const AccountModel = z.object({
  id: z.string(),
  type: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  refresh_token: z.string().nullish(),
  access_token: z.string().nullish(),
  expires_at: z.number().int().nullish(),
  token_type: z.string().nullish(),
  scope: z.string().nullish(),
  id_token: z.string().nullish(),
  userId: z.string(),
})

export interface CompleteAccount extends z.infer<typeof AccountModel> {
  user?: CompleteUser | null
}

/**
 * RelatedAccountModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedAccountModel: z.ZodSchema<CompleteAccount> = z.lazy(() => AccountModel.extend({
  user: RelatedUserModel.nullish(),
}))

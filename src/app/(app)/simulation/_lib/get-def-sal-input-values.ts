import { DEFAULT_COUNTRY, DEFAULT_CURRENCY, OptionsType, SELECT_PER_CAT_VAL, getSelectOptionWithFallback } from "~/lib/constants";
import { getCurrencyLocaleName } from "~/lib/sim-settings";
import { RouterOutputs } from "~/lib/trpc/shared";

export default function getDefSalInputValues({ salary, user }: { salary?: RouterOutputs["simulation"]["salaries"]["get"][0]; user: NonNullable<RouterOutputs['user']['get']> }) {
    const currency = salary?.currency || user.currency || DEFAULT_CURRENCY;
    const taxType = salary?.taxType as OptionsType
    const userCountry = user.country || DEFAULT_COUNTRY;

    const optionFields = {
        currency: {
            value: currency,
            label: getCurrencyLocaleName(currency, userCountry)
        },
        taxType: getSelectOptionWithFallback(taxType, SELECT_PER_CAT_VAL),
    }


    let defaultValues;
    if (salary) {
        defaultValues = {
            ...salary,
            ...optionFields,
            variance: salary?.variance,
        }
    } else {
        defaultValues = {
            ...optionFields,
        }
    }

    return defaultValues
}

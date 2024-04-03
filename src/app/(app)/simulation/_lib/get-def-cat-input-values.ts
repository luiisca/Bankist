import { DEFAULT_COUNTRY, DEFAULT_CURRENCY, OptionsType, SELECT_PER_CAT_VAL, SELECT_EXPENSE_VAL, getSelectOptionWithFallback, DEFAULT_FREQUENCY, getSelectOption } from "~/lib/constants";
import { getCountryOptionLabel, getCurrencyLocaleName } from "~/lib/sim-settings";
import { RouterOutputs } from "~/lib/trpc/shared";

export default function getDefCatInputValues({ category, user }: { category?: RouterOutputs["simulation"]["categories"]["get"][0]; user: NonNullable<RouterOutputs['user']['get']> }) {
    const currency = category?.currency || user.currency || DEFAULT_CURRENCY;
    const userCountry = user.country || DEFAULT_COUNTRY;
    const catCountry = category?.country || userCountry;
    const inflType = category?.inflType as OptionsType
    const type = category?.type as OptionsType;
    const freqType = category?.freqType as OptionsType;
    const inflVal = category?.inflVal || user.inflation;
    const frequency = category?.frequency || DEFAULT_FREQUENCY;

    const optionFields = {
        currency: {
            value: currency,
            label: getCurrencyLocaleName(currency, userCountry)
        },
        country: {
            value: catCountry,
            label: getCountryOptionLabel(catCountry),
        },
        inflType: getSelectOptionWithFallback(inflType, SELECT_PER_CAT_VAL),
        type: getSelectOptionWithFallback(type, SELECT_EXPENSE_VAL),
        freqType: getSelectOptionWithFallback(freqType, SELECT_PER_CAT_VAL),
    }


    let defaultValues;
    if (category) {
        defaultValues = {
            ...category,
            ...optionFields,
            inflVal,
            records: category?.records?.map((record) => ({
                ...record,
                country: {
                    value: record.country,
                    label: getCountryOptionLabel(record.country),
                },
                currency: {
                    value: record.currency,
                    label: getCurrencyLocaleName(record.currency, user.country)
                },
                type: getSelectOption(record.type as OptionsType),
                title: record.title || "",
                inflation: record.inflation || user.inflation,
            })),
            frequency,
        }
    } else {
        defaultValues = {
            ...optionFields,
            frequency,
            inflEnabled: true,
        }
    }

    return defaultValues
}

export const WEBAPP_URL = process.env.NEXT_PUBLIC_VERCEL_URL;
export const LOGO = "/logo.png";
export const LOGO_ICON = "/icon.png";

export const FLAG_URL =
    "http://purecatamphetamine.github.io/country-flag-icons/3x2/{XX}.svg";

export const INFLATION_API_END =
    "https://api.api-ninjas.com/v1/inflation?country=";
export const MAJOR_CURRENCY_CODES = [
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "CHF",
    "AUD",
    "CAD",
    "CNY",
    "NZD",
    "INR",
    "BZR",
    "SEK",
    "ZAR",
    "HKD",
    "PEN",
    "MXN",
    "CLP",
];

export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_COUNTRY = "US";
export const DEFAULT_INVEST_PERC = 60;
export const DEFAULT_INFLATION = 7;
export const DEFAULT_INDEX_RETURN = 7;
export const DEFAULT_FREQUENCY = 12;
export const DEFAULT_TAX_PERCENT = 30;

export const MIN_YEARS = 1;
export const MAX_YEARS = 200;

export const SELECT_PER_CAT_VAL = "perCat";
export const SELECT_PER_CAT_LABEL = "Per Category";
export const SELECT_PER_REC_VAL = "perRec";
export const SELECT_PER_REC_LABEL = "Per Record";
export const SELECT_INCOME_VAL = "income";
export const SELECT_INCOME_LABEL = "Income";
export const SELECT_EXPENSE_VAL = "expense";
export const SELECT_EXPENSE_LABEL = "Expense";
export const SELECT_DISABLED_VAL = "";
export const SELECT_DISABLED_LABEL = "Disabled";

export type OptionsType =
    | "income"
    | "expense"
    | "perRec"
    | "perCat"
    | "disabled";

export const SELECT_LABELS_MAP = {
    income: SELECT_INCOME_LABEL,
    expense: SELECT_EXPENSE_LABEL,
    perCat: SELECT_PER_CAT_LABEL,
    perRec: SELECT_PER_REC_LABEL,
    disabled: SELECT_DISABLED_VAL,
}
export const SELECT_VALUES_MAP = {
    income: SELECT_INCOME_VAL,
    expense: SELECT_EXPENSE_VAL,
    perCat: SELECT_PER_CAT_VAL,
    perRec: SELECT_PER_REC_VAL,
    disabled: SELECT_DISABLED_LABEL,
}

export function getSelectOption(option: OptionsType) {
    return {
        value: SELECT_VALUES_MAP[option],
        label: SELECT_LABELS_MAP[option]
    }
}
export function getSelectOptionWithFallback(option: OptionsType | undefined, fallbackOption: OptionsType) {
    const value = SELECT_VALUES_MAP[option || fallbackOption];

    return {
        value,
        label: SELECT_LABELS_MAP[option || fallbackOption]
    }
}

export const BASIC_BAL_TYPES = [getSelectOption("income"), getSelectOption("expense")];
export const BASIC_GROUP_TYPES = [getSelectOption("perCat"), getSelectOption("perRec")];

export const CATEGORY_INFL_TYPES = [
    ...BASIC_GROUP_TYPES,
];

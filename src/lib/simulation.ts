import { DEFAULT_FREQUENCY, MAX_YEARS, MIN_YEARS } from "./constants";
import log from "./lib";
import { RouterOutputs } from "./trpc/shared";

export type AnnualIncomesExpensesType = {
    totalIncome: number;
    totalExpense: number;
    categoriesIncomesExpenses: (number | number[])[];
    salaryBreakdowns: {
        amountBefTax: number;
        amountAftTax: number;
        taxPercent: number;
    }[];
};

const convertToUSD = (currency: string, amount: number) => {
    if (currency !== "USD") {
        // console.log("no USD currency set");
        // console.log("converting to USD");
        // return toUSD(currency, amount)
    }
    return amount;
};

const getRate = (x: number) => x / 100;

export function getSalaryBreakdownForYear(salary: RouterOutputs["simulation"]["salaries"]["get"][0], reqYear: number) {
    let yearlyAmount = salary.amount;
    let yearlyTaxes = salary.taxPercent;
    const v = salary.variance;

    if (v) {
        for (let index = 0; index < v.length; index++) {
            const crrPeriod = v[index]
            const lastPeriod = v[v.length - 1]

            const crrPeriodYear = crrPeriod?.from
            const nextPeriodYear = v[index + 1]?.from
            const lastPeriodYear = lastPeriod?.from

            const foundInCrrPeriod = (crrPeriodYear && nextPeriodYear) && (reqYear >= crrPeriodYear && reqYear < nextPeriodYear)
            const foundInLastPeriod = lastPeriodYear && reqYear >= lastPeriodYear

            if (foundInCrrPeriod) {
                yearlyAmount = crrPeriod.amount;
                yearlyTaxes = crrPeriod.taxPercent;

                break;
            }

            if (foundInLastPeriod) {
                yearlyAmount = lastPeriod.amount;
                yearlyTaxes = lastPeriod.taxPercent;

                break;
            }
        }
    }

    const taxPercent =
        salary.taxType == "perCat"
            ? salary.taxPercent
            : yearlyTaxes;
    const amountBefTax = salary.variance
        ? yearlyAmount
        : salary.amount;
    const amountAftTax = amountBefTax * (1 - getRate(taxPercent))

    return {
        taxPercent,
        amountBefTax,
        amountAftTax,
    };
};

function calcCrrYearBalance({
    inflation,
    budget,
    frequency,
    crrYear,
}: {
    inflation?: number;
    budget: number;
    frequency: number;
    crrYear?: number;
}) {
    if (inflation) {
        const prevYearBalance = budget;

        // only first year balance needs to be multiplied by frequency, 
        // subsequent ones just apply inflation to previous balance
        const freqMod = crrYear === 1 ? frequency : 1;
        const P = prevYearBalance * freqMod;
        const i = getRate(inflation);
        return P * (1 + i);
    } else {
        return budget * frequency;
    }
}

export const calcNetWorthOverYears = ({
    categories,
    salaries,
    years,
    investPerc,
    indexReturn,
}: {
    categories: RouterOutputs["simulation"]["categories"]["get"];
    salaries: RouterOutputs["simulation"]["salaries"]["get"];
    years: number;
    investPerc: number;
    indexReturn: number;
}) => {
    years = years && years <= 0 ? MIN_YEARS : years > MAX_YEARS ? MAX_YEARS : years;

    let finalNetWorth = 0;
    let totalInvestedAmount = 0;

    let annualIncomesExpenses: AnnualIncomesExpensesType[] = [] as AnnualIncomesExpensesType[]

    for (let index = 0; index < years; index++) {
        const crrYear = index + 1;
        let crrYearTotalIncome = 0;
        let crrYearTotalExpense = 0;
        let crrYearCategoriesIncomesExpenses: AnnualIncomesExpensesType['categoriesIncomesExpenses'] = Array(categories.length).fill(null);
        let crrYearSalaryBreakdowns: AnnualIncomesExpensesType['salaryBreakdowns'] = [] as AnnualIncomesExpensesType['salaryBreakdowns'];
        ////

        // categories
        categories.forEach((crrCat, crrCatIndex) => {
            const crrCatHasRecords = crrCat.records && crrCat.records.length > 0

            if (!crrCatHasRecords) {
                // helpers
                const isCrrCatIncome = crrCat.type === "income";
                const isCrrCatExpense = crrCat.type === "expense";
                const inflationDisabled = isCrrCatIncome || !crrCat.inflEnabled;
                const inflationEnabled = isCrrCatExpense && crrCat.inflEnabled;

                const crrCatBudget = convertToUSD(crrCat.currency, crrCat.budget);
                const frequency =
                    crrCat.freqType === "perCat" ? crrCat.frequency : DEFAULT_FREQUENCY;
                ///

                if (inflationDisabled) {
                    const balance = calcCrrYearBalance({ budget: crrCatBudget, frequency, crrYear });

                    crrYearCategoriesIncomesExpenses[crrCatIndex] = balance

                    if (isCrrCatIncome) {
                        crrYearTotalIncome += balance

                        return;
                    }

                    if (isCrrCatExpense) {
                        crrYearTotalExpense += balance

                        return
                    }

                    return;
                }

                if (inflationEnabled) {
                    const prevBalance = annualIncomesExpenses[index - 1]?.categoriesIncomesExpenses[crrCatIndex] ?? crrCatBudget
                    const balance = calcCrrYearBalance({ inflation: crrCat.inflVal, budget: prevBalance as number, frequency, crrYear })

                    crrYearCategoriesIncomesExpenses[crrCatIndex] = balance

                    if (isCrrCatIncome) {
                        crrYearTotalIncome += balance

                        return;
                    }

                    if (isCrrCatExpense) {
                        crrYearTotalExpense += balance

                        return
                    }

                    return;
                }

                return;
            }

            if (crrCatHasRecords) {
                crrCat.records.forEach(
                    (crrRec, crrRecIndex: number) => {
                        const crrRecAmount = convertToUSD(
                            crrCat.currency === "perRec"
                                ? crrRec.currency
                                : crrCat.currency,
                            crrRec.amount
                        );

                        // helpers
                        const isCrrRecIncome = crrRec.type === "income";
                        const isCrrRecExpense = crrRec.type === "expense";
                        const inflationDisabled = crrCat.inflEnabled && (isCrrRecIncome || !crrRec.inflEnabled);
                        const inflationEnabled = crrCat.inflEnabled && (isCrrRecExpense && crrRec.inflEnabled);

                        const frequency =
                            crrCat.freqType === "perRec"
                                ? crrRec.frequency
                                : crrCat.frequency;
                        ///

                        if (inflationDisabled) {
                            const balance = calcCrrYearBalance({ budget: crrRecAmount, frequency });

                            crrYearCategoriesIncomesExpenses[crrCatIndex] = crrYearCategoriesIncomesExpenses[crrCatIndex] ?? [];
                            (crrYearCategoriesIncomesExpenses[crrCatIndex] as number[]).push(balance)

                            if (isCrrRecIncome) {
                                crrYearTotalIncome += balance

                                return;
                            }

                            if (isCrrRecExpense) {
                                crrYearTotalExpense += balance

                                return
                            }

                            return;
                        }
                        if (inflationEnabled) {
                            const prevBalance = (annualIncomesExpenses[index - 1]?.categoriesIncomesExpenses[crrCatIndex] as number[])?.[crrRecIndex] ?? crrRecAmount
                            const freqMod = crrYear === 1 ? frequency : 1;
                            const P = prevBalance * freqMod;
                            const i =
                                crrCat.inflType === "perRec"
                                    ? getRate(crrRec.inflation)
                                    : getRate(crrCat.inflVal);
                            const balance = P * (1 + i);

                            crrYearCategoriesIncomesExpenses[crrCatIndex] = crrYearCategoriesIncomesExpenses[crrCatIndex] ?? [];
                            (crrYearCategoriesIncomesExpenses[crrCatIndex] as number[]).push(balance);

                            if (isCrrRecIncome) {
                                crrYearTotalIncome += balance

                                return;
                            }

                            if (isCrrRecExpense) {
                                crrYearTotalExpense += balance

                                return
                            }

                            return;
                        }
                    }
                )

                return;
            }
        })

        // salaries
        salaries.forEach((salary) => {
            const crrYearSalaryBreakdown = getSalaryBreakdownForYear(salary, crrYear);

            crrYearSalaryBreakdowns.push(crrYearSalaryBreakdown)

            crrYearTotalIncome += crrYearSalaryBreakdown.amountAftTax
        })

        // update annualIncomesExpenses
        annualIncomesExpenses[index] = {
            totalIncome: crrYearTotalIncome,
            totalExpense: crrYearTotalExpense,
            categoriesIncomesExpenses: crrYearCategoriesIncomesExpenses,
            salaryBreakdowns: crrYearSalaryBreakdowns
        }

        // investment
        const crrYearNetIncome = crrYearTotalIncome - crrYearTotalExpense;
        const crrYearInvestmentAmount = crrYearNetIncome * getRate(investPerc);
        const crrYearInvestedAmount = totalInvestedAmount + crrYearInvestmentAmount;
        const crrYearInvestmentReturn = crrYearInvestedAmount * getRate(indexReturn)
        totalInvestedAmount = crrYearInvestedAmount + crrYearInvestmentReturn;

        // final networth
        const crrYearRemainingNetIncome = crrYearNetIncome - crrYearInvestmentAmount
        finalNetWorth = crrYearRemainingNetIncome + crrYearInvestmentReturn;
    }

    return {
        finalNetWorth,
        annualIncomesExpenses,
    };
};

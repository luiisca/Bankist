import { v4 as uuidv4 } from 'uuid';

import { formatAmount } from "~/lib/sim-settings";
import { RouterOutputs } from "~/lib/trpc/shared";
import { AnnualIncomesExpensesType } from "~/lib/simulation";
import { ListItem } from '../_components/balance-history/list-item';
import { BalanceHistoryCategoryItemType } from './balance-history-context';

export function instantiateSalaries(selectedYearIE: AnnualIncomesExpensesType, salaries: RouterOutputs['simulation']['salaries']['get']) {
    // selectedYear will always be smaller than simulatedYears, thus annualIncomesExpenses[selectedYear - 1] should never be undefined
    return selectedYearIE.salaryBreakdowns.map((breakdown, index) => {
        // salary should never be undefined as it is always in sync with breakdown
        const salary = salaries[index] as RouterOutputs['simulation']['salaries']['get'][0];

        const key = uuidv4()
        return (
            <ListItem
                key={key}
                infoBubble={
                    <>
                        <p>Amount: </p>
                        <p>{formatAmount(breakdown.amountBefTax)}</p>
                        <p>Tax Perc: </p>
                        <p>{breakdown.taxPercent}%</p>
                    </>
                }
                title={salary.title}
                type={"salary"}
                total={formatAmount(
                    Math.abs(breakdown.amountAftTax)
                )}
            />
        )
    })
}

export function instantiateCategory(category: RouterOutputs['simulation']['categories']['get'][0], categoryIE: number | number[]) {
    let instantiatedCategory: BalanceHistoryCategoryItemType = {} as BalanceHistoryCategoryItemType

    const key = uuidv4()
    if (Array.isArray(categoryIE)) {
        let recordsTypes: string[] = [''];
        const instantiatedRecords = categoryIE.map((recordIE, recordIEIndex) => {
            const record = category?.records[recordIEIndex] as RouterOutputs['simulation']['categories']['get'][0]['records'][0];

            const key = uuidv4()

            recordsTypes[recordIEIndex] = record.type
            return (
                <ListItem
                    key={key}
                    infoBubble={
                        <>
                            <p>Inflation: </p>
                            <p>
                                {record.type === "expense"
                                    ? record.inflation
                                    : 0}
                                %
                            </p>
                            <p>Frequency: </p>
                            <p>{record.frequency} / 12 </p>
                        </>
                    }
                    title={record.title}
                    type={record.type}
                    total={formatAmount(
                        Math.abs(recordIE)
                    )}
                    parentTitle={category.title}
                    record
                />
            )
        })

        instantiatedCategory = {
            type: category.type,
            element: null,
            records: {
                types: recordsTypes,
                elements: instantiatedRecords
            }
        }
    } else {
        instantiatedCategory = {
            type: category.type,
            element: (
                <ListItem
                    key={key}
                    title={category.title}
                    type={category.type}
                    total={formatAmount(Math.abs(categoryIE))}
                />
            ),
            records: null
        }
    }

    return instantiatedCategory
}
export function instantiateCategories(selectedYearIE: AnnualIncomesExpensesType, categories: RouterOutputs['simulation']['categories']['get']) {
    return selectedYearIE.categoriesIncomesExpenses.map((categoryIE, categoryIEIndex) => {
        const category = categories[categoryIEIndex] as RouterOutputs['simulation']['categories']['get'][0];
        return instantiateCategory(category, categoryIE)
    })
}

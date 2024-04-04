'use client'

import { useContext, useEffect, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { CircleOff } from "lucide-react";

import { formatAmount } from "~/lib/sim-settings"
import { AnnualIncomesExpensesType } from "~/lib/simulation";

import { cn } from "~/lib/cn";
import Filters, { TFilters, filters } from "./filters";
import EmptyScreen from "~/components/ui/empty-screen";
import { instantiateCategories, instantiateSalaries } from "../../_lib/instantiate-balance-history-items";
import { api } from "~/lib/trpc/react";
import { Tooltip } from "~/components/ui";
import TitleWithInfo from "../title-with-info";
import Switch from "~/components/ui/core/switch";
import { BalanceHistoryContext } from "../../_lib/balance-history-context";
import { BalanceContext } from "../../_lib/balance-context";
import shouldRunSim from "../../_lib/should-run-sim";
import log from "~/lib/lib";

export default function BalanceHistoryList() {
    const { state: { instantiatedBalanceHistoryItems, selectedYear }, dispatch: balanceHistoryDispatch } = useContext(BalanceHistoryContext)
    const { state: { annualIncomesExpenses } } = useContext(BalanceContext);

    const utils = api.useUtils()
    useEffect(() => {
        const categories = utils.simulation.categories.get.getData()
        const salaries = utils.simulation.salaries.get.getData()
        const { _shouldRunSim } = shouldRunSim(categories, salaries)
        if (_shouldRunSim) {
            balanceHistoryDispatch({
                type: 'SET',
                state: {
                    instantiatedBalanceHistoryItems: {
                        categories: instantiateCategories(annualIncomesExpenses[selectedYear - 1]!, categories!),
                        salaries: instantiateSalaries(annualIncomesExpenses[selectedYear - 1]!, salaries!),
                    },
                }
            })
        }
    }, [selectedYear]) // reinstantiate all history items. selectedYear is updated by history filter and run sim form

    const crrFilterState = useState(filters[0] as TFilters);
    const [hidden, setHidden] = useState(false);
    const [crrFilter] = crrFilterState;

    const [ulAnimationParentRef] = useAutoAnimate<HTMLUListElement>();

    if (!instantiatedBalanceHistoryItems || !instantiatedBalanceHistoryItems.categories || !instantiatedBalanceHistoryItems.salaries) {
        return null
    }

    return (
        <div className="mb-4 flex flex-col space-y-4">
            {/* title */}
            <div className="flex items-center space-x-2">
                <TitleWithInfo
                    Title={() => <h2 className="text-lg font-medium">Balance</h2>}
                    // TODO -- improve wording
                    infoCont={
                        <>
                            It gives you a clear picture of how much <br />
                            you would have spent in <br />
                            each category for the inputted year. <br />
                        </>
                    }
                />
                <Tooltip content={`${hidden ? "Enable" : "Disable"} balance`}>
                    <div className="self-center rounded-md p-2 hover:bg-gray-200 dark:hover:bg-transparent">
                        <Switch
                            id="hidden"
                            checked={!hidden}
                            onCheckedChange={() => {
                                setHidden(!hidden);
                            }}
                        />
                    </div>
                </Tooltip>
            </div>
            {!hidden && ((instantiatedBalanceHistoryItems.categories.length > 0 && instantiatedBalanceHistoryItems.salaries.length > 0) ? (
                <div className="flex flex-col space-y-4">
                    <Filters crrFilterState={crrFilterState} />
                    <div
                        className={cn(
                            "mb-16 overflow-hidden rounded-md border border-transparent bg-white dark:bg-dark-250",
                            "!border-gray-200 dark:!border-dark-300"
                        )}
                    >
                        <ul
                            className="divide-y divide-neutral-200 dark:divide-dark-300"
                            data-testid="schedules"
                            ref={ulAnimationParentRef}
                        >
                            {crrFilter === 'all' && (
                                [
                                    ...instantiatedBalanceHistoryItems.categories.map((category) => category.element ? category.element : category.records?.elements).flat(),
                                    ...instantiatedBalanceHistoryItems.salaries
                                ].map(el => el)
                            )}
                            {(crrFilter === 'incomes' || crrFilter === 'expenses') && (
                                instantiatedBalanceHistoryItems.categories.flatMap((category) => {
                                    let elements: JSX.Element[] = []
                                    if (crrFilter.includes(category.type) && category.element) {
                                        elements = [category.element]
                                    }

                                    if (category.records) {
                                        const records = category.records;
                                        const recordElements = records.elements.filter((_, index) => records.types[index] === crrFilter)
                                        elements.push(...recordElements)
                                    }

                                    return elements
                                })
                            )}
                            {crrFilter === 'salaries' && (
                                instantiatedBalanceHistoryItems.salaries.map(el => el)
                            )}
                        </ul>
                    </div>

                    {annualIncomesExpenses[selectedYear - 1] && (
                        <div className="mt-4 flex w-full justify-between px-3">
                            {annualIncomesExpenses[selectedYear - 1]?.totalIncome && (
                                <p className="text-md text-green-400">
                                    INCOME:{" "}
                                    <span className="text-xl">
                                        {formatAmount(
                                            Math.abs(annualIncomesExpenses[selectedYear - 1]!.totalIncome)
                                        )}
                                    </span>
                                </p>
                            )}
                            {annualIncomesExpenses[selectedYear - 1]?.totalExpense && (
                                <p className="text-md text-red-400">
                                    EXPENSE:{" "}
                                    <span className="text-xl">
                                        {formatAmount(
                                            Math.abs(annualIncomesExpenses[selectedYear - 1]!.totalExpense)
                                        )}
                                    </span>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <EmptyScreen
                    Icon={CircleOff}
                    headline="Nothing to show"
                    description="Add at least one category and salary first and run simulation"
                />
            ))}
        </div>
    )
}

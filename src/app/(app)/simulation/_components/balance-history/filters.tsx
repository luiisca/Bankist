'use client'

import { useContext, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import capitalize from "~/lib/capitalize";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/core/dropdown-menu";
import { Button, TextField } from "~/components/ui";
import { cn } from "~/lib/cn";
import { BalanceContext } from "../../_lib/balance-context";
import { BalanceHistoryContext } from "../../_lib/balance-history-context";

export const filters = ["all", "incomes", "expenses", "salaries"] as const;
export type TFilters = typeof filters[number];

export default function Filters({ crrFilterState }: {
    crrFilterState: [TFilters, React.Dispatch<React.SetStateAction<TFilters>>];
}) {
    const { state: { years: simulatedYears } } = useContext(BalanceContext);
    const { state: { selectedYear }, dispatch } = useContext(BalanceHistoryContext)
    const [crrFilter, setCrrFilter] = crrFilterState;
    const [selectedYearInputValue, setSelectedYearInputValue] = useState<number | "">(selectedYear)
    useEffect(() => {
        setSelectedYearInputValue(selectedYear)
    }, [selectedYear])

    const dropdownMenuRef = useRef<null | HTMLDivElement>(null);

    return (
        <div className="flex items-center space-x-4 self-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild className="px-4">
                    <Button
                        type="button"
                        size="icon"
                        color="secondary"
                        EndIcon={() => (
                            <ChevronDown className="ml-1 -mb-[2px]" />
                        )}
                        className="w-28"
                    >
                        {capitalize(crrFilter)}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent ref={dropdownMenuRef}>
                    {filters.map((filter, index) => {
                        return (
                            <DropdownMenuItem
                                key={index}
                                onClick={() => {
                                    setCrrFilter(filter);
                                }}
                            >
                                <Button
                                    type="button"
                                    color="minimal"
                                    className={cn(
                                        "w-full font-normal",
                                        filter === crrFilter
                                            ? "!bg-neutral-900 !text-white hover:!bg-neutral-900 dark:!bg-brand dark:!text-dark-neutral dark:hover:!bg-brand"
                                            : "dark:hover:!bg-dark-400"
                                    )}
                                >
                                    {capitalize(filter)}
                                </Button>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            <TextField
                type='number'
                className="!mb-0 !w-32"
                placeholder="1"
                onChange={(e) => {
                    let parsedValue = e.target.valueAsNumber;
                    if (Number.isNaN(parsedValue)) {
                        setSelectedYearInputValue('')

                        return;
                    }

                    if (parsedValue <= 0) {
                        setSelectedYearInputValue(1)
                        dispatch({
                            type: 'SET_SELECTED_YEAR',
                            selectedYear: 1
                        })

                        return;
                    }

                    setSelectedYearInputValue(parsedValue > simulatedYears ? simulatedYears : parsedValue)
                    dispatch({
                        type: 'SET_SELECTED_YEAR',
                        selectedYear: parsedValue > simulatedYears ? simulatedYears : parsedValue
                    })
                }}
                value={selectedYearInputValue}
            />
        </div>
    )
}

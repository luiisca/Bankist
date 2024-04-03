'use client'

import { useContext } from "react";
import { useForm } from "react-hook-form";

import { MAX_YEARS, MIN_YEARS } from "~/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Form, NumberInput } from "~/components/ui";
import { RunSimInputType, runSimInputZod } from "prisma/zod-utils";
import { api } from "~/lib/trpc/react";
import shouldRunSim from "../_lib/should-run-sim";
import { toast } from "sonner";
import { BalanceContext } from "../_lib/balance-context";
import { BalanceHistoryContext } from "../_lib/balance-history-context";

export default function RunSimForm() {
    const utils = api.useUtils()

    const {
        state: { finalNetWorthLoading },
        dispatch: balanceDispatch,
    } = useContext(BalanceContext);
    const { dispatch: balanceHistoryDispatch } = useContext(BalanceHistoryContext)

    const runSimForm = useForm<RunSimInputType>({
        resolver: zodResolver(runSimInputZod),
        defaultValues: {
            years: MIN_YEARS,
        },
    });
    const { control } = runSimForm;

    return (
        <Form
            form={runSimForm}
            handleSubmit={(values: RunSimInputType) => {
                const salariesData = utils.simulation.salaries.get.getData() ?? []
                const categoriesData = utils.simulation.categories.get.getData() ?? []
                const { _shouldRunSim, errorMessage } = shouldRunSim(categoriesData, salariesData)

                if (_shouldRunSim) {
                    balanceDispatch({
                        type: "SIM_RUN",
                        years: values.years,
                    });
                    balanceHistoryDispatch({
                        type: "SET_SELECTED_YEAR",
                        selectedYear: values.years
                    })
                } else {
                    toast.error(errorMessage)
                }
            }}
            className="my-6 flex justify-start"
        >
            <NumberInput
                label="Years"
                control={control}
                name="years"
                className="mb-0 w-auto rounded-r-none"
                onChange={(parsedValue: number) => {
                    if (parsedValue > MAX_YEARS) return MAX_YEARS;

                    return parsedValue;
                }}
            />
            <Button
                type='submit'
                loading={finalNetWorthLoading}
                className="self-end rounded-l-none px-4 py-2"
            >
                Run
            </Button>
        </Form>
    );
};

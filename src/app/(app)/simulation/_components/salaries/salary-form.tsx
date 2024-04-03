'use client'

import React, { Fragment, useContext, useRef, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import {
    DefaultValues,
    useForm,
    useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertTriangle, Percent, Trash2 } from "lucide-react";
import {
    Button,
    Form,
    NumberInput,
    TextInput,
} from "~/components/ui";
import { ControlledSelect } from "~/components/ui/core/form/select/Select";
import { Dialog, DialogTrigger } from "~/components/ui/core/dialog";
import { DialogContentConfirmation } from "~/components/ui/custom-dialog";
import {
    BASIC_GROUP_TYPES,
    DEFAULT_TAX_PERCENT,
} from "~/lib/constants";
import { getCurrencyOptions } from "~/lib/sim-settings";
import { SalInputType, salInputZod } from "prisma/zod-utils";
import { RouterOutputs } from "~/lib/trpc/shared";
import VarianceList from "./variance-list";
import getDefSalInputValues from "../../_lib/get-def-sal-input-values";
import debounce from "~/lib/debounce";
import handleBalanceLoadingState from "../../_lib/handle-balance-loading-state";
import parseSalaryInputData from "~/app/(app)/_lib/parse-salary-input-data";
import shouldRunSim from "../../_lib/should-run-sim";
import { api } from "~/lib/trpc/react";
import { SalariesContext } from "./salaries-provider";
import { BalanceHistoryContext } from "../../_lib/balance-history-context";
import { BalanceContext } from "../../_lib/balance-context";

export default function SalaryForm({
    elKey,
    salary,
    defaultValues,
    user,
}: {
    elKey: string;
    salary?: RouterOutputs["simulation"]["salaries"]["get"][0];
    defaultValues?: DefaultValues<SalInputType>;
    user: NonNullable<RouterOutputs['user']['get']>;
}) {
    const { instantiatedSalaries, setInstantiatedSalaries } = useContext(SalariesContext)
    const { dispatch: balanceHistoryDispatch } = useContext(BalanceHistoryContext)

    const utils = api.useUtils()
    // form
    const salaryForm = useForm<SalInputType>({
        resolver: zodResolver(salInputZod),
        defaultValues: defaultValues || getDefSalInputValues({ salary, user })
    });
    const { register, control, setValue, clearErrors, formState: { errors } } = salaryForm;

    // watch values
    const allValuesWatcher = useWatch({
        control
    })
    const [taxTypeWatcher, taxPercentWatcher, varianceWatcher] = useWatch({
        control,
        name: ["taxType", "taxPercent", "variance"],
    });

    // mutation
    const { dispatch: balanceDispatch, state: { years } } = useContext(BalanceContext)
    const [transactionType, setTransactionType] = useState<'update' | 'create'>(salary ? 'update' : 'create')
    const salaryId = useRef(salary && salary.id)
    const salaryMutation = api.simulation.salaries.createOrUpdate.useMutation({
        onMutate: async (input) => {
            // optimistic update
            await utils.simulation.salaries.get.cancel();
            const { parsedSalary, parsedVariance } = input
            const oldCachedSalariesData = utils.simulation.salaries.get.getData() ?? []
            let updatedElIndex: number | null = null;

            if (transactionType === 'update') {
                updatedElIndex = instantiatedSalaries.findIndex((el) => el?.key === elKey)

                if (updatedElIndex !== null) {
                    // @ts-expect-error
                    utils.simulation.salaries.get.setData(undefined, [
                        ...oldCachedSalariesData.slice(0, updatedElIndex),
                        { ...parsedSalary, variance: parsedVariance ?? [] },
                        ...oldCachedSalariesData.slice(updatedElIndex + 1),
                    ])
                }
            } else if (transactionType === 'create') {
                // @ts-expect-error
                utils.simulation.salaries.get.setData(undefined, [...oldCachedSalariesData, { ...parsedSalary, variance: parsedVariance ?? [] }])
            }

            // wether run sim
            const salariesData = utils.simulation.salaries.get.getData()!
            const catsData = utils.simulation.categories.get.getData() ?? []
            const { _shouldRunSim } = shouldRunSim(catsData, salariesData)
            handleBalanceLoadingState({ shouldRunSim: _shouldRunSim, balanceDispatch, years })

            // update balance history
            balanceHistoryDispatch({
                type: 'ADD_OR_UPDATE',
                payload: {
                    action: transactionType === 'create' ? 'ADD' : 'UPDATE',
                    type: 'salary',
                    ...(updatedElIndex === null ? {} : { index: updatedElIndex }),
                    // @ts-expect-error
                    data: { ...parsedSalary, variance: parsedVariance ?? [] },
                }
            })

            return { oldCachedSalariesData, updatedElIndex }
        },
        onSuccess: (salary) => {
            if (salary) {
                toast.success(`Salary ${transactionType === 'update' ? "updated" : "created"}`);
                salaryId.current = salary.id
                setValue('id', salary.id)
                setValue('periodsIdsToRemove', [])
                salary.varianceIds.forEach(({ id: periodId }, index) => setValue(`variance.${index}.id`, periodId))

                // update cached salary id
                if (transactionType === 'create') {
                    const oldCachedSalariesData = utils.simulation.salaries.get.getData() ?? []
                    if (oldCachedSalariesData.length > 0) {
                        const salariesUpToLatest = oldCachedSalariesData.slice(0, oldCachedSalariesData.length - 1)
                        const latestSalary = oldCachedSalariesData[oldCachedSalariesData.length - 1]!
                        utils.simulation.salaries.get.setData(undefined, [
                            ...salariesUpToLatest,
                            {
                                ...latestSalary,
                                id: salaryId.current as bigint
                            }
                        ])
                    }
                }

                transactionType === 'create' && setTransactionType('update')
            }
        },
        onError: (e, v, ctx) => {
            toast.error("Could not add salary. Please try again");

            if (ctx) {
                // revert cache
                utils.simulation.salaries.get.setData(undefined, ctx.oldCachedSalariesData)

                // wether run sim
                const salariesData = utils.simulation.salaries.get.getData() ?? []
                const catsData = utils.simulation.categories.get.getData()
                const { _shouldRunSim } = shouldRunSim(catsData, salariesData)
                handleBalanceLoadingState({ shouldRunSim: _shouldRunSim, balanceDispatch, years })

                // update balance history
                if (typeof ctx.updatedElIndex === 'number') {
                    balanceHistoryDispatch({
                        type: 'UNDO'
                    })
                } else {
                    balanceHistoryDispatch({
                        type: 'REMOVE',
                        payload: {
                            type: 'salary',
                            index: salariesData.length
                        }
                    })
                }
            }
        },
    });

    // deleteMutation
    const deleteSalaryMutation = api.simulation.salaries.delete.useMutation({
        onMutate: async () => {
            // optimistic update
            let removedElIndex = instantiatedSalaries.findIndex((el) => el?.key === elKey)
            // UI
            setInstantiatedSalaries((crrSalaries) => {
                return [...crrSalaries.slice(0, removedElIndex), ...crrSalaries.slice(removedElIndex + 1)]
            })

            // cache
            await utils.simulation.salaries.get.cancel();
            const oldCachedSalariesData = utils.simulation.salaries.get.getData() ?? []
            const newSalariesData = [
                ...oldCachedSalariesData.slice(0, removedElIndex),
                ...oldCachedSalariesData.slice(removedElIndex + 1)
            ]
            utils.simulation.salaries.get.setData(undefined, newSalariesData)

            // wether run sim
            const salariesData = utils.simulation.salaries.get.getData()
            const catsData = utils.simulation.categories.get.getData()
            const { _shouldRunSim } = shouldRunSim(catsData, salariesData)
            handleBalanceLoadingState({ shouldRunSim: _shouldRunSim, balanceDispatch, years })

            // update balance history
            balanceHistoryDispatch({
                type: 'REMOVE',
                payload: {
                    type: 'salary',
                    index: removedElIndex
                }
            })

            return { oldCachedSalariesData, removedElIndex }
        },
        onSuccess: () => {
            toast.success("Salary deleted");
        },
        onError: (e, v, ctx) => {
            toast.error("Could not delete salary. Please try again.");

            if (ctx) {
                // revert optimistic update
                // revert UI
                setInstantiatedSalaries((crrSalaries) => {
                    const key = uuidv4()
                    return [
                        ...crrSalaries.slice(0, ctx.removedElIndex),
                        <Fragment key={key}>
                            <SalaryForm
                                elKey={key}
                                user={user}
                                defaultValues={allValuesWatcher}
                                salary={salary}
                            />
                        </Fragment>,
                        ...crrSalaries.slice(ctx.removedElIndex),
                    ]
                })
                // revert cache 
                utils.simulation.salaries.get.setData(undefined, ctx.oldCachedSalariesData)

                // wether run sim
                const salariesData = utils.simulation.salaries.get.getData() ?? []
                const catsData = utils.simulation.categories.get.getData()
                const { _shouldRunSim } = shouldRunSim(catsData, salariesData)
                handleBalanceLoadingState({ shouldRunSim: _shouldRunSim, balanceDispatch, years })

                // update balance history
                balanceHistoryDispatch({
                    type: 'UNDO',
                })
            }
        },
    });

    return (
        <Form<SalInputType>
            form={salaryForm}
            customInputValidation={() => {
                if (errors.variance) {
                    const fromErrorFound = errors.variance.find?.((err) => {
                        if (err?.from?.ref) {
                            err.from.ref?.focus?.()

                            return true;
                        }
                    })

                    if (fromErrorFound) {
                        return false; // stop validation
                    } else {
                        return true; // continue with handleSubmit validation
                    }
                }

                return true
            }}
            handleSubmit={(values) => {
                const { parsedSalary, parsedVariance } = parseSalaryInputData(values)

                if (values.title === undefined || values.title === null || values.title === "") {
                    setValue('title', parsedSalary.title)
                }
                salaryMutation.mutate({
                    parsedSalary,
                    parsedVariance,
                    periodsIdsToRemove: values.periodsIdsToRemove
                })
            }}
            className="space-y-6"
        >
            {/* id */}
            <input {...register('id')} hidden />

            {/* title */}
            <div>
                <TextInput
                    name="title"
                    label="Title"
                    placeholder="Salary"
                />
            </div>
            <div className="flex space-x-3">
                {/* amount  */}
                <div className="flex-[1_1_60%]">
                    <NumberInput<SalInputType>
                        control={control}
                        name="amount"
                        label="Yearly Salary"
                        placeholder="Current salary..."
                    />
                </div>
                {/* taxType */}
                <div>
                    <ControlledSelect<SalInputType>
                        control={control}
                        getOptions={() => BASIC_GROUP_TYPES}
                        name="taxType"
                        label="Tax Type"
                        onChange={(option) => {
                            debounce(() => {
                                if (option.value === 'perCat') {
                                    // sets hidden empty variance taxPercent input to salary taxPercent value to avoid invisible errors on submit
                                    if (varianceWatcher && varianceWatcher.length > 0) {
                                        for (let index = 0; index < varianceWatcher.length; index++) {
                                            const period = varianceWatcher[index];
                                            if (!period?.taxPercent) {
                                                setValue(`variance.${index}.taxPercent`, taxPercentWatcher)
                                                clearErrors(`variance.${index}.taxPercent`)
                                            }
                                        }
                                    }
                                }
                                if (option.value === 'perRec') {
                                    setValue('taxPercent', 0)
                                    clearErrors('taxPercent')
                                }
                            }, 1500)()

                            return option
                        }}
                    />
                </div>
                {/* income tax */}
                {taxTypeWatcher?.value === "perCat" && (
                    <div>
                        <NumberInput<SalInputType>
                            control={control}
                            name="taxPercent"
                            label="Income Taxes"
                            addOnSuffix={<Percent />}
                            placeholder={`${DEFAULT_TAX_PERCENT}`}
                            customNumValidation
                            onChange={(parsedValue: number) => {
                                debounce(() => {
                                    if (varianceWatcher && varianceWatcher.length > 0) {
                                        for (let index = 0; index < varianceWatcher.length; index++) {
                                            const period = varianceWatcher[index];
                                            if (!period?.taxPercent) {
                                                setValue(`variance.${index}.taxPercent`, parsedValue)
                                            }
                                        }
                                    }
                                }, 1500)()

                                if (parsedValue < 0) {
                                    return 0
                                }
                                if (parsedValue > 100) {
                                    return 100
                                }
                                return parsedValue
                            }}
                        />
                    </div>
                )}
                {/* currency */}
                <div>
                    <ControlledSelect<SalInputType>
                        control={control}
                        getOptions={() => getCurrencyOptions({ countryCode: user.country })}
                        name="currency"
                        label="Currency"
                    />
                </div>
            </div>

            <VarianceList isMutationLoading={salaryMutation.isLoading} />

            <div className="flex items-center space-x-2 pt-3">
                <Button
                    type="submit"
                    color="primary"
                    loading={salaryMutation.isLoading}
                >
                    {transactionType === 'update' ? "Update" : "Create"}
                </Button>
                {transactionType === 'update' ? (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                type="button"
                                color="destructive"
                                className="border-2 px-3 font-normal"
                                StartIcon={() => <Trash2 className="m-0" />}
                                disabled={salaryMutation.isLoading}
                            />
                        </DialogTrigger>
                        <DialogContentConfirmation
                            title="Delete Salary"
                            description="Are you sure you want to delete the current salary?"
                            actionProps={{
                                actionText: "Delete salary",
                                onClick: (e) =>
                                    e &&
                                    ((e: Event | React.MouseEvent<HTMLElement, MouseEvent>) => {
                                        e.preventDefault();
                                        salaryId.current && deleteSalaryMutation.mutate({ id: salaryId.current });
                                    })(e)
                            }}
                            Icon={AlertTriangle}
                        />
                    </Dialog>
                ) : (
                    <Button
                        onClick={() => {
                            setInstantiatedSalaries((crrSalaries) => crrSalaries.filter((el) => el?.key !== elKey))
                        }}
                        type="button"
                        color="destructive"
                        className="border-2 px-3 font-normal"
                        StartIcon={() => <Trash2 className="m-0" />}
                        disabled={salaryMutation.isLoading}
                    />
                )}
            </div>
        </Form >
    );
};

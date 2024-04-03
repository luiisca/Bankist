'use client'

import React, { Fragment, useContext, useRef, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import {
    Control,
    DefaultValues,
    useForm,
    useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
    Button,
    Form,
    Label,
    NumberInput,
    TextInput,
} from "~/components/ui";
import { RouterOutputs } from "~/lib/trpc/shared";
import {
    catInputZod,
    CatInputType,
} from "prisma/zod-utils";
import {
    getCurrencyOptions,
} from "~/lib/sim-settings";
import {
    DEFAULT_FREQUENCY,
    CATEGORY_INFL_TYPES,
    BASIC_BAL_TYPES,
    BASIC_GROUP_TYPES,
} from "~/lib/constants";
import RecordsList from "./records-list";
import { ControlledSelect, ControlledSwitch } from "~/components/ui/core/form/select/Select";
import { Dialog, DialogTrigger } from "~/components/ui/core/dialog";
import { DialogContentConfirmation } from "~/components/ui/custom-dialog";
import TitleWithInfo from "../title-with-info";
import { CountryInflInput, CountrySelect } from "~/app/_components/fields";
import useUpdateInflation from "~/app/(app)/_lib/use-update-inflation";
import getDefCatInputValues from "../../_lib/get-def-cat-input-values";
import handleBalanceLoadingState from "../../_lib/handle-balance-loading-state";
import parseCatInputData from "~/app/(app)/_lib/parse-cat-input-data";
import shouldRunSim from "../../_lib/should-run-sim";
import { api } from "~/lib/trpc/react";
import { CategoriesContext } from "./categories-provider";
import { BalanceHistoryContext } from "../../_lib/balance-history-context";
import { BalanceContext } from "../../_lib/balance-context";

export default function CategoryForm({
    elKey,
    category,
    defaultValues,
    user,
}: {
    elKey: string;
    category?: RouterOutputs["simulation"]["categories"]["get"][0];
    defaultValues?: DefaultValues<CatInputType>;
    user: NonNullable<RouterOutputs["user"]["get"]>;
}) {
    const { instantiatedCategories, setInstantiatedCategories } = useContext(CategoriesContext)
    const { dispatch: balanceHistoryDispatch } = useContext(BalanceHistoryContext)

    const utils = api.useUtils()
    // form
    const categoryForm = useForm<CatInputType>({
        resolver: zodResolver(catInputZod),
        defaultValues: defaultValues || getDefCatInputValues({ category, user }),
    });

    const { setValue, register, control } = categoryForm;

    // watch values
    const allValuesWatcher = useWatch({
        control
    })
    const [typeWatcher, freqTypeWatcher, inflEnabledWatcher, inflTypeWatcher] = useWatch({
        control,
        name: ["type", 'freqType', 'inflEnabled', 'inflType'],
    });

    // mutation
    const { dispatch: balanceDispatch, state: { years } } = useContext(BalanceContext)
    const [transactionType, setTransactionType] = useState<'update' | 'create'>(category ? 'update' : 'create')
    const categoryId = useRef(category && category.id)
    const categoryMutation = api.simulation.categories.createOrUpdate.useMutation({
        onMutate: async (input) => {
            // optimistic update
            await utils.simulation.categories.get.cancel();
            const { parsedCategory, parsedRecords } = input
            const oldCachedCategoriesData = utils.simulation.categories.get.getData() ?? []
            let updatedElIndex: number | null = null;

            if (transactionType === 'update') {
                updatedElIndex = instantiatedCategories.findIndex((el) => el?.key === elKey)

                if (updatedElIndex !== null) {
                    // @ts-expect-error
                    utils.simulation.categories.get.setData(undefined, [
                        ...oldCachedCategoriesData.slice(0, updatedElIndex),
                        { ...parsedCategory, records: parsedRecords ?? [] },
                        ...oldCachedCategoriesData.slice(updatedElIndex + 1),
                    ])

                }
            } else if (transactionType === 'create') {
                // @ts-expect-error
                utils.simulation.categories.get.setData(undefined, [...oldCachedCategoriesData, { ...parsedCategory, records: parsedRecords ?? [] }])
            }

            // wether run sim
            const salariesData = utils.simulation.salaries.get.getData() ?? []
            const categoriesData = utils.simulation.categories.get.getData()!
            const { _shouldRunSim } = shouldRunSim(categoriesData, salariesData)
            handleBalanceLoadingState({ shouldRunSim: _shouldRunSim, balanceDispatch, years })

            // update balance history
            _shouldRunSim && balanceHistoryDispatch({
                type: 'ADD_OR_UPDATE',
                payload: {
                    action: transactionType === 'create' ? 'ADD' : 'UPDATE',
                    type: 'category',
                    ...(updatedElIndex === null ? {} : { index: updatedElIndex }),
                    // @ts-expect-error
                    data: { ...parsedCategory, records: parsedRecords ?? [] },
                }
            })

            return { oldCachedCategoriesData, updatedElIndex }
        },
        onSuccess: (category) => {
            if (category) {
                toast.success(`Category ${transactionType === 'update' ? "updated" : "created"}`);
                categoryId.current = category.id
                setValue('id', category.id)
                setValue('recordsIdsToRemove', [])
                category.recordsIds.forEach(({ id: recordId }, index) => setValue(`records.${index}.id`, recordId))

                // update cached category id
                if (transactionType === 'create') {
                    const oldCachedCategoriesData = utils.simulation.categories.get.getData() ?? []
                    if (oldCachedCategoriesData.length > 0) {
                        const categoriesUpToLatest = oldCachedCategoriesData.slice(0, oldCachedCategoriesData.length - 1)
                        const latestCategory = oldCachedCategoriesData[oldCachedCategoriesData.length - 1]!
                        utils.simulation.categories.get.setData(undefined, [
                            ...categoriesUpToLatest,
                            {
                                ...latestCategory,
                                id: categoryId.current as bigint
                            }
                        ])
                    }
                }

                transactionType === 'create' && setTransactionType('update')
            }
        },
        onError: (e, v, ctx) => {
            toast.error("Could not add category. Please try again");

            if (ctx) {
                // revert cache
                utils.simulation.categories.get.setData(undefined, ctx.oldCachedCategoriesData)

                // wether run sim
                const salariesData = utils.simulation.salaries.get.getData() ?? []
                const categoriesData = utils.simulation.categories.get.getData() ?? []
                const { _shouldRunSim } = shouldRunSim(categoriesData, salariesData)
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
                            type: 'category',
                            index: categoriesData.length
                        }
                    })
                }
            }
        },
    });
    const deleteCategoryMutation = api.simulation.categories.delete.useMutation({
        onMutate: async () => {
            // optimistic update
            let removedElIndex = instantiatedCategories.findIndex((el) => el?.key === elKey)
            // UI
            setInstantiatedCategories((crrCats) => {
                return [...crrCats.slice(0, removedElIndex), ...crrCats.slice(removedElIndex + 1)]
            })

            // cache
            await utils.simulation.categories.get.cancel();
            const oldCachedCategoriesData = utils.simulation.categories.get.getData()
            const newCategoriesData = [
                ...oldCachedCategoriesData?.slice(0, removedElIndex) ?? [],
                ...oldCachedCategoriesData?.slice(removedElIndex + 1) ?? []
            ]
            utils.simulation.categories.get.setData(undefined, newCategoriesData)

            // wether run sim
            const salariesData = utils.simulation.salaries.get.getData() ?? []
            const categoriesData = utils.simulation.categories.get.getData() ?? []
            const { _shouldRunSim } = shouldRunSim(categoriesData, salariesData)
            handleBalanceLoadingState({ shouldRunSim: _shouldRunSim, balanceDispatch, years })

            // update balance history
            balanceHistoryDispatch({
                type: 'REMOVE',
                payload: {
                    type: 'category',
                    index: removedElIndex
                }
            })

            return { oldCachedCategoriesData, removedElIndex }
        },
        onSuccess: () => {
            toast.success("Category deleted");
        },
        onError: (e, v, ctx) => {
            toast.error("Could not delete category. Please try again.");

            if (ctx) {
                // revert optimistic update
                // revert UI
                setInstantiatedCategories((crrCats) => {
                    const key = uuidv4()
                    return [
                        ...crrCats.slice(0, ctx.removedElIndex),
                        <Fragment key={key}>
                            <CategoryForm
                                elKey={key}
                                user={user}
                                defaultValues={allValuesWatcher}
                                category={category}
                            />
                        </Fragment>,
                        ...crrCats.slice(ctx.removedElIndex),
                    ]
                })

                // revert cache 
                utils.simulation.categories.get.setData(undefined, ctx.oldCachedCategoriesData)

                // wether run sim
                const salariesData = utils.simulation.salaries.get.getData() ?? []
                const categoriesData = utils.simulation.categories.get.getData() ?? []
                const { _shouldRunSim } = shouldRunSim(categoriesData, salariesData)
                handleBalanceLoadingState({ shouldRunSim: _shouldRunSim, balanceDispatch, years })

                // update balance history
                balanceHistoryDispatch({
                    type: 'UNDO',
                })
            }
        },
    });

    const { updateInflation, isLoadingInfl, isValidInfl } = useUpdateInflation<CatInputType>();

    return (
        <Form<CatInputType>
            form={categoryForm}
            handleSubmit={(values) => {
                const { parsedCategory, parsedRecords } = parseCatInputData(values, user)

                // let user know optional empty fields have been filled with default data
                const valuesEntries = Object.entries(values)
                for (let index = 0; index < valuesEntries.length; index++) {
                    const entry = valuesEntries[index];
                    if (entry) {
                        const key = entry[0] as keyof typeof values;
                        const value = entry[1];
                        if (value === undefined || value === null || value === '') {
                            if (key === 'inflVal' || key === 'icon' || key === 'frequency') {
                                setValue(key, parsedCategory[key])
                            }
                        }
                    }
                }

                values.records?.forEach((record, recordIndex) => {
                    const parsedRecord = parsedRecords?.[recordIndex];
                    const recordEntries = Object.entries(record)
                    if (parsedRecord) {
                        for (let entryIndex = 0; entryIndex < recordEntries.length; entryIndex++) {
                            const entry = recordEntries[entryIndex];
                            if (entry) {
                                const key = entry[0] as keyof typeof record;
                                const value = entry[1];
                                if (value === undefined || value === null || value === '') {
                                    if (key === 'title' || key === 'frequency' || key === 'inflation') {
                                        setValue(`records.${recordIndex}.${key}`, parsedRecord[key])
                                    }
                                }
                            }
                        }
                    }
                })

                categoryMutation.mutate({
                    parsedCategory,
                    parsedRecords,
                    recordsIdsToRemove: values.recordsIdsToRemove
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
                    placeholder="Rent"
                />
            </div>

            {/* type */}
            <div>
                <ControlledSelect<CatInputType>
                    control={control}
                    getOptions={() => BASIC_BAL_TYPES}
                    name="type"
                    label="Type"
                />
            </div>

            <div className="flex space-x-3">
                {/* budget */}
                <div className="flex-[1_1_80%]">
                    <NumberInput<CatInputType>
                        control={control}
                        name="budget"
                        label="Monthly Budget"
                        placeholder="Budget"
                    />
                </div>

                {/* currency Select*/}
                <div>
                    <ControlledSelect<CatInputType>
                        control={control}
                        getOptions={() => getCurrencyOptions({ isTypePerRec: true, countryCode: user.country })}
                        name="currency"
                        label="Currency"
                    />
                </div>
            </div>

            {typeWatcher?.value === "expense" && (
                <>
                    <div>
                        {/* inflation label */}
                        <TitleWithInfo
                            Title={() => <Label>Inflation</Label>}
                            infoCont={
                                <>
                                    Select &quot;Per record&quot; to apply individual inflation
                                    to every expense record.
                                    <br />
                                    Leave it as is to apply same inflation to the whole
                                    category.
                                </>
                            }
                        />

                        {/* inflEnabled switch */}
                        <ControlledSwitch control={control} name="inflEnabled" />

                        {/* inflType select */}
                        {inflEnabledWatcher && (
                            <ControlledSelect
                                control={control as unknown as Control}
                                name="inflType"
                                getOptions={() => CATEGORY_INFL_TYPES}
                            />
                        )}
                    </div>

                    {typeWatcher?.value === "expense" &&
                        inflTypeWatcher?.value === "perCat" && (
                            <div className="flex space-x-3">
                                {/* country Select */}
                                <div className="flex-[1_1_80%]">
                                    <CountrySelect<CatInputType>
                                        form={categoryForm}
                                        name="country"
                                        control={control}
                                        updateCurrencyActive
                                        updateInflation={updateInflation}
                                        inflName="inflVal"
                                    />
                                </div>

                                {/* country inflation */}
                                <div>
                                    <CountryInflInput<CatInputType>
                                        control={control}
                                        name="inflVal"
                                        isLoadingInfl={isLoadingInfl}
                                        isValidInfl={isValidInfl}
                                    />
                                </div>
                            </div>
                        )}
                </>
            )}
            {/* frequency type */}
            <div>
                <ControlledSelect<CatInputType>
                    control={control}
                    getOptions={() => BASIC_GROUP_TYPES}
                    name="freqType"
                    label="Frequency Type"
                />
            </div>
            {/* frequency */}
            {freqTypeWatcher?.value === "perCat" && (
                <div className="flex-[1_1_80%]">
                    <NumberInput<CatInputType>
                        control={control}
                        name="frequency"
                        label="Yearly Frequency (opt.)"
                        placeholder={`${DEFAULT_FREQUENCY}`}
                    />
                </div>
            )}

            {/* expenses records */}
            <RecordsList
                isMutationLoading={categoryMutation.isLoading}
                user={user}
            />

            <div className="flex items-center space-x-2 pt-3">
                <Button
                    color="primary"
                    loading={categoryMutation.isLoading}
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
                            />
                        </DialogTrigger>
                        <DialogContentConfirmation
                            title="Delete Category"
                            description="Are you sure you want to delete the current category?"
                            Icon={AlertTriangle}
                            actionProps={{
                                actionText: "Delete category",
                                onClick: (e) => {
                                    if (e) {
                                        e.preventDefault();
                                        categoryId.current && deleteCategoryMutation.mutate({ id: categoryId.current });
                                    }
                                }
                            }}
                        />
                    </Dialog>
                ) : (
                    <Button
                        onClick={() => {
                            setInstantiatedCategories((crrCats) => crrCats.filter((el) => el?.key !== elKey))
                        }}
                        type="button"
                        color="destructive"
                        className="border-2 px-3 font-normal"
                        StartIcon={() => <Trash2 className="m-0" />}
                    />
                )}
            </div>
        </Form>
    );
};

'use client'

import { toast } from 'sonner';
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Button, Label, NumberInput, TextField, Tooltip } from "~/components/ui";
import { useEffect, useState } from "react";
import {
    FieldValues,
    UseFieldArrayReturn,
    useFieldArray,
    useFormContext,
    useWatch,
} from "react-hook-form";
import { Plus, X } from 'lucide-react';
import Switch from '~/components/ui/core/switch';
import TitleWithInfo from '../title-with-info';
import { getCountryOptionLabel, getCurrencyLocaleName, getCurrencyOptions } from '~/lib/sim-settings';
import { CatInputType } from 'prisma/zod-utils';
import { BASIC_BAL_TYPES, DEFAULT_FREQUENCY, OptionsType, SELECT_OUTCOME_VAL, getSelectOptionWithFallback } from '~/lib/constants';
import { RouterOutputs } from '~/lib/trpc/shared';
import useUpdateInflation from '~/app/(app)/_lib/use-update-inflation';
import { ControlledSelect } from '~/components/ui/core/form/select/Select';
import { CountryInflInput, CountrySelect } from '../fields';
import { Currencies } from 'country-to-currency';

const Record = ({
    index,
    fieldArray,
    user,
}: {
    index: number;
    fieldArray: UseFieldArrayReturn<FieldValues, "records", "id">;
    user: NonNullable<RouterOutputs['user']['get']>;
}) => {
    const [inflDisabled, setInflDisabled] = useState(false);
    const categoryForm = useFormContext<CatInputType>();
    const { register, setValue, control } = categoryForm;
    const { remove } = fieldArray;

    const { updateInflation, isLoadingInfl, isValidInfl } = useUpdateInflation<CatInputType>();

    const [recordsIdsToRemove, typeWatcher, freqTypeWatcher, inflTypeWatcher, currencyWatcher, recordTypeWatcher, recordIdWatcher] = useWatch({
        control,
        name: ["recordsIdsToRemove", "type", "freqType", "inflType", "currency", `records.${index}.type`, `records.${index}.id`],
    });

    return (
        <>
            {/* id */}
            {recordIdWatcher && <input {...register(`records.${index}.id`)} hidden />}

            {/* <Title /> */}
            <div>
                <TextField
                    label="Title"
                    placeholder=""
                    {...register(`records.${index}.title`)}
                />
            </div>
            {/* <Amount /> */}
            <div>
                <NumberInput<CatInputType>
                    control={control}
                    name={`records.${index}.amount`}
                    label="Amount"
                    placeholder=""
                />
            </div>
            {/* <SelectType /> */}
            <div>
                <ControlledSelect<CatInputType>
                    control={control}
                    options={() => BASIC_BAL_TYPES}
                    onChange={(option) => {
                        setInflDisabled(option.value === "income");

                        return option;
                    }}
                    name={`records.${index}.type`}
                    label="Type"
                />
            </div>
            {((typeWatcher?.value === "income" && recordTypeWatcher?.value === "outcome") ||
                (typeWatcher?.value === "outcome" && inflTypeWatcher?.value === "perRec" && recordTypeWatcher?.value === "outcome")) && (
                    <>
                        {/* <Inflation switch /> */}
                        <div className="mb-4 flex items-center space-x-2">
                            <Label>Inflation</Label>
                            <Tooltip
                                content={`${inflDisabled ? "Enable" : "Disable"} inflation`}
                            >
                                <div className="self-center rounded-md p-2 hover:bg-gray-200">
                                    <Switch
                                        id="disabled"
                                        checked={!inflDisabled}
                                        onCheckedChange={() => setInflDisabled(!inflDisabled)}
                                    />
                                </div>
                            </Tooltip>
                        </div>
                        {!inflDisabled && (
                            <div className="flex space-x-3">
                                {/* country Select */}
                                <div className="flex-[1_1_80%]">
                                    <CountrySelect<CatInputType>
                                        form={categoryForm}
                                        name={`records.${index}.country`}
                                        control={control}
                                        updateCurrencyActive
                                        updateInflation={updateInflation}
                                        inflName={`records.${index}.inflation`}
                                    />
                                </div>

                                {/* country inflation */}
                                <div>
                                    <CountryInflInput<CatInputType>
                                        control={control}
                                        name={`records.${index}.inflation`}
                                        isLoadingInfl={isLoadingInfl}
                                        isValidInfl={isValidInfl}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}
            {/* freqType === 'perRec' => <Frequency /> */}
            {freqTypeWatcher?.value === "perRec" && (
                <div>
                    <NumberInput<CatInputType>
                        control={control}
                        name={`records.${index}.frequency`}
                        label="Yearly Frequency"
                        placeholder=""
                        addOnSuffix={<span>p.a.</span>}
                    />
                </div>
            )}
            {/* currency === 'perRec' => <Currency /> */}
            {currencyWatcher?.value === "perRec" && (
                <div>
                    <ControlledSelect<CatInputType>
                        control={control}
                        options={() => getCurrencyOptions({ countryCode: user.country })}
                        name={`records.${index}.currency`}
                        label="Currency"
                    />
                </div>
            )}
            <Button
                type='button'
                color="primary"
                className="mt-3"
                onClick={() => {
                    recordIdWatcher && setValue('recordsIdsToRemove', [...recordsIdsToRemove ?? [], recordIdWatcher])
                    remove(index);
                }}
            >
                <X className="h-4 w-4" />
            </Button>
        </>
    );
};

export default function RecordsList({
    user,
    isMutationLoading,
}: {
    user: NonNullable<RouterOutputs['user']['get']>;
    isMutationLoading: boolean;
}) {
    // form
    const form = useFormContext<CatInputType>();
    const fieldArray = useFieldArray({
        name: "records",
    });
    const { formState: { errors }, control } = form;
    const { fields, append, remove } = fieldArray;
    const [titleValWatcher, typeWatcher, inflValWatcher, currencyWatcher, watchLatestRecordInflType] = useWatch({
        control,
        name: ["title", "type", "inflVal", "currency", `records.${fields.length - 1}.type`],
    });

    const newRecordDefaultShape = {
        title: "",
        amount: "" as unknown as number,
        type: getSelectOptionWithFallback(typeWatcher?.value as OptionsType, SELECT_OUTCOME_VAL),
        frequency: DEFAULT_FREQUENCY,
        inflType: watchLatestRecordInflType?.value !== "income",
        country: {
            value: user.country,
            // @TODO: when will user.country be 'default'
            label: getCountryOptionLabel(user.country),
        },
        inflation: inflValWatcher || user.inflation,
        currency: {
            value: currencyWatcher.value,
            label: getCurrencyLocaleName((currencyWatcher.value || user.currency) as Currencies, user.country),
        },
    };

    useEffect(() => {
        if (errors.records && errors.records?.message) {
            toast.error(errors.records?.message as string);
        }
    }, [errors]);

    const [recordsAnimationParentRef] = useAutoAnimate<HTMLUListElement>();
    const [disabled, setDisabled] = useState(false);

    return (
        <div>
            <div className="mb-4 flex items-center space-x-2">
                <TitleWithInfo
                    Title={() => <Label className="!m-0">Records</Label>}
                    infoCont={<>Your monthly expenses for {titleValWatcher || "current"} category</>}
                />
                <Tooltip content={`${disabled ? "Enable" : "Disable"} records`}>
                    <div className="self-center rounded-md p-2 hover:bg-gray-200 dark:bg-transparent">
                        <Switch
                            id="disabled"
                            checked={!disabled}
                            onCheckedChange={() => {
                                !disabled && remove()
                                setDisabled(!disabled);
                            }}
                        />
                    </div>
                </Tooltip>
            </div>

            {!disabled && (
                <>
                    <ul className="space-y-4" ref={recordsAnimationParentRef}>
                        {fields.map((field, index) => (
                            <li key={field.id}>
                                <div className="flex items-center space-x-3">
                                    <Record index={index} fieldArray={fieldArray} user={user} />
                                </div>
                            </li>
                        ))}
                    </ul>

                    <Button
                        type='button'
                        color="primary"
                        disabled={isMutationLoading}
                        className="mt-3"
                        onClick={() => {
                            console.log('newRecordDefaultShape', newRecordDefaultShape)
                            append(newRecordDefaultShape);
                        }}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </>
            )}
        </div>
    );
};

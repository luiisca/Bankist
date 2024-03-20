'use client'

import { useForm } from "react-hook-form";
import {
    Button,
    Form,
    NumberInput,
} from "~/components/ui";
import { RouterOutputs } from "~/lib/trpc/shared";
import { toast } from "sonner";
import { SettingsSimInputType, settingsSimInputZod } from "prisma/zod-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/lib/trpc/react";
import { DEFAULT_COUNTRY, DEFAULT_CURRENCY, DEFAULT_INDEX_RETURN, DEFAULT_INFLATION, DEFAULT_INVEST_PERC } from "~/lib/constants";
import { getCountryOptionLabel, getCurrencyLocaleName, getCurrencyOptions } from "~/lib/sim-settings";
import { CountryInflInput, CountrySelect } from "~/app/_components/fields";
import useUpdateInflation from "~/app/(app)/_lib/use-update-inflation";
import { ControlledSelect } from "~/components/ui/core/form/select/Select";
import { ArrowRightIcon, Percent } from "lucide-react";
import getDefSettingsSimInputValues from "~/app/_lib/get-def-settings-sim-input-values";
import { useRouter } from 'next/navigation'

export default function SimPresetsForm({ user }: { user: NonNullable<RouterOutputs['user']['get']> }) {
    const router = useRouter()
    const utils = api.useUtils();
    const { data: _user } = api.user.get.useQuery()
    const simSettingsForm = useForm<SettingsSimInputType>({
        resolver: zodResolver(settingsSimInputZod),
        defaultValues: getDefSettingsSimInputValues(user)
    });
    const { setValue, control } = simSettingsForm;

    const mutation = api.user.set.useMutation({
        onMutate: () => {
            router.push('/simulation')
        },
        onSuccess: async () => {
            toast.success("Settings updated");
            await utils.user.get.invalidate();
        },
        onError: () => {
            toast.error("Error updating settings");
            router.push('sim-presets')
        },
    });
    const { updateInflation, isLoadingInfl, isValidInfl } = useUpdateInflation<SettingsSimInputType>();

    return (
        <Form
            form={simSettingsForm}
            handleSubmit={(values) => {
                // default values we populate the form with if the user leaves them blank
                const parsedValues = {
                    country: values?.country.value || DEFAULT_COUNTRY,
                    currency: values?.currency.value || DEFAULT_CURRENCY,
                    inflation: values?.inflation === 0 ? 0 : values?.inflation || DEFAULT_INFLATION,
                    investPerc: values?.investPerc === 0 ? 0 : values?.investPerc || DEFAULT_INVEST_PERC,
                    indexReturn: values?.indexReturn === 0 ? 0 : values?.indexReturn || DEFAULT_INDEX_RETURN,
                }

                // let user know we've filled some inputs with default data
                const valuesEntries = Object.entries(values)
                for (let index = 0; index < valuesEntries.length; index++) {
                    const entry = valuesEntries[index];
                    if (entry) {
                        const key = entry[0] as keyof typeof parsedValues;
                        const value = entry[1];
                        if (value === undefined || value === null || value === '') {
                            if (key === 'country') {
                                setValue('country', {
                                    value: DEFAULT_COUNTRY,
                                    label: getCountryOptionLabel(DEFAULT_COUNTRY)
                                })
                                continue;
                            }
                            if (key === 'currency') {
                                setValue('currency', {
                                    value: DEFAULT_CURRENCY,
                                    label: getCurrencyLocaleName(DEFAULT_CURRENCY, parsedValues.country)
                                })
                                continue;
                            }
                            setValue(key, parsedValues[key])
                        }
                    }
                }

                mutation.mutate(parsedValues)
            }}
            className="space-y-6"
        >
            {/* country */}
            <div>
                <CountrySelect<SettingsSimInputType>
                    form={simSettingsForm}
                    name="country"
                    control={control}
                    updateCurrencyActive
                    updateInflation={updateInflation}
                    inflName="inflation"
                />
            </div>

            <div className="flex space-x-3">
                {/* currency */}
                <div className="flex-[1_1_80%]">
                    <ControlledSelect<SettingsSimInputType>
                        control={control}
                        getOptions={() => getCurrencyOptions({ countryCode: user.country })}
                        name="currency"
                        label="Currency"
                    />
                </div>

                {/* country inflation */}
                <div>
                    <CountryInflInput<SettingsSimInputType>
                        control={control}
                        name="inflation"
                        isLoadingInfl={isLoadingInfl}
                        isValidInfl={isValidInfl}
                    />
                </div>
            </div>

            {/* Investment per year perc */}
            <div>
                <NumberInput<SettingsSimInputType>
                    control={control}
                    name="investPerc"
                    label="Investment percentage (opt.)"
                    addOnSuffix={<Percent />}
                    placeholder={`${DEFAULT_INVEST_PERC}`}
                    customNumValidation
                    onChange={(parsedValue: number) => {
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

            {/* annual return perc */}
            <div>
                <NumberInput<SettingsSimInputType>
                    control={control}
                    name="indexReturn"
                    label="Annual return (opt.)"
                    addOnSuffix={<Percent />}
                    placeholder={`${DEFAULT_INDEX_RETURN}`}
                    customNumValidation
                    onChange={(parsedValue: number) => {
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

            <Button
                type="submit"
                className="mt-8 flex w-full flex-row justify-center text-center text-sm"
                loading={mutation.isLoading}
            >
                Finish
                <ArrowRightIcon
                    className="ml-2 h-4 w-4 self-center"
                    aria-hidden="true"
                />
            </Button>
        </Form>
    );
};

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
import getDefSettingsSimInputValues from "~/app/_lib/get-def-settings-sim-input-values"
import { DEFAULT_COUNTRY, DEFAULT_CURRENCY, DEFAULT_INDEX_RETURN, DEFAULT_INFLATION, DEFAULT_INVEST_PERC } from "~/lib/constants";
import { getCurrencyOptions } from "~/lib/sim-settings";
import { CountryInflInput, CountrySelect } from "~/app/_components/fields";
import useUpdateInflation from "~/app/(app)/_lib/use-update-inflation";
import { ControlledSelect } from "~/components/ui/core/form/select/Select";
import { Percent } from "lucide-react";

export default function SimForm({ user }: { user: NonNullable<RouterOutputs['user']['get']> }) {
    const utils = api.useUtils();
    const { data: _user } = api.user.get.useQuery()
    const simForm = useForm<SettingsSimInputType>({
        resolver: zodResolver(settingsSimInputZod),
        defaultValues: getDefSettingsSimInputValues(user)
    });
    const { setValue, control, formState: { isSubmitting, isDirty } } = simForm;

    const mutation = api.user.set.useMutation({
        onSuccess: async () => {
            toast.success("Settings updated");
            await utils.user.get.invalidate();
        },
        onError: () => {
            toast.error("Error updating settings");
        },
    });
    const { updateInflation, isLoadingInfl, isValidInfl } = useUpdateInflation<SettingsSimInputType>();

    return (
        <Form
            form={simForm}
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
                        const key = entry[0] as keyof typeof values;
                        const value = entry[1];
                        if (value === undefined || value === null || value === '') {
                            if (key === 'country' || key === 'currency') {
                                continue;
                            }
                            setValue(key, parsedValues[key])
                        }
                    }
                }

                mutation.mutate(parsedValues)

                return;
            }}
            className="space-y-6"
        >
            {/* country */}
            <div>
                <CountrySelect<SettingsSimInputType>
                    form={simForm}
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
                disabled={isSubmitting || !isDirty}
                className="mt-6"
                type="submit"
                loading={mutation.isLoading}
            >
                Update
            </Button>
        </Form>
    )
}

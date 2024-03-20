import { api } from "~/lib/trpc/server";
import StepsBar from "../_components/steps-bar";
import { Alert } from "~/components/ui/alert";
import SimPresetsForm from "./sim-presets-form";

export default async function SimPresets() {
    const user = await api.user.get.query();

    if (!user) {
        return (
            <Alert
                severity="error"
                title="Something went wrong"
                message='Could not get user data. Please reload the page'
            />
        )
    };

    return (
        <>
            <div className="mx-auto sm:max-w-[520px]">
                <header>
                    <p className="mb-3 font-cal text-[28px] font-medium leading-7">
                        Set simulation presets
                    </p>

                    <p className="font-sans text-sm font-normal text-gray-500 dark:text-dark-600">
                        Set simulation presets to better simulate your final balance.
                    </p>
                </header>

                {/* step bar */}
                <StepsBar crrStepIndex={1} />
            </div>

            <div className="mt-10 rounded-md border border-gray-200 bg-white p-4 dark:border-dark-350 dark:bg-dark-150 sm:p-8">
                <SimPresetsForm user={user} />
            </div>
        </>
    )
}

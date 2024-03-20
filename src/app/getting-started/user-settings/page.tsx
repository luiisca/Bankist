import { api } from "~/lib/trpc/server";
import StepsBar from "../_components/steps-bar";
import { STEPS } from "../_lib/constants";
import UserSettingsForm from "./user-settings-form";
import { Alert } from "~/components/ui/alert";

export default async function UserSettings() {
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
                        Welcome to Budgetist
                    </p>

                    <p className="font-sans text-sm font-normal text-gray-500 dark:text-dark-600">
                        We just need some basic info to get your profile setup.
                    </p>
                    <p className="font-sans text-sm font-normal text-gray-500 dark:text-dark-600">
                        You’ll be able to edit this later.
                    </p>
                </header>

                {/* step bar */}
                <StepsBar crrStepIndex={0} />
            </div>

            <div className="mt-10 rounded-md border border-gray-200 bg-white p-4 dark:border-dark-350 dark:bg-dark-150 sm:p-8">
                <UserSettingsForm user={user} nextStep={STEPS[1]} />
            </div>
        </>
    )
}

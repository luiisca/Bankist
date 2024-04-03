import { Metadata } from "next";
import BalanceHeader from "./_components/balance-header";
import RunSimForm from "./_components/run-sim-form";
import BalanceHistory from "./_components/balance-history";
import Salaries from "./_components/salaries";
import Categories from "./_components/categories";
import { api } from "~/lib/trpc/server";
import { calcNetWorthOverYears } from "~/lib/simulation";
import { Alert } from "~/components/ui/alert";
import Test from "./test";
import { instantiateCategories, instantiateSalaries } from "./_lib/instantiate-balance-history-items";
import SeedClientState from "./_lib/seed-client-state";
import { BalanceHistoryProvider, BalanceHistoryReducerStateType } from "./_lib/balance-history-context";
import { BalanceProvider, TBalanceReducerState } from "./_lib/balance-context";

export const metadata: Metadata = {
    title: "Simulation | Budgetist",
    description: "simulate your total balance after x years",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
}

export default async function Simulation() {
    const staticCategories = await api.simulation.categories.get.query()
    const staticSalaries = await api.simulation.salaries.get.query()
    const staticUser = await api.user.get.query()
    if (!staticUser) {
        return (
            <Alert
                severity="error"
                title="Something went wrong"
                message='Could not get staticUser data. Please reload the page'
            />
        )
    };

    let balanceHistoryState: BalanceHistoryReducerStateType = {
        instantiatedBalanceHistoryItems: {
            categories: [],
            salaries: [],
        },
        selectedYear: 1
    }
    let balanceState: TBalanceReducerState = {
        years: 1,
        finalNetWorthHidden: null,
        finalNetWorthLoading: false,
        finalNetWorth: 0,
        annualIncomesExpenses: [],
    }

    if (staticCategories.length > 0 && staticSalaries.length > 0) {
        const { finalNetWorth, annualIncomesExpenses } = calcNetWorthOverYears({
            categories: staticCategories,
            salaries: staticSalaries,
            investPerc: staticUser.investPerc,
            indexReturn: staticUser.indexReturn,
            years: 1
        })
        balanceState = {
            ...balanceState,
            finalNetWorth,
            finalNetWorthHidden: false,
            annualIncomesExpenses,
        }

        if (balanceState.annualIncomesExpenses.length > 0) {
            balanceHistoryState = {
                ...balanceHistoryState,
                instantiatedBalanceHistoryItems: {
                    // TODO - replace 0 with db year
                    categories: instantiateCategories(balanceState.annualIncomesExpenses[0]!, staticCategories),
                    salaries: instantiateSalaries(balanceState.annualIncomesExpenses[0]!, staticSalaries),
                }
            }
        }
    }

    return (
        <BalanceProvider staticState={balanceState}>
            <BalanceHistoryProvider staticState={balanceHistoryState}>
                <SeedClientState
                    categories={staticCategories}
                    salaries={staticSalaries}
                    user={staticUser}
                />
                <BalanceHeader staticFinalNetWorth={balanceState.finalNetWorth} staticFinalNetWorthHidden={balanceState.finalNetWorthHidden} />
                {/* <Test /> */}
                <div className="flex flex-col space-y-8">
                    <div>
                        <h2 className="mb-4 text-lg font-medium">Run Simulation</h2>
                        <RunSimForm />
                    </div>
                    <div>
                        <BalanceHistory />
                    </div>
                    <div>
                        <h2 className="mb-4 text-lg font-medium">Salaries</h2>
                        <Salaries staticSalaries={staticSalaries} staticUser={staticUser} />
                    </div>
                    <div>
                        <h2 className="mb-4 text-lg font-medium">Categories</h2>
                        <Categories staticCategories={staticCategories} staticUser={staticUser} />
                    </div>
                </div>
            </BalanceHistoryProvider>
        </BalanceProvider>
    )
}

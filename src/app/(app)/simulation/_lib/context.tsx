'use client'

import { PropsWithChildren, createContext, useCallback, useReducer } from "react";
import { toast } from "sonner";
import { AnnualIncomesExpensesType, calcNetWorthOverYears } from "~/lib/simulation";
import { api } from "~/lib/trpc/react";
import { RouterOutputs } from "~/lib/trpc/shared";

export type TBalanceInitState = {
    years: number;
    finalNetWorthHidden: boolean;
    finalNetWorthLoading: boolean;
    finalNetWorth: number;
    annualIncomesExpenses: AnnualIncomesExpensesType;
};
type TBalanceReducerState = TBalanceInitState
export type ActionType =
    | {
        type: "SIM_RUN";
        years: number;
    }
    | {
        type: "BASE_SIM_RUN";
        payload: {
            years: number;
            categories: RouterOutputs['simulation']['categories']['get'];
            salaries: RouterOutputs['simulation']['salaries']['get'];
            user: RouterOutputs['user']['get'];
        }
    }
    | {
        type: "YEARS_UPDATED";
        years: number;
    }
    | {
        type: "TOTAL_BAL_LOADING";
        finalNetWorthLoading: boolean;
    }
    | {
        type: "TOTAL_BAL_SET_HIDDEN";
        finalNetWorthHidden: boolean;
    }

const createCtx = (
    reducer: React.Reducer<TBalanceReducerState, ActionType>,
    initialState: TBalanceInitState
) => {
    const defaultDispatch: React.Dispatch<ActionType> = () => initialState;
    const ctx = createContext({
        state: initialState,
        dispatch: defaultDispatch,
    });

    const Provider = (props: PropsWithChildren) => {
        const utils = api.useUtils();
        const [state, dispatch] = useReducer(reducer, {
            ...initialState,
        });
        const customDispatch = useCallback(async (action: ActionType) => {
            switch (action.type) {
                case "SIM_RUN": {
                    const categories = utils.simulation.categories.get.getData();
                    const salaries = utils.simulation.salaries.get.getData();
                    const user = utils.user.get.getData();

                    // handle empty trpc data (i.e. when trpc query is still fetching and reducer state hasn't been synced with it by provider useEffect)
                    if (!categories || !salaries || !user) {
                        utils.user.get.invalidate()
                        utils.simulation.invalidate()
                        toast.error('Error fetching data. Retrying...', {
                            action: {
                                label: 'Retry',
                                onClick: () => {
                                    dispatch({
                                        type: "SIM_RUN",
                                        years: action.years
                                    })
                                }
                            }
                        })

                        return;
                    }
                    // data is here but incomplete due to user
                    const noCategories = categories.length === 0
                    const noSalaries = salaries.length === 0
                    if (noCategories || noSalaries) {
                        toast.error(
                            `Please add at least ${noCategories && noSalaries
                                ? "some category or salary"
                                : noCategories
                                    ? "one category"
                                    : "one salary"
                            } first`,
                        );

                        return;
                    }

                    dispatch({
                        type: "BASE_SIM_RUN",
                        payload: {
                            categories,
                            salaries,
                            user,
                            years: action.years
                        }
                    })

                    break;
                }

                default: {
                    dispatch(action)
                }
            }
        }, [])

        return (
            <ctx.Provider
                value={{
                    state,
                    dispatch: customDispatch,
                }}
                {...props}
            />
        );
    };

    return [ctx, Provider] as const;
};


const balanceReducer = (state: TBalanceReducerState, action: ActionType) => {
    switch (action.type) {
        case "BASE_SIM_RUN": {
            const { categories, salaries, user, years } = action.payload

            // data is in the right shape to run simulation algo
            if (categories.length > 0 && salaries.length > 0 && user) {
                const { finalNetWorth, annualIncomesExpenses } = calcNetWorthOverYears({
                    categories,
                    salaries,
                    investPerc: user.investPerc,
                    indexReturn: user.indexReturn,
                    years: years
                });

                return {
                    ...state,
                    finalNetWorth,
                    annualIncomesExpenses,
                    finalNetWorthLoading: false,
                };
            } else {
                return {
                    ...state
                }
            }
        }
        case "YEARS_UPDATED": {
            return {
                ...state,
                years: action.years,
            };
        }
        case "TOTAL_BAL_LOADING": {
            return {
                ...state,
                finalNetWorthHidden: false,
                finalNetWorthLoading: action.finalNetWorthLoading,
            };
        }
        case "TOTAL_BAL_SET_HIDDEN": {
            return {
                ...state,
                finalNetWorthHidden: action.finalNetWorthHidden
            }
        }

        default: {
            return state;
        }
    }
};

const balanceInitState: TBalanceInitState = {
    years: 1,
    finalNetWorthHidden: true,
    finalNetWorthLoading: false,
    finalNetWorth: 0,
    annualIncomesExpenses: [],
};

const [ctx, BalanceProvider] = createCtx(balanceReducer, balanceInitState);
const BalanceContext = ctx;
export { BalanceContext, BalanceProvider }

'use client'

import { PropsWithChildren, createContext, useReducer, useContext, useRef } from "react"
import { v4 as uuidv4 } from 'uuid';
import { formatAmount } from "~/lib/sim-settings";
import { getSalaryBreakdownForYear } from "~/lib/simulation";
import { RouterOutputs } from "~/lib/trpc/shared";
import { BalanceContext } from "./balance-context";
import { ListItem } from "../_components/balance-history/list-item";
import log from "~/lib/lib";
import { api } from "~/lib/trpc/react";
import { instantiateCategories, instantiateCategory } from "./instantiate-balance-history-items";

export type BalanceHistoryCategoryItemType = {
    type: string;
    element: JSX.Element | null;
    records: {
        elements: JSX.Element[];
        types: string[]
    } | null
}
export type InstantiatedBalanceHistoryItemsType = {
    categories: BalanceHistoryCategoryItemType[];
    salaries: JSX.Element[];
}
type BalanceHistoryInitStateType = {
    instantiatedBalanceHistoryItems: InstantiatedBalanceHistoryItemsType;
    selectedYear: number
};
export type BalanceHistoryReducerStateType = BalanceHistoryInitStateType

type CategoryPayloadType = {
    type: 'category';
    data: RouterOutputs['simulation']['categories']['get'][0];
}
type SalaryPayloadType = {
    type: 'salary';
    data: RouterOutputs['simulation']['salaries']['get'][0];
}
export type ActionType =
    | {
        type: "ADD_OR_UPDATE";
        payload: ({
            action: 'ADD'
        } & (CategoryPayloadType | SalaryPayloadType)) | ({
            action: 'UPDATE',
            index: number
        } & (CategoryPayloadType | SalaryPayloadType))
    }
    | {
        type: 'SET',
        state: Omit<BalanceHistoryInitStateType, 'selectedYear'> & {
            selectedYear?: number
        }
    }
    | {
        type: "REMOVE";
        payload: {
            type: 'category' | 'salary';
            index: number;
        }
    }
    | {
        type: 'UNDO';
    }
    | {
        type: 'SET_SELECTED_YEAR';
        selectedYear: number;
    }

function createCtx(
    initialState: BalanceHistoryInitStateType
) {
    const defaultDispatch: React.Dispatch<ActionType> = () => initialState;
    const ctx = createContext({
        state: initialState,
        dispatch: defaultDispatch
    });

    const Provider = (props: PropsWithChildren & { staticState: BalanceHistoryReducerStateType }) => {
        const utils = api.useUtils()
        const { state: { annualIncomesExpenses } } = useContext(BalanceContext);
        const oldInstantiatedBalanceHistoryItemsRef = useRef({} as BalanceHistoryInitStateType['instantiatedBalanceHistoryItems'])

        const [state, dispatch] = useReducer((state: BalanceHistoryReducerStateType, action: ActionType) => {
            switch (action.type) {
                case 'ADD_OR_UPDATE': {
                    let newInstantiatedSalary: JSX.Element = null as unknown as JSX.Element
                    let newInstantiatedCategories: BalanceHistoryCategoryItemType[] = [] as BalanceHistoryCategoryItemType[]
                    const key = uuidv4()

                    const categoriesCache = utils.simulation.categories.get.getData()
                    const instantiatedCategoriesIsTooOutdated = categoriesCache && (categoriesCache.length - state.instantiatedBalanceHistoryItems.categories.length) > 1
                    if (instantiatedCategoriesIsTooOutdated) {
                        // it seems like it will only run after creating multiple categories and the first salary
                        const selectedYearIE = annualIncomesExpenses[state.selectedYear - 1]

                        if (selectedYearIE) {
                            newInstantiatedCategories = instantiateCategories(selectedYearIE, categoriesCache)
                        }
                    }

                    if (action.payload.type === 'category' && !instantiatedCategoriesIsTooOutdated) {
                        const newCategory = action.payload.data
                        const annualCategoriesIE = annualIncomesExpenses[state.selectedYear - 1]!.categoriesIncomesExpenses;
                        const newCategoryIE = annualCategoriesIE[('index' in action.payload ? action.payload.index : annualCategoriesIE.length - 1)]!

                        newInstantiatedCategories = [instantiateCategory(newCategory, newCategoryIE)]
                    }

                    if (action.payload.type === 'salary') {
                        const newSalary = action.payload.data;
                        const newSalaryBreakdown = getSalaryBreakdownForYear(newSalary, state.selectedYear)
                        newInstantiatedSalary = (
                            <ListItem
                                key={key}
                                infoBubble={
                                    <>
                                        <p>Amount: </p>
                                        <p>{formatAmount(newSalaryBreakdown.amountBefTax)}</p>
                                        <p>Tax Perc: </p>
                                        <p>{newSalaryBreakdown.taxPercent}%</p>
                                    </>
                                }
                                title={newSalary.title}
                                type={"salary"}
                                total={formatAmount(
                                    Math.abs(newSalaryBreakdown.amountAftTax)
                                )}
                            />
                        )
                    }

                    if (action.payload.action === 'ADD') {
                        return {
                            ...state,
                            instantiatedBalanceHistoryItems: {
                                ...state.instantiatedBalanceHistoryItems,
                                ...(newInstantiatedSalary && {
                                    salaries: [...state.instantiatedBalanceHistoryItems.salaries, newInstantiatedSalary]
                                }),
                                ...(newInstantiatedCategories.length > 0 && {
                                    categories: newInstantiatedCategories.length === 1 ? [...state.instantiatedBalanceHistoryItems.categories, newInstantiatedCategories[0]!] : newInstantiatedCategories
                                })
                            }
                        }
                    }
                    if (action.payload.action === 'UPDATE') {
                        const index = action.payload.index;
                        oldInstantiatedBalanceHistoryItemsRef.current = state.instantiatedBalanceHistoryItems

                        return {
                            ...state,
                            instantiatedBalanceHistoryItems: {
                                ...state.instantiatedBalanceHistoryItems,
                                ...(newInstantiatedSalary && {
                                    salaries: [
                                        ...state.instantiatedBalanceHistoryItems.salaries.slice(0, index),
                                        newInstantiatedSalary,
                                        ...state.instantiatedBalanceHistoryItems.salaries.slice(index + 1),
                                    ]
                                }),
                                ...(newInstantiatedCategories.length > 0 && {
                                    categories: newInstantiatedCategories.length === 1 ? [
                                        ...state.instantiatedBalanceHistoryItems.categories.slice(0, index),
                                        newInstantiatedCategories[0]!,
                                        ...state.instantiatedBalanceHistoryItems.categories.slice(index + 1),
                                    ] : newInstantiatedCategories
                                })
                            }
                        }
                    }

                    return {
                        ...state
                    }
                }

                case 'SET': {
                    return {
                        ...state,
                        ...action.state
                    }
                }

                case 'REMOVE': {
                    oldInstantiatedBalanceHistoryItemsRef.current = state.instantiatedBalanceHistoryItems
                    const index = action.payload.index

                    return {
                        ...state,
                        instantiatedBalanceHistoryItems: {
                            ...state.instantiatedBalanceHistoryItems,
                            ...(action.payload.type === 'salary' ? {
                                salaries: [...state.instantiatedBalanceHistoryItems.salaries.slice(0, index), ...state.instantiatedBalanceHistoryItems.salaries.slice(index + 1)]
                            } : {
                                categories: [...state.instantiatedBalanceHistoryItems.categories.slice(0, index), ...state.instantiatedBalanceHistoryItems.categories.slice(index + 1)]
                            }),
                        }
                    }
                }

                case 'UNDO': {
                    return {
                        ...state,
                        instantiatedBalanceHistoryItems: oldInstantiatedBalanceHistoryItemsRef.current
                    }
                }

                case "SET_SELECTED_YEAR": {
                    return {
                        ...state,
                        selectedYear: action.selectedYear
                    }
                }

                default: {
                    return state
                }
            }
        }, props.staticState)

        return (
            <ctx.Provider
                value={{
                    state,
                    dispatch
                }}
                {...props}
            />
        )
    }

    return [ctx, Provider] as const
}

const balanceHistoryInitState: BalanceHistoryInitStateType = {
    instantiatedBalanceHistoryItems: {} as InstantiatedBalanceHistoryItemsType,
    selectedYear: 1,
}
const [BalanceHistoryContext, BalanceHistoryProvider] = createCtx(balanceHistoryInitState)
export { BalanceHistoryContext, BalanceHistoryProvider }

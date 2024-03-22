'use client'

import { PropsWithChildren, Dispatch, SetStateAction, createContext, useState } from "react"

export type InstantiatedCategoriesType = (React.ReactElement | null)[]
function createCtx() {
    const defaultSetInstantiatedSalaries: Dispatch<SetStateAction<InstantiatedCategoriesType>> = () => [] as InstantiatedCategoriesType
    const ctx = createContext({
        instantiatedCategories: [] as InstantiatedCategoriesType,
        setInstantiatedCategories: defaultSetInstantiatedSalaries
    });

    const Provider = (props: PropsWithChildren & {
        staticInstantiatedCategories: (React.ReactElement | null)[]
    }) => {
        const [instantiatedCategories, setInstantiatedCategories] = useState<InstantiatedCategoriesType>(props.staticInstantiatedCategories)

        return (
            <ctx.Provider
                value={{
                    instantiatedCategories,
                    setInstantiatedCategories
                }}
                {...props}
            />
        )
    }

    return [ctx, Provider] as const
}
const [CategoriesContext, CategoriesProvider] = createCtx()
export { CategoriesContext, CategoriesProvider }

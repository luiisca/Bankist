'use client'

import { PropsWithChildren, Dispatch, SetStateAction, createContext, useState } from "react"

export type InstantiatedSalariesType = (React.ReactElement | null)[]
function createCtx() {
    const defaultSetInstantiatedSalaries: Dispatch<SetStateAction<InstantiatedSalariesType>> = () => [] as InstantiatedSalariesType
    const ctx = createContext({
        instantiatedSalaries: [] as InstantiatedSalariesType,
        setInstantiatedSalaries: defaultSetInstantiatedSalaries
    });

    const Provider = (props: PropsWithChildren & {
        staticInstantiatedSalaries: (React.ReactElement | null)[]
    }) => {
        const [instantiatedSalaries, setInstantiatedSalaries] = useState<InstantiatedSalariesType>(props.staticInstantiatedSalaries)

        return (
            <ctx.Provider
                value={{
                    instantiatedSalaries,
                    setInstantiatedSalaries
                }}
                {...props}
            />
        )
    }

    return [ctx, Provider] as const
}
const [SalariesContext, SalariesProvider] = createCtx()
export { SalariesContext, SalariesProvider }

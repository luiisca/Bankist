'use client'

import { useMemo } from "react"
import { RouterOutputs } from "~/lib/trpc/shared"
import { api } from "~/lib/trpc/react"

export default function SeedClientState({
    categories,
    salaries,
    user,
}: {
    categories: RouterOutputs['simulation']['categories']['get'],
    salaries: RouterOutputs['simulation']['salaries']['get'],
    user: NonNullable<RouterOutputs['user']['get']>,
}) {
    const utils = api.useUtils()

    useMemo(() => {
        categories ? utils.simulation.categories.get.setData(undefined, categories) : utils.simulation.categories.invalidate()
        salaries ? utils.simulation.salaries.get.setData(undefined, salaries) : utils.simulation.salaries.invalidate()
        utils.user.get.setData(undefined, user)
    }, [])

    return (<></>)
}

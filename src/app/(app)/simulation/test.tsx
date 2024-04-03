'use client'

import { useCallback, useMemo, useState } from "react"
import log from "~/lib/lib"

function Test2() {
    log('_', 'Test2 run')

    return (
        <p>Greeting: </p>
    )
}
export default function Test() {
    log('🤯', 'Test run!')
    const [state, setState] = useState({})
    log('🎉', 'Test run state', state)

    useMemo(() => {
        log('*', 'About to update state')
        setState(() => {
            log('🪴', 'in setState')
            return { greeting: 'hello LuisCA' }
        })
    }, [])

    return (
        <Test2 />
    )
}

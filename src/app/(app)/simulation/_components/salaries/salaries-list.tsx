'use client'

import { v4 as uuidv4 } from 'uuid';
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Button } from "~/components/ui";
import SalaryForm from './salary-form';
import { Fragment, useContext } from 'react';
import { Plus } from 'lucide-react';
import { InstantiatedSalariesType, SalariesContext } from './salaries-provider';
import { RouterOutputs } from '~/lib/trpc/shared';
import EmptyScreen from '~/components/ui/empty-screen';

export default function SalariesList({ staticUser }: { staticInstantiatedSalaries?: InstantiatedSalariesType; staticUser: RouterOutputs['user']['get'] }) {
    const [salariesAnimationParentRef] = useAutoAnimate<HTMLDivElement>()
    const { instantiatedSalaries, setInstantiatedSalaries } = useContext(SalariesContext)

    return (
        <>
            <Button
                className="mb-4"
                StartIcon={Plus}
                onClick={() => {
                    const key = uuidv4()
                    setInstantiatedSalaries((befNewSalData) => (
                        [
                            ...befNewSalData,
                            <Fragment key={key}>
                                <SalaryForm
                                    elKey={key}
                                    user={staticUser}
                                />
                            </Fragment>
                        ]
                    ))
                }}
            >
                New Salary
            </Button>
            <div className="mb-4 space-y-12" ref={salariesAnimationParentRef}>
                {instantiatedSalaries && instantiatedSalaries.slice().reverse().map((salary) => salary)}
            </div>

            {/* @TODO: imprve wording */}
            {instantiatedSalaries?.length === 0 && (
                <EmptyScreen
                    Icon={Plus}
                    headline="New salary"
                    description="Moonlighting? We got you covered"
                />
            )}
        </>
    )
}

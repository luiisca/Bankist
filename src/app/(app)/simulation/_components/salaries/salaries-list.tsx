'use client'

import { v4 as uuidv4 } from 'uuid';
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Button } from "~/components/ui";
import SalaryForm from './salary-form';
import { Fragment, useContext } from 'react';
import { Plus } from 'lucide-react';
import { SalariesContext } from './salaries-provider';
import EmptyScreen from '~/components/ui/empty-screen';
import { api } from '~/lib/trpc/react';
import { toast } from 'sonner';

export default function SalariesList() {
    const utils = api.useUtils()
    const [salariesAnimationParentRef] = useAutoAnimate<HTMLDivElement>()
    const { instantiatedSalaries, setInstantiatedSalaries } = useContext(SalariesContext)
    const { data: user } = api.user.get.useQuery()

    return (
        <>
            <Button
                className="mb-4"
                StartIcon={Plus}
                onClick={() => {
                    const key = uuidv4()
                    const _user = utils.user.get.getData()
                    if (user) {
                        setInstantiatedSalaries((befNewSalData) => (
                            [
                                ...befNewSalData,
                                <Fragment key={key}>
                                    <SalaryForm
                                        elKey={key}
                                        user={_user || user}
                                    />
                                </Fragment>
                            ]
                        ))
                    } else {
                        toast('Something went wrong. Please reload the page')
                    }
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

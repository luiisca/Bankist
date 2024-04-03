'use client'

import { v4 as uuidv4 } from 'uuid';
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Button } from "~/components/ui";
import CategoryForm from './category-form';
import { Fragment, useContext } from 'react';
import { Plus } from 'lucide-react';
import { CategoriesContext } from './categories-provider';
import EmptyScreen from '~/components/ui/empty-screen';
import { api } from '~/lib/trpc/react';

export default function CategoriesList() {
    const utils = api.useUtils()
    const { instantiatedCategories, setInstantiatedCategories } = useContext(CategoriesContext)
    const [categoriesAnimationParentRef] = useAutoAnimate<HTMLDivElement>()

    return (
        <>
            <Button
                className="mb-4"
                StartIcon={Plus}
                onClick={() => {
                    const key = uuidv4()
                    const user = utils.user.get.getData()! // always available since seeded at start
                    setInstantiatedCategories((befNewCatData) => (
                        [
                            ...befNewCatData,
                            <Fragment key={key}>
                                <CategoryForm
                                    elKey={key}
                                    user={user}
                                />
                            </Fragment>
                        ]
                    ))
                }}
            >
                New Category
            </Button>
            <div className="mb-4 space-y-12" ref={categoriesAnimationParentRef}>
                {instantiatedCategories && instantiatedCategories.slice().reverse().map((category) => category)}
            </div>

            {/* @TODO: imprve wording */}
            {instantiatedCategories?.length === 0 && (
                <EmptyScreen
                    Icon={Plus}
                    headline="New category"
                    description="Budget categories helps you define all your yearly expenses to fine-tune the simulation's result"
                />
            )}
        </>
    )
}

import React from "react";
import { v4 as uuidv4 } from 'uuid';

import CategoryForm from "./category-form";
import { CategoriesProvider } from "./categories-provider";
import CategoriesList from "./categories-list";
import { RouterOutputs } from "~/lib/trpc/shared";

const Categories = ({ staticCategories, staticUser }: { staticCategories: RouterOutputs['simulation']['categories']['get']; staticUser: NonNullable<RouterOutputs['user']['get']> }) => {
    let staticInstantiatedCategories;
    if (staticCategories.length > 0 && staticUser) {
        staticInstantiatedCategories = staticCategories.map((category) => {
            const key = uuidv4()
            return (
                <div key={key}>
                    <CategoryForm
                        elKey={key}
                        user={staticUser}
                        category={category}
                    />
                </div>
            )
        })
    }

    return (
        <CategoriesProvider staticInstantiatedCategories={staticInstantiatedCategories || []}>
            <CategoriesList staticUser={staticUser} />
        </CategoriesProvider>
    )
};

export default Categories;

import React, { Fragment } from "react";
import { v4 as uuidv4 } from 'uuid';

import { RouterOutputs } from "~/lib/trpc/shared";
import SalariesList from "./salaries-list";
import SalaryForm from "./salary-form";
import { SalariesProvider } from "./salaries-provider";

export default function Salaries({ staticSalaries, staticUser }: { staticSalaries: RouterOutputs['simulation']['salaries']['get']; staticUser: RouterOutputs['user']['get'] }) {
    let staticInstantiatedSalaries;
    if (staticSalaries.length > 0 && staticUser) {
        staticInstantiatedSalaries = staticSalaries.map((salary) => {
            const key = uuidv4()
            return (
                <Fragment key={key}>
                    <SalaryForm
                        elKey={key}
                        user={staticUser}
                        salary={salary}
                    />
                </Fragment>
            )
        })
    }

    return (
        <SalariesProvider staticInstantiatedSalaries={staticInstantiatedSalaries || []}>
            <SalariesList staticUser={staticUser} />
        </SalariesProvider>
    );
};

import { OptSalInputType, SalInputType } from "prisma/zod-utils";
import omit from "~/lib/omit";

export default function parseSalaryInputData(salary: SalInputType) {
    const variance = salary.variance;

    const optFields: Required<OptSalInputType> = {
        id: salary.id as bigint,
        title: salary.title || 'Job',
    }
    const parsedSalary = {
        ...(omit(salary, 'variance', 'periodsIdsToRemove')),
        ...optFields,
        currency: salary.currency.value,
        taxType: salary.taxType.value,
    }
    const parsedVariance = variance?.map((period) => ({
        ...period,
        id: period.id as bigint,
    }))

    return { parsedSalary, parsedVariance }
}

import {
    CatInputType, OptCatInputType,
} from "prisma/zod-utils";
import { User } from "@prisma/client";
import { DEFAULT_FREQUENCY } from "~/lib/constants";
import omit from "~/lib/omit";

export default function parseCatInputData(category: CatInputType, user: User) {
    const records = category.records;

    const optFields: Required<OptCatInputType> & { frequency: number; inflVal: number } = {
        id: category.id as bigint,
        inflVal: category.inflVal || user.inflation,
        icon: category.icon || "Icon",
        frequency: category.frequency || DEFAULT_FREQUENCY,
    }
    const parsedCategory = {
        ...(omit(category, 'records', 'recordsIdsToRemove')),
        ...optFields,
        currency: category.currency.value,
        type: category.type.value,
        inflType: category.inflType.value,
        country: category.country.value,
        freqType: category.freqType.value,
    }
    const parsedRecords = records?.map((record) => ({
        ...record,
        id: record.id as bigint,
        title: record.title || "",
        frequency: record.frequency || DEFAULT_FREQUENCY,
        country: record.country.value,
        type: record.type.value,
        inflation: record.inflation || user.inflation,
        currency: record.currency?.value || user.currency,
    }));

    return { parsedCategory, parsedRecords }
}

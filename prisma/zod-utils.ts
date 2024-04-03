import { z } from "zod";

// helpers
const requiredNumberInput = z.number({ invalid_type_error: "Cannot be empty" }).positive() // >= 1
const yearFrequency = z.number().positive().max(12)
const nonEmptyString = z.string().min(1, { message: 'Cannot be empty' })

const percentage = z.number().nonnegative().max(100, { message: "Invalid percentage" });

export const selectOptions = z.object({
    value: z.string(),
    label: z.string(),
});

// settings profile
export const settingsProfileInputZod = z.object({
    name: z.string().optional(),
    image: z.string().optional(),
    completedOnboarding: z.boolean().optional(),
});
// settings simulation
export const settingsSimInputZod = z.object({
    country: selectOptions,
    currency: selectOptions,
    inflation: z.literal('').or(percentage.optional()),
    investPerc: z.literal('').or(percentage.optional()),
    indexReturn: z.literal('').or(z.number().nonnegative().optional()),
})

// salary
export const optSalInputZod = z.object({
    id: z.bigint().positive().optional(),
    title: z.string().optional(),
})
export const salInputZod = optSalInputZod.extend({
    currency: selectOptions,
    amount: requiredNumberInput,
    taxType: selectOptions,
    taxPercent: percentage,
    variance: z
        .array(
            z.object({
                id: z.bigint().positive().optional(),
                from: requiredNumberInput,
                amount: requiredNumberInput,
                taxPercent: percentage,
            })
        )
        .optional(),
    periodsIdsToRemove: z.array(z.bigint()).optional(),
});
export const serverSalInputZod = z.object({
    parsedSalary: salInputZod.omit({ variance: true, periodsIdsToRemove: true }).extend({
        title: z.string(),
        currency: z.string(),
        taxType: z.string(),
    }),
    parsedVariance: z
        .array(
            z.object({
                id: z.bigint().positive().optional(),
                from: requiredNumberInput,
                amount: requiredNumberInput,
                taxPercent: percentage,
            })
        )
        .optional(),
    periodsIdsToRemove: z.array(z.bigint()).optional(),
})

// categories
export const optCatInputZod = z.object({
    id: z.bigint().positive().optional(),
    inflVal: z.literal('').or(percentage.optional()),
    icon: z.string().optional(),
    frequency: z.literal('').or(yearFrequency.optional()),
})
export const optCatRecordInputZod = z.object({
    id: z.bigint().positive().optional(),
    title: z.string().optional(),
    frequency: z.literal('').or(yearFrequency.optional()),
    inflation: z.literal('').or(percentage.optional()),
})
export const catInputZod = optCatInputZod.extend({
    title: nonEmptyString,
    budget: requiredNumberInput,
    currency: selectOptions,
    type: selectOptions,
    inflEnabled: z.boolean(),
    inflType: selectOptions,
    country: selectOptions,

    records: z
        .array(
            optCatRecordInputZod.extend({
                amount: requiredNumberInput,
                inflEnabled: z.boolean(),
                type: selectOptions,
                country: selectOptions,
                currency: selectOptions,
            })
        )
        .optional(),
    freqType: selectOptions,
    recordsIdsToRemove: z.array(z.bigint()).optional(),
});
export const serverCatInputZod = z.object({
    parsedCategory: catInputZod.omit({ records: true, recordsIdsToRemove: true }).extend({
        inflVal: percentage,
        icon: z.string(),
        frequency: yearFrequency,
        currency: z.string(),
        type: z.string(),
        inflType: z.string(),
        country: z.string(),
        freqType: z.string(),
    }),
    parsedRecords: z
        .array(
            optCatRecordInputZod.extend({
                title: z.string(),
                frequency: yearFrequency,
                inflation: percentage,
                currency: z.string(),
                amount: requiredNumberInput,
                inflEnabled: z.boolean(),
                type: z.string(),
                country: z.string(),
            })
        )
        .optional(),
    recordsIdsToRemove: z.array(z.bigint()).optional(),
})

// run simulation
export const runSimInputZod = z.object({
    years: requiredNumberInput,
});

// feedback email
export const feedbackZod = z.object({
    rating: z.union([z.literal('Extremely unsatisfied'), z.literal('Unsatisfied'), z.literal('Satisfied'), z.literal('Extremely satisfied')]),
    comment: z.string().optional(),
})

export type SettingsProfileInputType = z.infer<typeof settingsProfileInputZod>;
export type SettingsSimInputType = z.infer<typeof settingsSimInputZod>;

export type OptSalInputType = z.infer<typeof optSalInputZod>;
export type SalInputType = z.infer<typeof salInputZod>;

export type OptCatRecordInputType = z.infer<typeof optCatRecordInputZod>;
export type OptCatInputType = z.infer<typeof optCatInputZod>;
export type CatInputType = z.infer<typeof catInputZod>;

export type RunSimInputType = z.infer<typeof runSimInputZod>;
export type FeedbackType = z.infer<typeof feedbackZod>;

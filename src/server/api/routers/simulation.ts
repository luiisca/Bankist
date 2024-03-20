import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { serverCatInputZod, serverSalInputZod } from "../../../../prisma/zod-utils";
import {
    createTRPCRouter,
    protectedProcedure,
} from "~/server/api/trpc";
import { ErrorCode } from "~/lib/auth";
import { Prisma } from "@prisma/client";

export const simulationRouter = createTRPCRouter({
    salaries: createTRPCRouter({
        get: protectedProcedure.query(async ({ ctx }) => {
            const { db, user } = ctx;

            if (!user) {
                throw new TRPCError({ message: ErrorCode.UserNotFound, code: "NOT_FOUND" });
            }

            return await db.salary.findMany({
                where: {
                    userId: user.id,
                },
                orderBy: {
                    id: "asc",
                },
                select: {
                    id: true,
                    title: true,
                    currency: true,
                    amount: true,
                    taxType: true,
                    taxPercent: true,
                    variance: {
                        select: {
                            id: true,
                            from: true,
                            amount: true,
                            taxPercent: true,
                        },
                        orderBy: {
                            id: 'asc'
                        }
                    },
                },
            });
        }),
        delete: protectedProcedure
            .input(z.object({ id: z.bigint().positive() }))
            .mutation(async ({ input, ctx }) => {
                const { db } = ctx;

                await db.salary.delete({
                    where: {
                        id: input.id,
                    },
                });
            }),
        createOrUpdate: protectedProcedure
            .input(serverSalInputZod)
            .mutation(async ({ input, ctx }) => {
                const { db, user } = ctx;

                if (!user) {
                    throw new TRPCError({ message: ErrorCode.UserNotFound, code: "NOT_FOUND" });
                }

                const { parsedSalary, parsedVariance, periodsIdsToRemove } = input

                // remove periods
                periodsIdsToRemove?.forEach(async (periodId) => {
                    await db.period.delete({
                        where: {
                            id: periodId
                        }
                    })
                })

                // update or create category
                const isVarianceValid = parsedVariance && parsedVariance.length > 0;
                if (isVarianceValid) {
                    parsedVariance.reduce((prev, crr, index) => {
                        if (prev.from >= crr.from) {
                            throw new TRPCError({
                                code: "PARSE_ERROR",
                                message: `Invalid periods order. Please try again. ${index}`,
                            });
                        }

                        return crr;
                    });
                }

                const opType = parsedSalary.id ? 'update' : 'create'
                if (opType === 'update') {
                    let salaryData: Omit<Prisma.SalaryCreateInput, 'user'>;
                    if (isVarianceValid) {
                        const periodsToCreate = []
                        for (const period of parsedVariance) {
                            const opType = period?.id ? 'update' : 'create'
                            if (opType === 'update') {
                                await db.period.update({
                                    where: {
                                        id: period.id,
                                    },
                                    data: period
                                })
                            }
                            if (opType === 'create') {
                                periodsToCreate.push(period)
                            }
                        }

                        salaryData = {
                            ...parsedSalary,
                            ...(periodsToCreate.length > 0 && {
                                variance: {
                                    create: periodsToCreate
                                }
                            })
                        }
                    } else {
                        await db.period.deleteMany({
                            where: {
                                salaryId: parsedSalary.id,
                            },
                        });
                        salaryData = {
                            ...parsedSalary,
                        }
                    }

                    const updatedSalary = await db.salary.update({
                        where: {
                            id: parsedSalary.id,
                        },
                        data: salaryData,
                        select: {
                            id: true,
                            variance: {
                                select: {
                                    id: true,
                                },
                                orderBy: {
                                    id: 'asc'
                                }
                            }
                        }
                    });

                    return {
                        id: updatedSalary.id,
                        varianceIds: updatedSalary.variance
                    }
                }
                if (opType === 'create') {
                    const newSalary = await db.salary.create({
                        data: {
                            ...parsedSalary,
                            ...(isVarianceValid && {
                                variance: {
                                    create: parsedVariance
                                }
                            }),
                            user: {
                                connect: {
                                    id: user.id,
                                },
                            },
                        },
                        select: {
                            id: true,
                            variance: {
                                select: {
                                    id: true,
                                },
                                orderBy: {
                                    id: 'asc'
                                }
                            }
                        }
                    });

                    return {
                        id: newSalary.id,
                        varianceIds: newSalary.variance
                    }
                }
            }),
    }),
    categories: createTRPCRouter({
        get: protectedProcedure
            .query(async ({ ctx }) => {
                const { db, user } = ctx;

                if (!user) {
                    throw new TRPCError({ message: ErrorCode.UserNotFound, code: "NOT_FOUND" });
                }

                return await db.category.findMany({
                    where: {
                        userId: user.id,
                    },
                    orderBy: {
                        id: "asc",
                    },
                    select: {
                        id: true,
                        inflVal: true,
                        icon: true,
                        frequency: true,
                        title: true,
                        budget: true,
                        currency: true,
                        type: true,
                        inflEnabled: true,
                        inflType: true,
                        country: true,
                        freqType: true,
                        records: {
                            select: {
                                id: true,
                                title: true,
                                frequency: true,
                                inflation: true,
                                currency: true,
                                amount: true,
                                inflEnabled: true,
                                type: true,
                                country: true,
                            },
                            orderBy: {
                                id: 'asc'
                            }
                        }
                    },
                });
            }),
        delete: protectedProcedure
            .input(z.object({ id: z.bigint().positive() }))
            .mutation(async ({ input, ctx }) => {
                const { db } = ctx;

                await db.category.delete({
                    where: {
                        id: input.id,
                    },
                });
            }),
        createOrUpdate: protectedProcedure
            .input(serverCatInputZod)
            .mutation(async ({ input, ctx }) => {
                const { db, user } = ctx;

                if (!user) {
                    throw new TRPCError({ message: ErrorCode.UserNotFound, code: "NOT_FOUND" });
                }

                const { parsedCategory, parsedRecords, recordsIdsToRemove } = input

                // remove records
                recordsIdsToRemove?.forEach(async (recordId) => {
                    await db.record.delete({
                        where: {
                            id: recordId
                        }
                    })
                })

                // update or create category
                const isParsedCategoryRecordsValid = parsedRecords && parsedRecords.length > 0
                const opType = parsedCategory.id ? 'update' : 'create'
                if (opType === 'update') {
                    let categoryData: Omit<Prisma.CategoryCreateInput, 'user'>;
                    if (isParsedCategoryRecordsValid) {
                        const recordsToCreate = []
                        for (const record of parsedRecords) {
                            const opType = record?.id ? 'update' : 'create'
                            if (opType === 'update') {
                                await db.record.update({
                                    where: {
                                        id: record.id,
                                    },
                                    data: record
                                })
                            }
                            if (opType === 'create') {
                                recordsToCreate.push(record)
                            }
                        }

                        categoryData = {
                            ...parsedCategory,
                            ...(recordsToCreate.length > 0 && {
                                records: {
                                    create: recordsToCreate
                                }
                            })
                        }
                    } else {
                        await db.record.deleteMany({
                            where: {
                                categoryId: parsedCategory.id,
                            },
                        });
                        categoryData = {
                            ...parsedCategory,
                        }
                    }

                    const updatedCategory = await db.category.update({
                        where: {
                            id: parsedCategory.id,
                        },
                        data: categoryData,
                        select: {
                            id: true,
                            records: {
                                select: {
                                    id: true,
                                },
                                orderBy: {
                                    id: 'asc'
                                }
                            }
                        }
                    });

                    return {
                        id: updatedCategory.id,
                        recordsIds: updatedCategory.records
                    }
                }

                if (opType === 'create') {
                    const newCategory = await db.category.create({
                        data: {
                            ...parsedCategory,
                            ...(isParsedCategoryRecordsValid && {
                                records: {
                                    create: parsedRecords
                                }
                            }),
                            user: {
                                connect: {
                                    id: user.id,
                                },
                            },
                        },
                        select: {
                            id: true,
                            records: {
                                select: {
                                    id: true,
                                },
                                orderBy: {
                                    id: 'asc'
                                }
                            }
                        }
                    });

                    return {
                        id: newCategory.id,
                        recordsIds: newCategory.records
                    }
                }
            }),
    }),
});

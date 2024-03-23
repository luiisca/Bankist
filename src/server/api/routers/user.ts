import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { settingsProfileInputZod, settingsSimInputZod } from "prisma/zod-utils";
import { ErrorCode } from "~/lib/auth";

import {
    createTRPCRouter,
    protectedProcedure,
} from "~/server/api/trpc";
import sendFeedbackEmail, { Feedback } from "./_lib/send-feedback-email";
import { resizeBase64Image } from "./_lib/resize-base64-image";

export const userRouter = createTRPCRouter({
    get: protectedProcedure.query(({ ctx: { user } }) => {
        if (user) {
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                image: user.image,
                completedOnboarding: user.completedOnboarding,
                country: user.country,
                inflation: user.inflation,
                currency: user.currency,
                investPerc: user.investPerc,
                indexReturn: user.indexReturn,
            };
        }
    }),
    set: protectedProcedure
        .input(
            settingsProfileInputZod.extend({
                name: z.string(),
            }).or(settingsSimInputZod.extend({
                country: z.string(),
                currency: z.string(),
                inflation: z.number(),
                investPerc: z.number(),
                indexReturn: z.number(),
                completedOnboarding: z.boolean().optional()
            }))
        )
        .mutation(async ({ input, ctx }) => {
            const { db, user } = ctx;

            if (!user) {
                throw new TRPCError({ message: ErrorCode.UserNotFound, code: "NOT_FOUND" });
            }

            if ('name' in input) {
                // profile settings
                const data = input;
                if (input.image) {
                    data.image = await resizeBase64Image(input.image);
                }

                await db.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        ...data,
                    },
                });
            } else {
                // simulation settings
                const data = input

                await db.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        ...data,
                    },
                });
            }
        }),
    setProfileImg: protectedProcedure
        .input(z.object({ image: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const { db, user } = ctx;
            const resizedImg = await resizeBase64Image(input.image)

            if (!user) {
                throw new TRPCError({ message: ErrorCode.UserNotFound, code: "NOT_FOUND" });
            }

            await db.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    image: resizedImg
                },
            });
        }),
    deleteMe: protectedProcedure.mutation(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({
            where: {
                id: ctx.user?.id,
            },
        });

        if (!user) {
            throw new TRPCError({ message: ErrorCode.UserNotFound, code: "NOT_FOUND" });
        }

        await ctx.db.user.delete({
            where: {
                id: user.id,
            },
        });
    }),
});

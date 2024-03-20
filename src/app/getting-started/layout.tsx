import { Metadata } from "next";
import { redirect } from "next/navigation";

import { Toaster } from "~/components/ui";
import { TRPCReactProvider } from "~/lib/trpc/react";
import { auth } from "../(auth)/auth";

export const metadata: Metadata = {
    title: "Budgetist - Getting Started",
}

export default async function GettingStartedLayout({
    children
}: {
    children: React.ReactNode
}) {
    const session = await auth();
    if (session && session?.user.completedOnboarding) {
        redirect('/simulation')
    }

    return (
        <div
            className="min-h-screen text-black dark:bg-dark-primary dark:text-dark-neutral"
        >
            <div className="mx-auto px-4 py-6 md:py-24 relative sm:max-w-[600px]">
                <TRPCReactProvider>
                    {children}
                </TRPCReactProvider>
                <Toaster />
            </div>
        </div>
    )
}

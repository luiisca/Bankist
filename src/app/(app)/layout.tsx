import { redirect } from "next/navigation"

import { auth } from "~/app/(auth)/auth"
import { Toaster } from "~/components/ui";
import { TRPCReactProvider } from "~/lib/trpc/react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (session && !session?.user.completedOnboarding) {
        redirect('/getting-started/user-settings')
    }

    return (
        <>
            <TRPCReactProvider>{children}</TRPCReactProvider>
            <Toaster />
        </>
    )
}

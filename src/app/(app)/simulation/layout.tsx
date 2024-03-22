import Link from "next/link"
import Logo from "~/components/ui/logo"
import { cn } from "~/lib/cn"
import ThemeButton from "./_components/theme-button"
import { Settings } from "lucide-react"
import UserDropdown from "./_components/user-dropdown"
import { Button } from "~/components/ui"
import Nav from "./_components/nav"
import { BalanceProvider } from "./_lib/context"
import { api } from "~/lib/trpc/server"
import { Alert } from "~/components/ui/alert"

export default async function SimulationLayout({
    children, // will be a page or nested layout
}: {
    children: React.ReactNode
}) {
    const user = await api.user.get.query()
    if (!user) {
        return (
            <Alert
                severity="error"
                title="Something went wrong"
                message='Could not get user data. Please reload the page'
            />
        )
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <aside
                className={cn(
                    "relative hidden w-14 flex-col border-r md:flex lg:w-56 lg:flex-shrink-0 lg:px-4 border-emphasis bg-muted",
                )}
            >
                <div className="flex h-0 flex-1 flex-col pb-4 pt-3 lg:pt-5">
                    <header className="items-center justify-between space-x-2 hidden lg:flex">
                        <UserDropdown staticUser={user} />
                        <ThemeButton />
                    </header>

                    {/* logo icon for tablet */}
                    <Link href="/simulation" className="text-center md:inline lg:hidden">
                        <Logo small icon />
                    </Link>

                    <Nav />
                </div>

                <ThemeButton className="mb-3 mx-auto lg:hidden" />
            </aside>
            <div className="flex w-0 flex-1 flex-col overflow-hidden">
                <main className="relative z-0 flex flex-1 flex-col overflow-y-auto bg-white focus:outline-none  dark:bg-dark-primary">
                    {/* show top navigation for md and smaller (tablet and phones) */}
                    <nav className="fixed z-40 flex w-full items-center justify-between border-b border-emphasis bg-muted px-4 py-1.5 backdrop-blur-lg sm:relative sm:p-4 md:hidden">
                        <Link href="/simulation">
                            <Logo />
                        </Link>
                        <div className="flex items-center space-x-1 self-center">
                            <ThemeButton className="!mr-2 flex-shrink-0 md:hidden" />
                            <Button color='minimal' size='icon' className={cn("group rounded-full p-1")} asChild>
                                <Link href="/settings" tabIndex={-1}>
                                    <span className='sr-only'>Settings</span>
                                    <Settings
                                        className="h-4 w-4 text-foreground dark:group-hover:text-foreground-emphasis"
                                        aria-hidden="true"
                                    />
                                </Link>
                            </Button>
                            <UserDropdown staticUser={user} small />
                        </div>
                    </nav>

                    <div className="flex flex-col px-4 py-2 lg:px-12 lg:py-8">
                        {/* <ErrorBoundary> */}
                        {/* add padding to top for mobile when App Bar is fixed */}
                        <div className="pt-14 sm:hidden" />
                        <BalanceProvider>{children}</BalanceProvider>
                        {/* </ErrorBoundary> */}
                    </div>
                </main>
            </div>
        </div>
    )
}

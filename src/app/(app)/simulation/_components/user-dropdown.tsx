'use client'

import { ChevronDown, Heart, LogOut, MoreVertical } from "lucide-react";
import { Session } from "next-auth";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/core/dropdown-menu";
import FeedbackMenuItem from "~/components/ui/support/feedback-menu-item";
import { cn } from "~/lib/cn";
import { signOut } from "../_lib/server-actions";
import { Avatar, AvatarFallback, AvatarImage } from "~/app/_components/avatar";
import { RouterOutputs } from "~/lib/trpc/shared";

export default function UserDropdown({ small, staticUser }: { small?: boolean; staticUser: NonNullable<RouterOutputs['user']['get']> }) {
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const onFeedbackItemSelect = () => {
        setFeedbackOpen(false);
        setMenuOpen(false);
    };

    return (
        <DropdownMenu open={menuOpen} onOpenChange={() => setFeedbackOpen(false)}>
            <DropdownMenuTrigger onClick={() => setMenuOpen(true)} asChild>
                <button
                    className={cn(
                        "overflow-hidden group flex cursor-pointer appearance-none items-center rounded-full p-2 text-left outline-none sm:ml-1 md:ml-0 md:rounded-md",
                        "transition-all hover:bg-gray-100",
                        "dark:bg-dark-secondary dark:shadow-darkBorder dark:hover:border-dark-500 dark:hover:bg-dark-tertiary",
                        small &&
                        "[&:not(:focus-visible)]:dark:border-transparent [&:not(:focus-visible)]:dark:bg-transparent [&:not(:focus-visible)]:dark:shadow-none [&:not(:focus-visible)]:dark:hover:border-dark-500 [&:not(:focus-visible)]:dark:hover:bg-dark-tertiary [&:not(:focus-visible)]:dark:hover:shadow-darkBorder"
                    )}
                >
                    {/*Image*/}
                    <Avatar className={cn(
                        small ? "h-4 min-h-4 w-4 min-w-4" : "mr-2 h-5 min-h-5 w-5 min-w-5",
                        "bg-gray-300"
                    )}>
                        <AvatarImage src={staticUser.image} alt={staticUser.name} />
                        <AvatarFallback>{(staticUser.name)?.toUpperCase().slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    {/*Text*/}
                    {!small && (
                        <div className="flex flex-grow items-center overflow-hidden">
                            <p className="flex-grow truncate text-sm font-medium text-gray-900 dark:text-dark-neutral">
                                {staticUser.name || "Nameless User"}
                            </p>
                            <ChevronDown
                                className="min-h-4 min-w-4 h-4 w-4 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-400"
                                aria-hidden="true"
                            />
                        </div>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onInteractOutside={() => setMenuOpen(false)}>
                {feedbackOpen ? (
                    <h1>hey</h1>
                ) : (
                    <>
                        <DropdownMenuItem>
                            <button
                                className={cn(
                                    "flex w-full items-center px-4 py-2 text-sm"
                                )}
                                onClick={() => setFeedbackOpen(true)}
                            >
                                <Heart
                                    className={cn(
                                        "mr-2 h-4 w-4 flex-shrink-0",
                                        "text-gray-500 group-hover:text-neutral-500",
                                        "dark:text-dark-600 dark:group-hover:text-dark-neutral"
                                    )}
                                    aria-hidden="true"
                                />
                                Feedback
                            </button>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem>
                            <button
                                onClick={() => signOut()}
                                className="group flex cursor-pointer items-center px-4 py-2"
                            >
                                <LogOut
                                    className={cn(
                                        "mr-2 h-4 w-4 flex-shrink-0",
                                        "text-gray-500 group-hover:text-neutral-500",
                                        "dark:text-dark-600 dark:group-hover:text-dark-neutral"
                                    )}
                                    aria-hidden="true"
                                />
                                Sign out
                            </button>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

'use client'

import { cn } from "~/lib/cn";
import { formatAmount } from "~/lib/sim-settings";
import TitleWithInfo from "./title-with-info";
import { BalanceContext } from "../_lib/context";
import { useContext } from "react";

export default function BalanceHeader() {
    const { state: { totalBalance, totalBalanceHidden, totalBalanceLoading, balanceHistory } } = useContext(BalanceContext)

    return (
        <div className="flex items-baseline sm:mt-0 mb-4 lg:mb-10 z-10">
            <header
                className={cn(
                    "flex w-full mr-4 pt-4 md:p-0"
                )}
            >
                <div className="w-full sm:block">
                    <h1
                        className={cn(
                            "mb-1 font-cal text-xl font-bold capitalize tracking-wide text-black",
                            "dark:text-dark-neutral"
                        )}
                    >
                        Current balance
                    </h1>
                </div>
            </header>
            <div
                className={cn(
                    "fixed right-4 bottom-[75px] z-40",
                    "cta",
                    "flex-shrink-0 sm:relative sm:bottom-auto sm:right-auto sm:z-0"
                )}
            >
                <div className={totalBalanceHidden ? "hidden" : ""}>
                    <TitleWithInfo
                        Title={() => (
                            <div className="ml-2 text-3xl text-black dark:text-dark-neutral ">
                                {formatAmount(totalBalance)}
                            </div>
                        )}
                        infoCont={
                            <div className="text-md px-3 py-2">
                                Your total balance after{" "}
                                {balanceHistory.length === 1 ? "one" : balanceHistory.length}
                                {balanceHistory.length === 1 ? " year" : " years"} based{" "}
                                <br />
                                on salary variations, expenses, incomes, and yearly
                                investments <br />
                                on an index fund.
                            </div>
                        }
                        infoIconClassName="!h-4 !w-4"
                        className={cn(
                            "fixed right-5 top-2 z-[999999] flex-row-reverse rounded-lg px-3 py-2 ",
                            "bg-gray-50 ring-1 ring-gray-100",
                            "dark:bg-dark-secondary dark:shadow-darkBorder dark:ring-dark-400",
                            totalBalanceLoading && "animate-pulse"
                        )}
                        tooltipSide="bottom"
                    />
                </div>
            </div>
        </div>
    )
}

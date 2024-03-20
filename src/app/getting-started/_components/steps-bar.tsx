import { cn } from "~/lib/cn";
import { STEPS, MAX_STEPS } from '../_lib/constants';
import Link from "next/link";

export default function StepsBar({ crrStepIndex }: { crrStepIndex: number }) {
    return (
        <div className="mt-6 space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-dark-neutral">
                Steps {crrStepIndex + 1} of {MAX_STEPS}
            </p>
            <div className="flex w-full space-x-2">
                {STEPS.map((step, index) => {
                    return index <= crrStepIndex ? (
                        <Link
                            key={`step-${index}`}
                            href={step}
                            className={cn(
                                "h-3 py-1 w-full group",
                                index === crrStepIndex && "cursor-auto"
                            )}
                        >
                            <span className={cn(
                                "w-full h-1 block bg-black dark:bg-gray-200 transition-colors rounded-sm",
                                index < crrStepIndex && "dark:group-hover:bg-dark-accent-300"
                            )}
                            />
                        </Link>
                    ) : (
                        <div
                            key={`step-${index}`}
                            className="h-1 my-1 w-full rounded-sm bg-black bg-opacity-15 dark:bg-dark-300"
                        />
                    );
                })}
            </div>
        </div>
    );
};

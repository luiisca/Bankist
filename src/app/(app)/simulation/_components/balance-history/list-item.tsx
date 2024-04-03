import { Badge } from "~/components/ui/badge";
import TitleWithInfo from "../title-with-info";

export function ListItem({
    infoBubble,
    title,
    type,
    total,
    record,
    parentTitle
}: {
    infoBubble?: React.ReactNode;
    title: string | null;
    type: string;
    total: number;
    record?: boolean;
    parentTitle?: string;
}): JSX.Element {
    return (
        <li>
            <div className="flex items-center justify-between py-5 pl-4 hover:bg-neutral-50 dark:hover:bg-dark-tertiary sm:pl-0">
                <div className="group flex w-full items-center justify-between sm:px-6">
                    <div className="flex-grow truncate text-sm">
                        <div className="space-x-2">
                            <span className="truncate font-medium text-neutral-900 dark:text-dark-neutral">
                                {title}
                            </span>
                            <Badge
                                variant={
                                    type === "income" || type === "salary"
                                        ? "green"
                                        : "red"
                                }
                                className="text-xs"
                            >
                                {type}
                            </Badge>
                        </div>
                        {record && (
                            <p className="mt-1 text-xs text-neutral-500 dark:text-dark-600">
                                {parentTitle}
                            </p>
                        )}
                    </div>
                </div>
                {infoBubble ? (
                    <TitleWithInfo
                        Title={() => (
                            <p className="mx-1 mr-5 text-lg font-medium text-neutral-900 dark:text-dark-neutral">
                                {total}
                            </p>
                        )}
                        infoCont={
                            <div className="grid grid-cols-2 justify-items-start gap-x-2">
                                {infoBubble}
                            </div>
                        }
                        className="flex-row-reverse"
                    />
                ) : (
                    <p className="mx-1 mr-5 text-lg font-medium text-neutral-900 dark:text-dark-neutral">
                        {total}
                    </p>
                )}
            </div>
        </li>
    );
}

import { useId } from "@radix-ui/react-id";
import React, { forwardRef, ReactElement, ReactNode, Ref } from "react";
import {
    Controller,
    ControllerProps,
    FieldErrors,
    FieldValues,
    FormProvider,
    SubmitHandler,
    useFormContext,
    UseFormReturn,
} from "react-hook-form";
import objectPath from "object-path";

import { getErrorFromUnknown } from "~/lib/errors";
import { cn } from "~/lib/cn";
import { toast } from "sonner";
import { Info } from "lucide-react";

type InputProps = JSX.IntrinsicElements["input"];

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    props,
    ref
) {
    return (
        <input
            {...props}
            ref={ref}
            className={cn(
                "mb-2 block h-9 w-full rounded-md border border-gray-300 py-2 px-3 text-sm transition-colors placeholder:text-gray-400 [&:not(:focus)]:hover:border-gray-400",
                "focus:border-gray-400 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-neutral-800 focus:ring-offset-2",
                "dark:border-0 dark:ring-1 dark:ring-dark-400 dark:bg-dark-100 dark:text-dark-neutral dark:placeholder:text-dark-600 [&:not(:focus)]:dark:hover:ring-dark-500 dark:ring-offset-0 dark:focus:ring-dark-accent-200",
                "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                props.className
            )}
        />
    );
});

export function Label(props: JSX.IntrinsicElements["label"]) {
    return (
        <label
            {...props}
            className={cn(
                "mb-2 block text-sm font-medium leading-none text-gray-700",
                "dark:text-dark-800",
                props.className
            )}
        >
            {props.children}
        </label>
    );
}

export function Errors<T extends FieldValues = FieldValues>(props: {
    fieldName: string;
}) {
    const methods = useFormContext() as ReturnType<typeof useFormContext> | null;
    /* If there's no methods it means we're using these components outside a React Hook Form context */
    if (!methods) return null;
    const { formState } = methods;
    const { fieldName } = props;

    const fieldErrors: FieldErrors<T> | undefined = objectPath.get(
        formState.errors,
        fieldName
    );
    // console.log('fieldErrors', fieldErrors)

    if (!fieldErrors) return null;

    return (
        <div className="text-gray mt-2 flex items-center text-sm text-red-700">
            <Info className="mr-1 h-3 w-3" />
            <>{fieldErrors.message}</>
        </div>
    );
}

type InputFieldProps = {
    label?: ReactNode;
    hint?: ReactNode;
    addOnLeading?: ReactNode;
    addOnSuffix?: ReactNode;
    addOnFilled?: boolean;
    error?: string;
    loader?: ReactNode;
    labelSrOnly?: boolean;
    containerClassName?: string;
} & React.ComponentProps<typeof Input> & {
    labelProps?: React.ComponentProps<typeof Label>;
    labelClassName?: string;
};

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
    function InputField(props, ref) {
        const id = useId();
        const name = props.name || "";
        const {
            label,
            labelProps,
            labelClassName,
            placeholder = "",
            className,
            addOnLeading,
            addOnSuffix,
            addOnFilled = true,
            loader,
            hint,
            labelSrOnly,
            containerClassName,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ...passThrough
        } = props;

        return (
            <div className={cn(containerClassName)}>
                {!!label && (
                    <Label
                        htmlFor={id}
                        {...labelProps}
                        className={cn(
                            labelClassName,
                            labelSrOnly && "sr-only",
                            props.error && "text-red-900"
                        )}
                    >
                        {label}
                    </Label>
                )}
                {addOnLeading || addOnSuffix ? (
                    <div
                        className={cn(
                            "mb-1 flex items-center rounded-md ",
                            "border border-gray-300 hover:border-gray-400",
                            "focus-within:ring-2 focus-within:ring-neutral-800 focus-within:ring-offset-2",
                            "focus-within:border-gray-400 focus-within:outline-none ",
                            "dark:border-dark-400 dark:focus-within:border-dark-accent-200 dark:focus-within:ring-0 dark:focus-within:ring-offset-0 dark:hover:border-dark-accent-200 [&:not(:focus-within)]:dark:hover:border-dark-500",
                            addOnSuffix && "group flex-row-reverse"
                        )}
                    >
                        <div
                            className={cn(
                                "h-9 px-3",
                                addOnFilled && "bg-gray-100",
                                addOnLeading && "rounded-l-md",
                                addOnSuffix && "rounded-r-md",
                                "dark:bg-dark-tertiary"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex h-full flex-col justify-center px-1 text-sm",
                                    props.error && "text-red-900"
                                )}
                            >
                                <span className="whitespace-nowrap py-2.5">
                                    {addOnLeading || addOnSuffix}
                                </span>
                            </div>
                        </div>
                        <div className="relative w-full">
                            <Input
                                id={id}
                                placeholder={placeholder}
                                className={cn(
                                    className,
                                    addOnLeading &&
                                    "rounded-l-none border-l !border-l-gray-300 dark:!border-l-dark-400",
                                    addOnSuffix &&
                                    "rounded-r-none border-r !border-r-gray-300 dark:!border-r-dark-400",
                                    "!my-0 border-0 !ring-0 focus-visible:ring-offset-0"
                                )}
                                {...passThrough}
                                ref={ref}
                            />
                            {loader}
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full">
                        <Input
                            id={id}
                            placeholder={placeholder}
                            className={className}
                            {...passThrough}
                            ref={ref}
                        />

                        {loader}
                    </div>
                )}
                <Errors fieldName={name} />
                {hint && (
                    <div className="text-gray mt-2 flex items-center text-sm text-gray-700">
                        {hint}
                    </div>
                )}
            </div>
        );
    }
);

export const TextField = forwardRef<HTMLInputElement, InputFieldProps>(
    function TextField(props, ref) {
        return <InputField ref={ref} {...props} />;
    }
);

export const EmailField = forwardRef<HTMLInputElement, InputFieldProps>(
    function EmailField(props, ref) {
        return (
            <InputField
                ref={ref}
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                inputMode="email"
                {...props}
            />
        );
    }
);

export const NumberInput = <T extends FieldValues = FieldValues>(
    arg: Omit<ControllerProps<T>, "render"> & {
        label?: string;
        placeholder?: string;
        addOnSuffix?: ReactNode;
        className?: string;
        loader?: ReactNode;
        customNumValidation?: boolean;
        onChange?: (...event: any[]) => number | string;
        value?: (...event: any[]) => number | string;
    }
) => {
    return (
        <Controller
            {...arg}
            render={({ field }) => (
                <TextField
                    {...field}
                    type="number"
                    className={cn(arg.className)}
                    label={arg.label}
                    addOnSuffix={arg.addOnSuffix}
                    placeholder={arg.placeholder}
                    loader={arg.loader}
                    onChange={(e) => {
                        let parsedValue = e.target.valueAsNumber;
                        if (Number.isNaN(parsedValue)) {
                            return field.onChange('')
                        }

                        if (arg.customNumValidation && arg.onChange) {
                            return field.onChange(arg.onChange(parsedValue))
                        } else {
                            if (parsedValue <= 0) {
                                return field.onChange(1)
                            }

                            if (arg.onChange) {
                                field.onChange(arg.onChange(parsedValue));
                            } else {
                                field.onChange(parsedValue);
                            }
                        }
                    }}
                />
            )}
        />
    );
};

type FormProps<T extends object> = {
    form: UseFormReturn<T>;
    customInputValidation?: () => boolean;
    handleSubmit: SubmitHandler<T>;
} & Omit<JSX.IntrinsicElements["form"], "onSubmit">;

const PlainForm = <T extends FieldValues>(
    props: FormProps<T>,
    ref: Ref<HTMLFormElement>
) => {
    const { form, customInputValidation, handleSubmit, ...passThrough } = props;

    return (
        <FormProvider {...form}>
            <form
                ref={ref}
                onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    if (!customInputValidation || (customInputValidation && customInputValidation())) {
                        form
                            .handleSubmit(handleSubmit)(event)
                            .catch((err) => {
                                toast.error(`${getErrorFromUnknown(err).message}`);
                            });
                    }
                }}
                {...passThrough}
            >
                {
                    /* @see https://react-hook-form.com/advanced-usage/#SmartFormComponent */
                    // to provide register prop to every valid child field
                    React.Children.map(props.children, (child) => {
                        return typeof child !== "string" &&
                            typeof child !== "number" &&
                            typeof child !== "boolean" &&
                            child &&
                            "props" in child &&
                            child.props.name
                            ? React.createElement(child.type, {
                                ...{
                                    ...child.props,
                                    register: form.register,
                                    key: child.props.name,
                                },
                            })
                            : child;
                    })
                }
            </form>
        </FormProvider >
    );
};

export const Form = forwardRef(PlainForm) as <T extends FieldValues>(
    p: FormProps<T> & { ref?: Ref<HTMLFormElement> }
) => ReactElement;

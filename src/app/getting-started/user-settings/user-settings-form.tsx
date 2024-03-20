'use client'

import { Controller, useForm } from "react-hook-form";
import {
    Button,
    Form,
    TextField,
} from "~/components/ui";
import { RouterOutputs } from "~/lib/trpc/shared";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../../_components/avatar";
import ImageUploader from "~/components/ui/core/ImageUploader";
import { SettingsProfileInputType, settingsProfileInputZod } from "prisma/zod-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/lib/trpc/react";
import { ArrowRight } from "lucide-react";
import { STEPS } from "../_lib/constants";
import { useRouter } from "next/navigation";

export default function UserSettingsForm({ user, nextStep }: { user: NonNullable<RouterOutputs['user']['get']>; nextStep: typeof STEPS[number] }) {
    const router = useRouter();
    const utils = api.useUtils();
    const { data: _user } = api.user.get.useQuery()
    const userSettingsForm = useForm<SettingsProfileInputType>({
        resolver: zodResolver(settingsProfileInputZod),
        defaultValues: {
            name: user.name,
            image: user.image ?? undefined,
        }
    });

    const mutation = api.user.set.useMutation({
        onMutate: async (input) => {
            router.push(`/getting-started/${nextStep}`)
            await utils.user.get.cancel();
            const oldUserData = utils.user.get.getData();
            if ('name' in input) {
                oldUserData && utils.user.get.setData(undefined, {
                    ...oldUserData,
                    name: input.name,
                })
            }

            return { oldUserData }
        },
        onSuccess: () => {
            toast.success("User updated");
        },
        onError: (e, v, ctx) => {
            toast.error("Error updating settings. Please try again");
            if (ctx) {
                utils.user.get.setData(undefined, ctx.oldUserData)
            }
            router.push('/getting-started/user-settings')
        },
    });
    const profileImgMutation = api.user.setProfileImg.useMutation({
        onMutate: ({ image }) => {
            const oldUserData = utils.user.get.getData();
            oldUserData && utils.user.get.setData(undefined, {
                ...oldUserData,
                image,
            })

            return { oldUserData }
        },
        onSuccess: () => {
            toast.success("Profile image updated");
        },
        onError: (e, v, ctx) => {
            toast.error("Error updating profile image. Please try again");
            if (ctx) {
                utils.user.get.setData(undefined, ctx.oldUserData)
            }
        },
    })

    return (
        <Form
            form={userSettingsForm}
            handleSubmit={(values) => {
                const parsedUserSettings = {
                    ...values,
                    name: values.name || 'Nameless'
                }
                mutation.mutate(parsedUserSettings);
            }}
        >
            {/* avatar */}
            <div className="flex items-center">
                <Controller
                    control={userSettingsForm.control}
                    name="image"
                    render={() => {
                        return (
                            <>
                                <Avatar>
                                    <AvatarImage src={_user?.image || user.image} alt={_user?.name || user.name || 'Nameless user'} />
                                    <AvatarFallback>{(_user?.name || user.name)?.toUpperCase().slice(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4">
                                    <ImageUploader
                                        id="avatar-upload"
                                        buttonMsg="Change Avatar"
                                        handleImageChange={(newImg) => {
                                            profileImgMutation.mutate({ image: newImg });
                                        }}
                                        imageSrc={user.image}
                                        userName={_user?.name || user.name}
                                    />
                                </div>
                            </>
                        )
                    }}
                />
            </div>
            {/* name */}
            <div className="mt-8">
                <TextField label="Name" placeholder="John Doe" {...userSettingsForm.register("name")} />
            </div>

            <Button
                type="submit"
                color="primary"
                className="mt-8 flex w-full flex-row justify-center"
                loading={mutation.isLoading}
            >
                Next Step
                <ArrowRight
                    className="ml-2 h-4 w-4 self-center"
                    aria-hidden="true"
                />
            </Button>
        </Form>
    );
};

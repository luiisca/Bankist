'use client'

import { Controller, useForm } from "react-hook-form";
import {
    Button,
    Form,
    Label,
    TextField,
} from "~/components/ui";
import { RouterOutputs } from "~/lib/trpc/shared";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/app/_components/avatar";
import { DialogContentConfirmation } from "~/components/ui/custom-dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Dialog, DialogTrigger } from "~/components/ui/core/dialog";
import ImageUploader from "~/components/ui/core/ImageUploader";
import { SettingsProfileInputType, settingsProfileInputZod } from "prisma/zod-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/lib/trpc/react";

export default function ProfileForm({ user }: { user: NonNullable<RouterOutputs['user']['get']> }) {
    const utils = api.useUtils();
    const { data: _user } = api.user.get.useQuery()
    const profileForm = useForm<SettingsProfileInputType>({
        resolver: zodResolver(settingsProfileInputZod),
        defaultValues: {
            name: user.name,
            image: user.image,
        }
    });
    const { formState: { isSubmitting, isDirty } } = profileForm;

    const mutation = api.user.set.useMutation({
        onMutate: async (input) => {
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
    const deleteUserMutation = api.user.deleteMe.useMutation({
        onSuccess: async () => {
            await utils.user.get.invalidate();
            toast.success("Your account was deleted");

            signOut({ callbackUrl: "/logout" });
        },
        onError: () => {
            toast.error("Something went wrong. Please try again")
        },
        async onSettled() {
            await utils.user.get.invalidate();
        },
    });

    return (
        <Form
            form={profileForm}
            handleSubmit={(values) => {
                const parsedUserSettings = {
                    ...values,
                    name: values.name || 'Nameless'
                }
                mutation.mutate(parsedUserSettings);
            }}
        >
            <div className="flex items-center">
                <Controller
                    control={profileForm.control}
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
                                    />
                                </div>
                            </>
                        )
                    }}
                />
            </div>
            {/* name */}
            <div className="mt-8">
                <TextField label="Name" placeholder="John Doe" {...profileForm.register("name")} />
            </div>

            <Button
                disabled={isSubmitting || !isDirty}
                className="mt-6"
                type="submit"
                loading={mutation.isLoading}
            >
                Update
            </Button>

            <hr className="my-8  border-neutral-200 dark:border-dark-350" />

            <Label>Danger zone</Label>
            {/* Delete account Dialog */}
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        data-testid="delete-account"
                        color="destructive"
                        className="mt-1 border-2"
                        StartIcon={Trash2}
                    >
                        Delete account
                    </Button>
                </DialogTrigger>
                <DialogContentConfirmation
                    title="Delete Account"
                    description="Are you sure you want to delete your Budgetist account?"
                    Icon={AlertTriangle}
                    actionProps={{
                        actionText: "Delete my account",
                        onClick: (e) => {
                            if (e) {
                                e.preventDefault();
                                deleteUserMutation.mutate();
                            }
                        }
                    }}
                >
                    <>
                        <p className="mb-7">
                            Are you sure you want to delete your Budgetist account? Any
                            preferences you have saved will be lost.
                        </p>
                    </>
                </DialogContentConfirmation>
            </Dialog>
        </Form>
    )
}

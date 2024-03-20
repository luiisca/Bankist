'use client'

import { api } from "~/lib/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/app/_components/avatar";

export default function ProfileImage({ image, name }: { image?: string; name?: string }) {
    const { data: user } = api.user.get.useQuery()

    return (
        <Avatar className='h-full w-full'>
            <AvatarImage src={user?.image || image} alt={(user?.name || name) ?? "Nameless User"} />
            <AvatarFallback>{((user?.name || name) ?? "Nameless")?.toUpperCase().slice(0, 2)}</AvatarFallback>
        </Avatar>
    )
}

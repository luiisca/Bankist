'use server'

import { signOut as _signOut } from "~/app/(auth)/auth";

export async function signOut() {
    await _signOut({ redirectTo: "/logout" })
}

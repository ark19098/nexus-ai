"use server"

import { signOut, update } from "./config";

export async function signOutAction() {
    await signOut({ redirectTo: "/login" });
}

export async function switchOrgAction(newOrgId: string, newRole: string) {
    await update({ user: { orgId: newOrgId, role: newRole } });
}
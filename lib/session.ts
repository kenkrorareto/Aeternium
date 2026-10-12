import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "./auth";

export async function isAdmin(): Promise<boolean> {
  try {
    const store = await cookies();
    return await verifySessionToken(store.get(ADMIN_COOKIE)?.value);
  } catch {
    return false;
  }
}

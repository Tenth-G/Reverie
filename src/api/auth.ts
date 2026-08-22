import { request } from "./client.ts";

/** Best-effort server-side logout for the current QR-authenticated session. */
export async function logoutFromNetease(): Promise<void> {
  await request("/logout", {}, false);
}

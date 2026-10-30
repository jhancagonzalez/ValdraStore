import { headers } from "next/headers";
import { cache } from "react";
import { getPayloadClient } from "@/lib/payload";

/** Current session user (any auth collection), or null when signed out. */
export const getSessionUser = cache(async () => {
  const readSession = async () => {
    const payload = await getPayloadClient();
    const { user } = await payload.auth({ headers: await headers() });
    return user;
  };

  try {
    return await readSession();
  } catch {
    try {
      // One retry smooths over transient DNS/pooler failures before falling back.
      return await readSession();
    } catch {
      // A database hiccup must not take the whole storefront down: render as anonymous.
      return null;
    }
  }
});

/** Current customer session, or null when signed out or signed in as admin. */
export const getSessionCustomer = async () => {
  const user = await getSessionUser();
  return user?.collection === "customers" ? user : null;
};

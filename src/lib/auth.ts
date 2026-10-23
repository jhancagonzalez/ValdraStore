import { headers } from "next/headers";
import { getPayloadClient } from "@/lib/payload";

/** Current session user (any auth collection), or null when signed out. */
export const getSessionUser = async () => {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await headers() });
  return user;
};

/** Current customer session, or null when signed out or signed in as admin. */
export const getSessionCustomer = async () => {
  const user = await getSessionUser();
  return user?.collection === "customers" ? user : null;
};

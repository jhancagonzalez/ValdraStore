import configPromise from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";

/** Shared Payload client for server components and server-side helpers. */
export const getPayloadClient = cache(async () => getPayload({ config: configPromise }));

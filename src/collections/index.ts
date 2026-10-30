import { Admins } from "@/collections/Admins";
import { Customers } from "@/collections/Customers";
import { Media } from "@/collections/Media";
import { PrivateSpikeMedia } from "@/collections/PrivateSpikeMedia";
import { withRoleManagement } from "@/plugins/role-management";

/** Admins and customers also get the HU-05 role-change endpoint and panel control. */
export const collections = withRoleManagement([Admins, Customers, Media, PrivateSpikeMedia]);

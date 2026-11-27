import { Admins } from "@/collections/Admins";
import { ApprovedDesigns } from "@/collections/ApprovedDesigns";
import { Categories } from "@/collections/Categories";
import { Customers } from "@/collections/Customers";
import { Designs } from "@/collections/Designs";
import { GarmentStock } from "@/collections/GarmentStock";
import { Media } from "@/collections/Media";
import { Orders } from "@/collections/Orders";
import { PrivateSpikeMedia } from "@/collections/PrivateSpikeMedia";
import { withRoleManagement } from "@/plugins/role-management";

/** Admins and customers also get the HU-05 role-change endpoint and panel control. */
export const collections = withRoleManagement([
  Admins,
  Customers,
  Media,
  Categories,
  Designs,
  PrivateSpikeMedia,
  ApprovedDesigns,
  Orders,
  GarmentStock,
]);

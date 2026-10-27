import type { Payload } from "payload";
import type { Customer } from "../../../payload-types";

export const PROFILE_NAME_MIN_LENGTH = 2;
export const PROFILE_NAME_MAX_LENGTH = 80;
export const PROFILE_PHONE_MAX_LENGTH = 20;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

/** Fields a customer is allowed to edit on their own profile (HU-04). */
export const EDITABLE_PROFILE_FIELDS = ["name", "email", "phone"] as const;

export type EditableProfileField = (typeof EDITABLE_PROFILE_FIELDS)[number];

export type ProfileFieldErrors = Partial<Record<EditableProfileField, string>>;

export type CustomerProfile = {
  email: string;
  id: number;
  name: string;
  phone: string | null;
};

export type ProfileInput = {
  email?: unknown;
  name?: unknown;
  phone?: unknown;
};

export type ParsedProfile =
  | {
      ok: true;
      data: { email: string; name: string; phone: string | null };
    }
  | { ok: false; fieldErrors: ProfileFieldErrors };

export type ProfileUpdateResult =
  | { ok: true; profile: CustomerProfile }
  | { ok: false; reason: "email_in_use" }
  | { ok: false; reason: "failed" }
  | { ok: false; fieldErrors: ProfileFieldErrors; reason: "invalid" };

/** Result shape shared by the server action and the profile form. */
export type ProfileFormState = {
  fieldErrors?: ProfileFieldErrors;
  message?: string;
  status: "idle" | "success" | "error";
};

/**
 * Normalizes and validates the editable profile fields. Anything outside the
 * whitelist is discarded, so the client can never send `role`, `password` or an
 * `id` that reaches Payload.
 */
export const parseProfileInput = (input: ProfileInput): ParsedProfile => {
  const fieldErrors: ProfileFieldErrors = {};

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < PROFILE_NAME_MIN_LENGTH || name.length > PROFILE_NAME_MAX_LENGTH) {
    fieldErrors.name = `El nombre debe tener entre ${PROFILE_NAME_MIN_LENGTH} y ${PROFILE_NAME_MAX_LENGTH} caracteres.`;
  }

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Escribe un correo electrónico válido.";
  }

  const rawPhone = typeof input.phone === "string" ? input.phone.trim() : "";
  let phone: string | null = null;

  if (rawPhone.length > 0) {
    if (PHONE_PATTERN.test(rawPhone)) {
      phone = rawPhone;
    } else {
      fieldErrors.phone = `El teléfono debe tener entre 7 y ${PROFILE_PHONE_MAX_LENGTH} caracteres: dígitos, espacios, guiones o paréntesis.`;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, ok: false };
  }

  return { data: { email, name, phone }, ok: true };
};

const toProfile = (customer: Customer): CustomerProfile => ({
  email: customer.email,
  id: customer.id,
  name: customer.name,
  phone: customer.phone ?? null,
});

/**
 * Reads the signed-in customer's own document through the collection access
 * rules, which proves the ownership scope of HU-04 instead of trusting the
 * session object alone.
 */
export const getCustomerProfile = async (
  payload: Payload,
  customer: Customer,
): Promise<CustomerProfile | null> => {
  try {
    const document = await payload.findByID({
      collection: "customers",
      depth: 0,
      id: customer.id,
      overrideAccess: false,
      user: customer,
    });

    return document ? toProfile(document) : null;
  } catch {
    return null;
  }
};

/**
 * Saves the customer's own profile. Access runs as the customer, so Payload
 * re-checks ownership on the server; the duplicate email check runs before the
 * write to return a readable message instead of a database constraint error.
 */
export const updateCustomerProfile = async (
  payload: Payload,
  customer: Customer,
  input: ProfileInput,
): Promise<ProfileUpdateResult> => {
  const parsed = parseProfileInput(input);

  if (!parsed.ok) {
    return { fieldErrors: parsed.fieldErrors, ok: false, reason: "invalid" };
  }

  const { email, name, phone } = parsed.data;

  if (email !== customer.email.trim().toLowerCase()) {
    const duplicate = await payload.find({
      collection: "customers",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [{ email: { equals: email } }, { id: { not_equals: customer.id } }],
      },
    });

    if (duplicate.docs.length > 0) {
      return { ok: false, reason: "email_in_use" };
    }
  }

  try {
    const updated = await payload.update({
      collection: "customers",
      data: { email, name, phone },
      depth: 0,
      id: customer.id,
      overrideAccess: false,
      user: customer,
    });

    return { ok: true, profile: toProfile(updated) };
  } catch {
    return { ok: false, reason: "failed" };
  }
};

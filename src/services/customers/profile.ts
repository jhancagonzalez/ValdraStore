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

/** `currentPassword` is not editable data: it only authorizes an email change. */
export type ProfileFieldErrors = Partial<Record<EditableProfileField | "currentPassword", string>>;

export type CustomerProfile = {
  email: string;
  id: number;
  name: string;
  phone: string | null;
};

export type ProfileInput = {
  currentPassword?: unknown;
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
  | { ok: false; reason: "invalid_password" }
  | { ok: false; reason: "locked" }
  | { ok: false; fieldErrors: ProfileFieldErrors; reason: "password_required" }
  | { ok: false; fieldErrors: ProfileFieldErrors; reason: "invalid" };

/** Fields as typed by the customer, echoed back when a save fails. */
export type ProfileFieldValues = {
  email: string;
  name: string;
  phone: string;
};

/** Result shape shared by the server action and the profile form. */
export type ProfileFormState = {
  fieldErrors?: ProfileFieldErrors;
  message?: string;
  status: "idle" | "success" | "error";
  values?: ProfileFieldValues;
};

/**
 * Normalizes and validates the editable profile fields. Anything outside the
 * whitelist is discarded, so the client can never send `role`, `id` or an
 * arbitrary `password` that reaches Payload. `currentPassword` is read
 * separately and only authorizes an email change; it is never written.
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

/** Compares the stored email with the requested one after normalizing both. */
export const isEmailChange = (currentEmail: string, nextEmail: string): boolean =>
  currentEmail.trim().toLowerCase() !== nextEmail.trim().toLowerCase();

/** http-status 423, the status Payload uses for a temporarily locked account. */
const LOCKED_STATUS = 423;

/**
 * Checks the password typed before an email change. Payload has no standalone
 * verifier, so this runs its login operation against the stored password hash
 * and discards the returned token. A wrong password counts as a login attempt,
 * the same brute-force protection the login form already applies.
 */
const verifyCurrentPassword = async (
  payload: Payload,
  customer: Customer,
  password: string,
): Promise<"invalid" | "locked" | "valid"> => {
  try {
    await payload.login({
      collection: "customers",
      data: { email: customer.email, password },
      depth: 0,
    });

    return "valid";
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error
        ? (error as { status?: unknown }).status
        : undefined;

    return status === LOCKED_STATUS ? "locked" : "invalid";
  }
};

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
 * Changing the email (the login identifier) requires the current password.
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
  const emailChanged = isEmailChange(customer.email, email);

  if (emailChanged) {
    const currentPassword =
      typeof input.currentPassword === "string" ? input.currentPassword.trim() : "";

    if (currentPassword.length === 0) {
      return {
        fieldErrors: { currentPassword: "Escribe tu contraseña actual para cambiar el correo." },
        ok: false,
        reason: "password_required",
      };
    }

    const verification = await verifyCurrentPassword(payload, customer, currentPassword);

    if (verification !== "valid") {
      return { ok: false, reason: verification === "locked" ? "locked" : "invalid_password" };
    }

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
      context: { emailChangeVerified: emailChanged },
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

"use client";

type PasswordStrengthProps = {
  value: string;
};

const checksFor = (value: string) => [
  { label: "Al menos 8 caracteres", met: value.length >= 8 },
  { label: "Una mayúscula y una minúscula", met: /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { label: "Un número o un símbolo", met: /[\d\W_]/.test(value) },
];

/**
 * Live guidance while typing a password. The length rule is the only one the
 * server enforces; the other two explain how to make it stronger. The status
 * paragraph is mounted from the start so later updates get announced.
 */
export const PasswordStrength = ({ value }: PasswordStrengthProps) => {
  const hasValue = value.length > 0;
  const checks = hasValue ? checksFor(value) : [];
  const met = checks.filter((check) => check.met).length;
  const score = met + (value.length >= 12 ? 1 : 0);
  const level = hasValue ? (score >= 4 ? "Fuerte" : score >= 2 ? "Media" : "Débil") : "";
  const filled = level === "Fuerte" ? 3 : level === "Media" ? 2 : 1;

  return (
    <div className="password-strength">
      {hasValue ? (
        <div className="password-meter" aria-hidden="true">
          {[1, 2, 3].map((segment) => (
            <span key={segment} className={segment <= filled ? "is-filled" : undefined} />
          ))}
        </div>
      ) : null}
      <p className="password-strength-label" aria-live="polite" role="status">
        {level ? `Seguridad: ${level}` : ""}
      </p>
      {hasValue ? (
        <ul className="password-rules">
          {checks.map((check) => (
            <li key={check.label} className={check.met ? "is-met" : undefined}>
              {check.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

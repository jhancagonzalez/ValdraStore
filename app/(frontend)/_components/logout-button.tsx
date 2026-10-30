"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutButtonProps = {
  /** Payload auth collection endpoint: customers by default, admins from the panel link. */
  endpoint?: string;
  className?: string;
};

/** Signs the current user out through Payload's REST endpoint and refreshes the shell. */
export const LogoutButton = ({
  endpoint = "/api/customers/logout",
  className,
}: LogoutButtonProps) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const logout = async () => {
    setPending(true);
    try {
      await fetch(endpoint, { credentials: "include", method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <button type="button" className={className} onClick={logout} disabled={pending}>
      {pending ? "Cerrando…" : "Cerrar sesión"}
    </button>
  );
};

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Signs the customer out through Payload's REST endpoint and refreshes the shell. */
export const LogoutButton = () => {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const logout = async () => {
    setPending(true);
    try {
      await fetch("/api/customers/logout", { credentials: "include", method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <button type="button" onClick={logout} disabled={pending}>
      {pending ? "Cerrando…" : "Cerrar sesión"}
    </button>
  );
};

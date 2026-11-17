"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "./toast";

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
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  const logout = async () => {
    setPending(true);
    try {
      const response = await fetch(endpoint, { credentials: "include", method: "POST" });

      if (!response.ok) {
        toast({
          title: "No pudimos cerrar sesión",
          description: "Inténtalo de nuevo.",
          tone: "error",
        });
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      toast({
        title: "No pudimos conectar con el servidor",
        description: "Revisa tu conexión e inténtalo de nuevo.",
        tone: "error",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <button type="button" className={className} onClick={logout} disabled={pending}>
      {pending ? "Cerrando…" : "Cerrar sesión"}
    </button>
  );
};

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type BottomNavProps = {
  isAdmin: boolean;
  isCustomer: boolean;
};

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <path
      d="M4 10.5 12 4l8 6.5V20h-5.5v-5h-5v5H4v-9.5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const CatalogIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <rect
      x="4"
      y="4"
      width="6.5"
      height="6.5"
      rx="1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <rect
      x="13.5"
      y="4"
      width="6.5"
      height="6.5"
      rx="1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <rect
      x="4"
      y="13.5"
      width="6.5"
      height="6.5"
      rx="1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <rect
      x="13.5"
      y="13.5"
      width="6.5"
      height="6.5"
      rx="1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

const CustomizeIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <path
      d="m5 19 3.6-.7L19 7.9a2.1 2.1 0 0 0-3-3L5.7 15.4 5 19Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M13.8 6.2 17.8 10.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const AccountIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <circle cx="12" cy="8" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M5.2 20c.5-4 3.2-6 6.8-6s6.3 2 6.8 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Navegación inferior real de móvil: cuatro destinos existentes, estado activo
 * visible y área táctil de 56 px.
 */
export const BottomNav = ({ isAdmin, isCustomer }: BottomNavProps) => {
  const pathname = usePathname();
  const accountHref = isAdmin ? "/admin" : isCustomer ? "/cuenta" : "/login";
  const accountLabel = isAdmin ? "Panel" : isCustomer ? "Cuenta" : "Ingresar";

  const items = [
    { href: "/", label: "Inicio", icon: <HomeIcon /> },
    { href: "/catalogo", label: "Catálogo", icon: <CatalogIcon /> },
    { href: "/personalizar", label: "Personalizador", icon: <CustomizeIcon /> },
    { href: accountHref, label: accountLabel, icon: <AccountIcon /> },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href === accountHref) {
      return (
        pathname.startsWith("/cuenta") ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/registro") ||
        pathname.startsWith("/admin")
      );
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bottom-nav" aria-label="Navegación móvil">
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={isActive(item.href) ? "is-active" : undefined}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import logoValdra from "@/assets/logo_valdra.png";
import { LogoutButton } from "./logout-button";
import { SearchDialog } from "./search-dialog";

type SiteHeaderProps = {
  isAdmin: boolean;
  isCustomer: boolean;
};

const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" focusable="false">
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

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" focusable="false">
    <path
      d="M4 8h16M4 16h16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" focusable="false">
    <path
      d="m6 6 12 12M18 6 6 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Shell de escritorio: marca a la izquierda, navegación centrada y acciones
 * reales a la derecha (cuenta y menú). En móvil se reduce a logo centrado,
 * cuenta, menú y la barra inferior fija.
 */
export const SiteHeader = ({ isAdmin, isCustomer }: SiteHeaderProps) => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  const accountHref = isAdmin ? "/admin" : isCustomer ? "/cuenta" : "/login";
  const accountLabel = isAdmin ? "Panel" : isCustomer ? "Mi cuenta" : "Iniciar sesión";

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/catalogo", label: "Catálogo" },
    { href: "/personalizar", label: "Personalizador" },
    ...(isCustomer ? [{ href: "/pedidos", label: "Pedidos" }] : []),
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (menuPanelRef.current?.contains(target) || menuButtonRef.current?.contains(target)) {
        return;
      }
      setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="Valdra Store, inicio">
          <Image className="brand-mark" src={logoValdra} alt="" height={44} />
          <span className="brand-name">
            <span className="brand-word">Valdra</span>
            <span className="brand-sub">Store</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Principal">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? "is-active" : undefined}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-tools">
          <SearchDialog />
          <Link
            href={accountHref}
            className="icon-button"
            aria-label={accountLabel}
            title={accountLabel}
          >
            <UserIcon />
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            className="icon-button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? "site-menu" : undefined}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div id="site-menu" ref={menuPanelRef} className="site-menu">
          <nav aria-label="Menú principal">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={isActive(link.href) ? "is-active" : undefined}
                aria-current={isActive(link.href) ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/personalizar/avisos" onClick={() => setMenuOpen(false)}>
              Avisos y recomendaciones
            </Link>
            <Link href="/terminos" onClick={() => setMenuOpen(false)}>
              Términos y condiciones
            </Link>
          </nav>
          <div className="site-menu-actions">
            {isCustomer || isAdmin ? (
              <LogoutButton
                className="button button-secondary"
                endpoint={isAdmin ? "/api/admins/logout" : undefined}
              />
            ) : (
              <Link
                href="/registro"
                className="button button-primary"
                onClick={() => setMenuOpen(false)}
              >
                Crear cuenta
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
};

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/common/Logo";
import Icon from "@/components/common/Icon";
import { CONTACT, MAIN_NAV, ROUTES } from "@/constants/site";

function isNavigationActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header({
  contact = CONTACT,
  navigation = MAIN_NAV,
  siteName = "Medicare Hospital"
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeRef = useRef(null);
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    if (open) {
      closeRef.current?.focus();
    } else if (wasOpenRef.current) {
      menuButtonRef.current?.focus();
    }
    wasOpenRef.current = open;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab" && open && menuRef.current) {
        const focusable = Array.from(
          menuRef.current.querySelectorAll("a[href], button:not([disabled])")
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("menu-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className={`siteHeader ${scrolled ? "is-scrolled" : ""}`}>
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="topbar__group">
            <a href={contact.phoneHref}><Icon name="phone" size={15} />{contact.phone}</a>
            <span><Icon name="clock" size={15} />{contact.hours}</span>
          </div>
          <div className="topbar__group topbar__group--right">
            <a
              className="topbar__emergency"
              href={contact.whatsappHref || contact.phoneHref}
              target={contact.whatsappHref ? "_blank" : undefined}
              rel={contact.whatsappHref ? "noopener noreferrer" : undefined}
            >
              WhatsApp <strong>{contact.whatsapp || contact.phone}</strong>
            </a>
            <span className="languageButton" aria-label="Dil: Azərbaycan">
              AZ <Icon name="chevron" size={13} />
            </span>
          </div>
        </div>
      </div>
      <div className="navShell">
        <div className="container navShell__inner">
          <Logo siteName={siteName} />
          <nav className="desktopNav" aria-label="Əsas naviqasiya">
            {navigation.map((item) => {
              const active = isNavigationActive(pathname, item.href);
              return (
                <Link
                  className={active ? "is-active" : ""}
                  href={item.href}
                  key={item.id || `${item.href}-${item.label}`}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="navActions">
            <Link className="iconButton navSearch" href={ROUTES.search} aria-label="Saytda axtar">
              <Icon name="search" size={20} />
            </Link>
            <Link className="button button--primary navAppointment" href={ROUTES.appointment}>
              Qəbula yazıl <Icon name="arrow" size={18} />
            </Link>
            <button
              ref={menuButtonRef}
              className="mobileMenuButton"
              type="button"
              aria-label="Menyunu aç"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(true)}
            >
              <Icon name="menu" size={25} />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={menuRef}
        className={`mobileMenu ${open ? "is-open" : ""}`}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobil menyu"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="mobileMenu__header">
          <Logo siteName={siteName} />
          <button
            ref={closeRef}
            className="iconButton"
            type="button"
            aria-label="Menyunu bağla"
            onClick={() => setOpen(false)}
          >
            <Icon name="close" size={24} />
          </button>
        </div>
        <nav className="mobileMenu__nav" aria-label="Mobil naviqasiya">
          {navigation.map((item, index) => (
            <Link
              className={isNavigationActive(pathname, item.href) ? "is-active" : ""}
              href={item.href}
              key={item.id || `${item.href}-${item.label}`}
              tabIndex={open ? 0 : -1}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              aria-current={isNavigationActive(pathname, item.href) ? "page" : undefined}
            >
              <span>0{index + 1}</span>{item.label}<Icon name="arrowUpRight" size={20} />
            </Link>
          ))}
        </nav>
        <div className="mobileMenu__footer">
          <Link className="button button--primary button--wide" href={ROUTES.appointment} tabIndex={open ? 0 : -1}>
            Qəbula yazıl
          </Link>
          <a href={contact.phoneHref} tabIndex={open ? 0 : -1}>{contact.phone}</a>
          <span>{contact.address}</span>
        </div>
      </div>
      {open && <button className="mobileMenuBackdrop" type="button" aria-label="Menyunu bağla" onClick={() => setOpen(false)} />}
    </header>
  );
}

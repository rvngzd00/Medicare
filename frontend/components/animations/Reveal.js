"use client";

import { useReveal } from "@/hooks/useReveal";

export default function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "up",
  as: Element = "div"
}) {
  const { ref, visible } = useReveal();

  return (
    <Element
      ref={ref}
      className={`reveal reveal--${variant} ${visible ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` }}
    >
      {children}
    </Element>
  );
}

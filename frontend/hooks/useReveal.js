"use client";

import { useEffect, useRef, useState } from "react";

export function useReveal({ threshold = 0.14, once = true } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: "0px 0px -32px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold]);

  return { ref, visible };
}

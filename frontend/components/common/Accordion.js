"use client";

import { useState } from "react";
import Icon from "@/components/common/Icon";

export default function Accordion({ items, allowMultiple = false }) {
  const [open, setOpen] = useState(() => new Set([0]));

  function toggle(index) {
    setOpen((current) => {
      const next = allowMultiple ? new Set(current) : new Set();
      if (current.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="accordion">
      {items.map((item, index) => {
        const expanded = open.has(index);
        const safeId = item.question
          .toLocaleLowerCase("az")
          .replace(/[^a-z0-9əğıöşüç]+/g, "-")
          .replace(/^-|-$/g, "");
        const buttonId = `accordion-button-${index}-${safeId}`;
        const panelId = `accordion-panel-${index}-${safeId}`;
        return (
          <div className={`accordion__item ${expanded ? "is-open" : ""}`} key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(index)}
              >
                <span>{item.question}</span>
                <span className="accordion__toggle"><Icon name="chevron" size={19} /></span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="accordion__panel"
              hidden={!expanded}
            >
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

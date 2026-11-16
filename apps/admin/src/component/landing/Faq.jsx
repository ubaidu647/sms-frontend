'use client';

import { useState } from 'react';

/** One question open at a time; the answer opens by animating a grid row 0fr → 1fr. */
export default function Faq({ items }) {
  const [open, setOpen] = useState(null);

  return (
    <div className="faq">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className={'qa rv' + (isOpen ? ' open' : '')} data-delay={i * 50}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${i}`}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              {item.q}
              <span className="ic" />
            </button>
            <div className="ans" id={`faq-answer-${i}`} role="region">
              <div>
                <p>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

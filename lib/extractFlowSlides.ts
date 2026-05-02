export type FlowSlide = {
  label: string;
  html: string;
};

function stepLabel(el: Element): string {
  const meta = el.querySelector(".step-meta");
  const t = meta?.textContent?.replace(/\s+/g, " ").trim();
  if (t) return t;
  return "Screen";
}

function genericLabel(el: HTMLElement, index: number): string {
  if (el.classList.contains("subsection-head")) {
    return el.textContent?.replace(/\s+/g, " ").trim().slice(0, 72) ?? `Part ${index + 1}`;
  }
  if (el.classList.contains("state-canvas")) return "State diagram";
  if (el.classList.contains("journey")) return "Journey map";
  if (el.classList.contains("blueprint")) return "Service blueprint";
  return `Screen ${index + 1}`;
}

/**
 * Derives ordered slides from a flow fragment.
 * Prefers `.step` mini-screens; otherwise groups section content (subsection + row pairs, etc.).
 */
export function extractFlowSlides(fragmentHtml: string): FlowSlide[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(fragmentHtml, "text/html");
  const section = doc.querySelector("section.flow-section");

  if (!section) {
    return [{ label: "Content", html: `<div class="play-error">No flow section found.</div>` }];
  }

  const steps = [...section.querySelectorAll(".step")];
  if (steps.length > 0) {
    return steps.map((el) => ({
      label: stepLabel(el),
      html: el.outerHTML,
    }));
  }

  const usable = [...section.children].filter(
    (ch): ch is HTMLElement => ch instanceof HTMLElement && !ch.matches("header.section-head"),
  );

  const slides: FlowSlide[] = [];
  for (let i = 0; i < usable.length; i++) {
    const el = usable[i];
    if (el.classList.contains("subsection-head")) {
      const next = usable[i + 1];
      if (next) {
        slides.push({
          label: el.textContent?.replace(/\s+/g, " ").trim().slice(0, 80) ?? `Part ${slides.length + 1}`,
          html: `<div class="play-slide-pair">${el.outerHTML}${next.outerHTML}</div>`,
        });
        i += 1;
        continue;
      }
    }
    slides.push({
      label: genericLabel(el, slides.length),
      html: `<div class="play-slide-fallback">${el.outerHTML}</div>`,
    });
  }

  if (slides.length === 0) {
    return [
      {
        label: "Flow",
        html: `<div class="play-slide-fallback">${section.innerHTML}</div>`,
      },
    ];
  }

  return slides;
}

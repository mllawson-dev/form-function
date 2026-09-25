import "./style.css";

const panel = document.querySelector<HTMLElement>("#instrument-panel");
const toggle = document.querySelector<HTMLButtonElement>("#instrument-toggle");
if (panel && toggle) {
  const compact = matchMedia("(max-width: 760px)");
  const set = (open: boolean) => {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector("span")!.textContent = open ? "Hide" : "Show";
  };
  set(!compact.matches);
  compact.addEventListener("change", () => set(!compact.matches));
  toggle.onclick = () => set(panel.hidden);
}

const start = () => import("./experience");
const webgl = (() => {
  try {
    const probe = document.createElement("canvas");
    return !!(probe.getContext("webgl2") || probe.getContext("webgl"));
  } catch {
    return false;
  }
})();

if (!webgl) {
  document.querySelector<HTMLElement>("#canvas")!.hidden = true;
  document.querySelector<HTMLElement>("#fallback")!.hidden = false;
  document
    .querySelectorAll<HTMLButtonElement | HTMLInputElement>(
      ".controls button,.controls input,[data-chapter],#film",
    )
    .forEach((b) => (b.disabled = true));
  document.querySelector("#scene-status")!.textContent = "Illustrated fallback";
  document.documentElement.classList.add("scene-ready");
} else if ("requestIdleCallback" in window) {
  requestIdleCallback(() => start(), { timeout: 800 });
} else {
  setTimeout(start, 120);
}

# FORM / FUNCTION

A self-initiated Signature concept by Michael L. Lawson. First working prototype: a procedural orbital sculpture with a three-chapter real-time sequence, surface views, exploded assembly, orbit controls, and optional synthesized ambient sound.

## Run

Requires Node 22.12+. Open this folder in VS Code, run `npm ci`, then `npm run dev`. Open http://127.0.0.1:4187/.

`npm run build` checks TypeScript and creates the production bundle. `npm run preview` serves that bundle locally.

## Design direction

Industrial editorial: graphite, warm ivory, restrained brass. Barlow Condensed headlines, DM Sans body, IBM Plex Mono labels. Asymmetric cinematic stage, chapter strip, a collapsible instrument panel (collapsed by default under 760 px), and editorial project notes. Fonts are self-hosted WOFF2 files in `public/fonts` with `font-display: swap`; no third-party requests.

## Scope

Geometry is generated in code; no external model assets or credentials. The sculpture is an artistic mechanism, not a validated physical machine. Ring markings and bearings reveal the construction. The introduction changes materials and assembly while moving the camera; it is not a rendered video.

The sculpture drifts slowly on load; the cinematic sequence and sound begin only through user input. Reduced-motion users navigate static chapters. A static SVG illustration appears if WebGL initialization fails or its context is lost. Sound requires browser audio support. Watch for device rendering differences during further review.

Real-device performance has not been measured yet. Append `?debug` to the URL for a live readout (fps, mean/worst frame time, triangle count, pixel ratio) and record those numbers before quoting them anywhere.

## Second design pass

Assembly uses eased targets; the sequence now separates and reassembles across chapter boundaries with a smooth camera arc. A generated studio environment adds metal reflections. Component controls highlight the three rings and core, with projected labels and explanatory text. No external model or texture downloads are required.

## Third pass: polish

- `src/main.ts` is a ~3 KB bootstrap: it wires the instrument-panel toggle, probes for WebGL, and lazy-loads `src/experience.ts` (Three.js) in an idle callback after first paint. An inline SVG poster fills the stage until the first frame renders; browsers without WebGL keep the illustrated fallback and never download the renderer.
- Rings and core are pickable: pointer clicks raycast against them and share `selectComponent()` with the accessible component buttons. Hovering shows a pointer cursor.
- Each chapter has a short narrative panel under the stage and, when sound is on, a soft triangle-wave cue.
- Materials use `MeshPhysicalMaterial` with per-ring roughness, brushed anisotropy, a clearcoat core, and a canvas-textured contact shadow under the pedestal.
- Blueprint mode adds a grid floor, dimension lines, cyan `EdgesGeometry` outlines, and projected radius annotations.
- URL parameters for captures and QA: `?view=finished|wireframe|blueprint`, `?explode=0-100`, `?part=0-3`, `?debug`.
- Open Graph / Twitter metadata point at `public/social/form-function.png` (1200x630). The card layout lives in `social-card.html` (not part of the build); regenerate by serving it with `npm run dev`, capturing at 1200x630, and compositing a sculpture render. Update the absolute URLs in both HTML heads if the deployment domain differs from `form-function.vercel.app`.
- Case-study captures in `public/studies` (`finished`, `wireframe`, `blueprint`, `exploded`, `mobile` `.webp`, and `sequence-loop.mp4/.webm`) were taken from the production build in Chrome.

## Deployment

`vercel.json` configures Vercel: framework `vite`, build `npm run build`, output `dist`, clean URLs (`/case-study`), immutable caching for hashed assets, and baseline security headers. Node version is pinned in `.nvmrc` and `package.json` `engines`. Import the GitHub repository into Vercel; no environment variables are required.

## Case study and branding

`/case-study.html` presents the brief, visual approach, interaction journey, technical implementation, access controls, and verified outcome. The production build includes both pages. `public/brand` contains the supplied SVG logo and icon copied byte-for-byte; desktop uses the full logo and mobile uses the icon. The icon also serves as the favicon. `public/studies/orbital-study.svg` is an explanatory construction schematic, not a render or original process sketch.

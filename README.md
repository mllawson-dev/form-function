# FORM / FUNCTION

A self-initiated Signature concept by Michael L. Lawson. First working prototype: a procedural orbital sculpture with a three-chapter real-time sequence, surface views, exploded assembly, orbit controls, and optional synthesized ambient sound.

## Run

Requires Node 22.12+. Open this folder in VS Code, run `npm ci`, then `npm run dev`. Open http://127.0.0.1:4187/.

`npm run build` checks TypeScript and creates the production bundle. `npm run preview` serves that bundle locally.

## Design direction

Industrial editorial: graphite, warm ivory, restrained brass. Barlow Condensed headlines, DM Sans body, IBM Plex Mono labels. Asymmetric cinematic stage, chapter strip, instrument controls, and editorial project notes. Fonts load from Google Fonts with local fallback stacks.

## Scope

Geometry is generated in code; no external model assets or credentials. The sculpture is an artistic mechanism, not a validated physical machine. Ring markings and bearings reveal the construction. The introduction changes materials and assembly while moving the camera; it is not a rendered video.

Motion and sound begin only through user input. Reduced-motion users navigate static chapters. A static SVG illustration appears if WebGL initialization fails or its context is lost. Sound requires browser audio support. Watch for device rendering differences during further review.

Next refinement: review silhouette and lighting, refine chapter transitions, and document measured device performance across physical devices.

## Second design pass

Assembly uses eased targets; the sequence now separates and reassembles across chapter boundaries with a smooth camera arc. A generated studio environment adds metal reflections. Component controls highlight the three rings and core, with projected labels and explanatory text. No external model or texture downloads are required.

## Deployment

`vercel.json` configures Vercel: framework `vite`, build `npm run build`, output `dist`, clean URLs (`/case-study`), immutable caching for hashed assets, and baseline security headers. Node version is pinned in `.nvmrc` and `package.json` `engines`. Import the GitHub repository into Vercel; no environment variables are required.

## Case study and branding

`/case-study.html` presents the brief, visual approach, interaction journey, technical implementation, access controls, and verified outcome. The production build includes both pages. `public/brand` contains the supplied SVG logo and icon copied byte-for-byte; desktop uses the full logo and mobile uses the icon. The icon also serves as the favicon. `public/studies/orbital-study.svg` is an explanatory construction schematic, not a render or original process sketch.

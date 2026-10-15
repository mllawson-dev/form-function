# FORM / FUNCTION

An interactive kinetic sculpture built in Three.js and TypeScript. An 18-second introduction shows how the piece is constructed, then hands control to the visitor to explore surfaces, assembly, motion and individual components.

**[Explore it](https://www.mll-creativeeng.com/studies/form-function/)** · **[Case study](https://www.mll-creativeeng.com/studies/form-function/case-study.html)**

## What I built

- **Procedural geometry.** Three nested torus rings, bearings, an axle and an icosahedral core, all generated in code with no external model files. Each ring's 48 edge markings use one instanced mesh.
- **A three-chapter sequence** (Imagine, Construct, Activate) with eased assembly and a camera arc. It starts only on request and can be paused or exited.
- **Hands-on controls.** Finished, wireframe and blueprint views; an assembly slider; speed; orbit controls; and component picking by click or by accessible buttons.
- **Optional sound.** A synthesized Web Audio ambient layer that never carries required information.

## Performance and resilience

- `src/main.ts` is a small bootstrap. It checks for WebGL and lazy-loads the Three.js scene (`src/experience.ts`) after first paint.
- Without WebGL, or if the context is lost, a static SVG illustration stays in place.
- Pixel ratio is capped and playback pauses when the tab is hidden.
- Reduced-motion users get static chapters instead of the cinematic sequence.
- Append `?debug` for a live readout of frame time, triangle count and pixel ratio.

## Run locally

Requires Node 22.12+.

```sh
npm ci
npm run dev      # http://127.0.0.1:4187/
npm run build    # TypeScript check + production build
```

## Scope

A self-initiated study. The sculpture is an artistic mechanism, not a physical machine. Real-device performance has not been formally measured yet.

---

Designed and built by **Michael L. Lawson**, design engineer and creative developer · [mll-creativeeng.com](https://www.mll-creativeeng.com) · [LinkedIn](https://www.linkedin.com/in/michael-lawson-a7707924)

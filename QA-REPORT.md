# FORM / FUNCTION — polish verification

## Verified locally

- TypeScript validation and production build pass.
- Real-time sculpture renders without a fallback on the in-app browser.
- No horizontal page overflow at 375, 768, or 1440 pixels.
- Desktop and mobile compositions inspected; captions now have reserved space below the 3D viewport.
- Playback starts, pauses, resumes through its control, and can be exited. Reset restores assembly, speed, surface, camera, and component selection.
- Construct chapter selects wireframe, 80% assembly, and its explanatory caption.
- Keyboard arrow input changes the native assembly slider; camera rotation has native button controls and canvas arrow-key handlers.
- No captured browser console errors during the checked interactions.
- Repeated ring markings now use three instanced meshes instead of 144 separate meshes, reducing draw submissions for those markings.

## Release review (production preview, Chromium)

- Sequence timing now follows wall-clock time: an uninterrupted run measured 17.995 s from click to completion, even under software-rendered WebGL where the previous frame-delta clamp stretched it to ~26 s.
- Camera target and sequence arc were adjusted so the pedestal remains fully in frame on load, during Activate, after completion, and after Reset at 1440 px.
- Focused canvas accepts Up/Down (zoom) in addition to Left/Right (rotate) and +/−; the accessible label describes this.
- `THREE.Clock` replaced with `THREE.Timer`; no console warnings or errors observed.
- Both pages verified at 375, 768, and 1440 px; reduced-motion emulation verified; cross-links and skip links verified.

## Limits

These are local browser checks, not physical-device or cross-browser certification. Reduced-motion behavior and WebGL fallback have been reviewed in code; this pass did not simulate GPU failure or change the operating system motion preference. No device frame-rate benchmark or public deployment is claimed. Vite reports a large JavaScript chunk because Three.js is included; compressed size is approximately 139 KB. Fonts load from Google Fonts with fallback stacks.

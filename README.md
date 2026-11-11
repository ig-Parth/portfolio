# NEXUS 01 — Parth Vijay Gidde Portfolio

An 8K interactive graphic-novel engineering portfolio built with a custom HTML5 Canvas2D Layered 3D Paper-Cutout (Kirigami) renderer, biomechanical gait synthesis, procedural WebAudio acoustics, and an accessible ATS-printable resume archive.

- **Live Deployment (Vercel)**: https://portfolio-flax-three-1uk6t48jdt.vercel.app/
- **JSON Resume v1.0**: [https://portfolio-flax-three-1uk6t48jdt.vercel.app/resume.json](https://portfolio-flax-three-1uk6t48jdt.vercel.app/resume.json)
- **LLM & Agent Context**: [https://portfolio-flax-three-1uk6t48jdt.vercel.app/llms.txt](https://portfolio-flax-three-1uk6t48jdt.vercel.app/llms.txt) · [https://portfolio-flax-three-1uk6t48jdt.vercel.app/.well-known/ard.json](https://portfolio-flax-three-1uk6t48jdt.vercel.app/.well-known/ard.json)
- **Readable Markdown Resume**: [./RESUME.md](./RESUME.md)

---

## Engineering Architecture

1. **8K Layered 3D Paper-Cutout (Kirigami) Renderer** (`src/nexus-engine.js`)
   - Client-side edge-directed sharpening and alpha defringing (`defringeAndSharpen`).
   - Cotton-rag paper texture tiling and matte cardstock tonal quantization (`quantizePaperSurface`, `makePaperCutSprite`) with warm ivory die-cut rims (`#F5F0E4`), scissor outlines, and directional diorama cast shadows.
2. **Scroll-Driven Kinematics & Multi-Angle Camera Rig**
   - 36-frame gait synthesis (`getWalkFrame`, `getWalkPaperFrame`), multi-plane perspective sanctuary columns, and smooth inertial scroll tracking.
3. **Procedural WebAudio + SpeechSynthesis Director**
   - Real-time synthesized footsteps, truck approach/horn/impact FX, cathedral chords, mercury pour swells, and turn-locked Japanese dialogue subtitles.
4. **Full SSR Semantic Parity, Print Resume PDF & Agent Discovery**
   - All 5 verified engineering case files (`Garaa`, `DevHarbour`, `Zyr Resume Studio`, `Laser Distance System`, `IoT Weather Detection`) and 8 skill nodes render directly in static semantic HTML before JavaScript executes.
   - Dedicated `@media print` stylesheet exports a clean, white-background ATS engineering resume in one click.
   - Compatible with custom reverse-proxy routing including ONEWHO subpath entry links (`/p/unstop`, `/a/*`) via `vercel.json`.
5. **Verified Quality & Performance**
   - Lighthouse Desktop & Mobile: **100** Accessibility · **100** Best Practices · **100** SEO · **100** Agentic Browsing.
   - Responsive across desktop and mobile viewports (`360px–1024px+`) with `0px` horizontal overflow.

---

## Repository Layout

```
├── index.html             # Self-contained 8K portfolio production bundle
├── RESUME.md              # ATS-structured Markdown resume
├── resume.json            # JSON Resume v1.0 machine-readable profile
├── llms.txt / llms-full.txt # Concise & full markdown briefs for AI agents
├── .well-known/ard.json   # Agent resource discovery manifest
├── sitemap.xml / robots.txt
├── og-preview.png         # Social Open Graph preview card (1200x630)
├── favicon.svg
├── vercel.json            # Routing, subpath rewrites & security headers
├── src/
│   ├── nexus.css          # Responsive layout, paper-cut panels & @media print
│   └── nexus-engine.js    # Kirigami renderer, WebAudio & choreography engine
└── tests/
    └── verify_site.mjs    # Automated browser verification (gates, SSR, mobile overflow)
```

---

## Local Preview & Verification

```bash
# Serve locally (Python or Node static server)
npx serve .

# Run automated browser verification test
node tests/verify_site.mjs
```

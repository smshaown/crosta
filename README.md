# Crosta — Pies Baked at Six, Gone by Noon

An interactive artisan pie bakery showcase built with **Semantic HTML5**, **Modern CSS3**, and **GSAP 3.12+ (ScrollTrigger)**.

**Live Demo:** [https://smshaown.github.io/crosta/](https://smshaown.github.io/crosta/)

## Features
- **Scroll-Driven & Dial Flavour Switching**: Explore four seasonal flavours (**Strawberry**, **Blueberry**, **Lemon**, **Chocolate**) via ScrollTrigger, clickable curved radial dial tabs, or keyboard arrows.
- **Conic Pie Sweep & Radial Flood**: Smooth `360°` pie spin with scale pulse (`--pulse`), conic-gradient mask reveal (`--sweep`), and expanding radial colour flood (`--flood`).
- **Scattered Depth-Blurred Toppings**: Floating fruit, chocolate, and hazelnut garnishes with GSAP spiral entrances, ambient bobbing, and mouse parallax.
- **Whole Pie / One Slice Wedge Cutout**: Interactive segmented size toggle that pulls out an eighth-slice wedge (`.cr-wedge`) with dynamic shadow masking and pricing (`€38–€46` whole / `€6–€7.50` slice).
- **Your Box Cart Drawer**: Slide-over box drawer with live item count, item removal, and total calculation.
- **Accessible & Reduced-Motion Ready**: Full ARIA landmarks, `radiogroup` / `tablist` semantics, and `prefers-reduced-motion` support.

## Project Structure
```text
crosta/
├── index.html
├── styles/
│   └── crosta.css
├── js/
│   ├── pies-data.js
│   └── app.js
└── assets/
    └── img/
        ├── pie-strawberry.webp
        ├── pie-blueberry.webp
        ├── pie-lemon.webp
        ├── pie-chocolate.webp
        └── top-*.webp
```

## Run Locally
Serve the folder with any static HTTP server:
```bash
python -m http.server 8767
```
Then open `http://localhost:8767`.

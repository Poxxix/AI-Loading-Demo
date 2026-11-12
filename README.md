# Prism — ASCII Reveal handoff demo

## Run it

```bash
npm install
npm run dev
```

Select **Generate again**. The image cell swaps to an `AsciiSkeleton`, then the new result reveals through `AsciiReveal` using `preset="dither"` and `duration="cinematic"`.

## Product decisions represented

- Trigger: user selects **Generate**.
- Purpose: create a distinctive AI-generation moment, rather than expose real progress.
- Scope: the image cell only. Prompt and the button remain visible and usable; a new click while loading queues the next generation so the current reveal finishes first.
- Result: one image at a time, keeping its selected aspect ratio.
- Motion: cinematic; respects the library's reduced-motion behavior.

## Integration point

The important implementation is in `src/main.tsx`. Replace the simulated `setTimeout` + `preloadImage` with your generate mutation / subscription. On request start, set `isGenerating` true; once the result URL arrives and is decoded, set the image child, set `isGenerating` false, and set `isRevealing` true in the same state update cycle.

## State audit applied

- The skeleton is intentionally a direct child of `AsciiReveal`. The library excludes `[data-ascii-skeleton]` from the scramble layer, so its dither shimmer remains clean while the job waits.
- The skeleton is explicitly sized to `100%` width and height (`rows={72}` at `12px` with `--ars-radius: 23px`) so the 96-column glyph grid covers the full 4:5 frame at all breakpoints. Avoid numeric `width={100}` / `height={125}` or undersized row counts here: numeric values mean pixels and leave an incomplete placeholder inside the image cell.
- A second Generate click during either `isGenerating` or `isRevealing` is never ignored or allowed to interrupt the active reveal. It stays queued (`Next queued`) and starts from the library's `onRevealComplete` callback—never a hard-coded animation timeout.
- Result images are preloaded and decoded before switching `loading` to `false`, avoiding an uncached frame gap or fallback texture on first reveal.
- In production, keep the result frame's aspect ratio fixed throughout `generating`; otherwise a size change during reveal causes the library to land the effect early to avoid misaligned canvas drawing.
- The library samples result imagery on canvas. Make sure remote image URLs permit CORS if the intended output is a sampled image texture; otherwise the component safely uses a neutral glyph texture.

This handoff demo installs the library directly from the supplied public GitHub repository, so it can be copied as a self-contained folder. For the application, install from npm or directly from GitHub:

```bash
npm i ascii-reveal
# or
npm i github:quanhoangindex/ascii-reveal
```

## Token proposal

The page uses a restrained Preline-compatible palette: Slate 50 (`#f8fafc`) canvas, Slate 900 (`#0f172a`) primary ink, and Blue 600 (`#2563eb`) only for live/interactive moments. The reveal receives the same values via `--ascii-*` variables.

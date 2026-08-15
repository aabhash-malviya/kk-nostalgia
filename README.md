# Yaadon Ka Safar

A single-page nostalgia music site: dusk over a Bombay music-shop street,
a glass-pill player at the bottom, songs streamed live through the YouTube
IFrame Player API.

## Run it

```bash
npm install
npm run dev
```

## Before it plays anything

`components/tracks.ts` ships with real song titles but **blank `videoId`
fields** — on purpose. Titles and artist credits are just metadata, but a
`videoId` is what actually streams a recording, so that choice is left to
you rather than made for you. Fill one in only if you have the right to use
it — your own upload, or the rights holder's own official YouTube upload
with embedding left on:

```ts
track("hit-01", "Yaaron", "", null),   // → give it a videoId in tracks.ts
```

Until at least one track has a `videoId`, the player renders in a disabled
state with a small on-page note. Adding a song is a one-line change: copy a
`track(...)` line and add it to a playlist's array.

## A deliberate compromise worth knowing about

The brief's vinyl is 80px (desktop) / 64px (mobile) — smaller than YouTube's
embedded-player size guidance calls for. Rather than either breaking that
guidance outright or breaking the vinyl look, the actual `YT.Player` iframe
is instantiated at 220×220px and then visually scaled down with CSS to fill
the small circle (see `YT_EMBED_BASE` in `components/Player.tsx`). It's
still one single, always-visible, unhidden player — never duplicated,
never opacity-0 — just presented smaller than its underlying size. If that
tradeoff doesn't sit right with you, the cleanest fix is to size the vinyl
itself up to something nearer 200×200px.

## Two layouts, one live player

The desktop pill and mobile card are genuinely separate blocks (`hidden
sm:flex` / `flex sm:hidden`), as specified — but they can't each hold their
own YouTube iframe without either doubling the audio or risking a hidden
background player. So there's exactly one iframe, mounted once, and a small
effect in `Player.tsx` repositions it on top of whichever layout's vinyl
slot is currently visible (`ResizeObserver` + a resize/orientation
listener). Nothing about this is a hidden or backgrounded player — it's the
same visible, playing video, just relocated to match the responsive layout.

## Assets

`public/bg/scene-wide.png` and `public/bg/scene-tall.png` are the two
illustrations supplied for this build. Nothing else — no video thumbnails —
is cached onto the domain; cover art is the live video itself, shown in the
vinyl circle.

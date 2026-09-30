# The Anchovies Index

An internal prototype. A three-drawer card-catalog cabinet, built in CSS 3D.
Each visit lays the drawers out afresh.

- **Selected work**: project postcards, a sketch pad (peel the corner to tear a
  sheet off), a pencil and two markers (click one to pick it up, click anywhere to
  set it down), clips, a coin, keys. Click a postcard and it becomes its case study.
- **The studio**: the three team Polaroids front and centre (click to turn over), with
  office Polaroids scattered around them. Add office photos in `src/content/team.js`
  (`officePhotos`) with the files in `public/assets/team/office/`.
- **Odds & ends**: a junk drawer: a tin of anchovies, a fork, dice (click to roll),
  a bouncy ball (throw it), a spinning top, a fortune cookie (its fortunes are the
  About page lines), googly eyes, a safety pin, a birthday candle, a domino, and so on.
- Keys swing and twist on their ring when you carry them.
- **Coffee count** (top right): the office cup; click to log one, resets each Monday.
  Saved in this browser only. A shared count needs a small shared store.

- **The fridge** (`Fridge →` in the header): client logos as magnets. Slide them around;
  click one to open its case study. Add logos in `src/content/magnets.js`.

`?index=rotary` brings back the earlier rotary card file.

## Case-study objects (from the studio's files)

| Project | Object | Component |
| --- | --- | --- |
| Lex Politica | Letterhead to tilt, lift and loupe · wax seal with the griffin | `Sheet.jsx` · `WaxSeal.jsx` |
| Tagawa | A rose bed to plant, with the gardener | `RoseBed.jsx` |
| Soft Hours | Hang tag that swings and turns · watch face keeping real time | `FlipObject.jsx` · `SoftHoursDial.jsx` |
| Molly Engels | Stamps to stick on the envelope, then post | `StampEnvelope.jsx` |
| Arc88 | Drill the plate, then look through it | `PlateWindow.jsx` |
| Runway | Business card to turn · boarding pass stub to tear off | `FlipObject.jsx` · `BoardingPass.jsx` |
| Garza | Painting to zoom into, Charro border, lantern | `PaintingViewer.jsx` |

```
npm install
npm run dev          # http://localhost:5173
npm run build        # static build in dist/ (serve with `npm run preview` or any static host)
```

In dev, `window.__drawer(0.5, 'studio')` freezes a drawer opening at any point.
Add `?slowmo=8` to the URL to watch the transitions at ⅛ speed. In dev,
`window.__ring(1.5)` freezes the rotary file at any position.

## Where things live

| What | File |
| --- | --- |
| **All project content** (names, copy, metadata, images, alt text, captions, source URLs) | `src/content/projects.js` |
| Local copies of the images | `public/assets/<project>/` |
| **The cabinet** (drawers, camera, card physics) | `src/components/DrawerIndex.jsx` |
| Postcards · Polaroids · pad & pens · props & junk · coffee | `Postcard.jsx` · `Polaroid.jsx` · `Desk.jsx` · `Props.jsx` · `CoffeeCount.jsx` |
| Team content (Polaroids, backs) | `src/content/team.js` |
| Case-study objects: business card / hang tag · painting · Arc88 plate | `FlipObject.jsx` · `PaintingViewer.jsx` · `PlateWindow.jsx` |
| Rotary index (previous version, `?index=rotary`) | `src/components/Index.jsx`, `IndexCard.jsx` |
| Generated textures (paper grain, linen) | `public/assets/ui/` |
| Selection, history, focus, Escape | `src/App.jsx` |
| Opening and closing transition | `src/motion/sharedElement.js` (+ `tween.js`) |
| Case-study view (full and preview) | `src/components/CaseStudy.jsx` |
| Image stack (every project's Applications) | `src/components/ImageStack.jsx` |
| Letterhead you can handle (tilt, lift, loupe) | `src/components/Sheet.jsx` |
| Lightbox | `src/components/Lightbox.jsx` |
| Tokens, type and layout | `src/styles.css` (top of file) |

## Sourcing

Text marked `// sourced` in `projects.js` was copied verbatim from
anchovies.agency on 2026-09-30. The live site has no alt text or captions, so
fields marked `// observed` were written from looking at each image. Please
review those. Each image records its original framerusercontent.com URL in
`origin`.

## Assets to supply or replace

1. **Haas Grotesk web font.** The site uses *Haas Grot Text Web 75 Bold / 65 Medium*
   (licensed). The prototype falls back to Helvetica Neue. Add the licensed files
   with an `@font-face` named `Haas Grot Text Web 75 Bold` and the stack in
   `styles.css` will pick them up.
2. **A dark-background version of the fish mark,** if you want one. Only the
   black-on-white JPEG was retrievable. It's composited with `mix-blend-mode: multiply`
   and not recolored.
3. **Higher-resolution or uncropped originals,** if you'd like sharper large views.
   The local copies are capped at 2048px. `JgJF…jpg` (stippled columns) is only
   724 × 666 at source, so it's shown small on purpose.
4. **Captions and alt text:** confirm or correct the `// observed` strings.
5. **Tagawa, Soft Hours, Arc88, Runway, Garza:** sourced previews with their own
   Applications stack, linking to the live case studies. Set `kind: 'full'` and add
   the Lex-style fields to promote one.
6. `letterhead-sheet.jpg` is a crop of the letterhead photo (`QYAXON…jpg`) to the
   sheet's edges, with no other change. A flat PDF/PNG export of the letterhead would be sharper.

A missing or failed image shows a hatched placeholder at the correct proportions,
labelled with the expected filename. There's never a broken-image icon.

## Replacing the drawn objects with photos

Every object in the drawers is drawn in code (`src/components/Props.jsx`). To use a
real photo instead:

1. Photograph the object **straight down**, flat on a plain, light background, in soft
   even light (a window on an overcast day is ideal). Fill the frame; about 2000px across.
2. Cut it out to a **transparent PNG**, with no shadow (the drawer adds its own).
3. Save it as `public/assets/props/<name>.png` and add `<name>` to `PHOTOS` in `Props.jsx`.

Names: `penny`, `housekeys`, `clip`, `clip2`, `brush`, `paint`, `stylus`, `lighter`,
`pencil`, `motokeys`, `page`, `sort`, `tin`, `fork`, `ball`, `top`, `cookie`, `band`,
`band2`, `battery`, `cap`, `cap2`, `marble`, `eraser`, `binder`, `notes`, `eye`, `pin`,
`candle`, `domino`. (Dice are drawn so they can show any face; keys are drawn so they
can swing. A photo of either replaces the drawing but won't roll or swing.)

## Rooms (added 2026-09-30)

The index is four rooms side by side. On arrival, an entrance asks which to visit first; `?room=cabinet|fridge|vending|typewriter` skips it.

| Room | File | What it is |
|---|---|---|
| Cabinet | `DrawerIndex.jsx` | Drawers: Selected work (11 postcards), The studio (team + office photos/clips, click a photo to enlarge), Specimens (colour chips + mark specimens) |
| Fridge | `Fridge.jsx`, `content/fridgeContents.js`, `styles/fridge-inside.css` | 84 magnets, newest at top (order from /work); freezer and fridge doors open onto brand-themed products |
| Vending machine | `VendingMachine.jsx`, `content/services.js`, `styles/vending.css` | The 18 services from /about; no per-service copy exists on the site, so cards show the name and matching /work projects |
| Typewriter | `Typewriter.jsx`, `styles/typewriter.css` | Contact: opens a mailto to andy@anchovies.agency with the typed note; "Book a call" links to cal.com |

Room names and one-liners live in `content/rooms.js` (design copy, not sourced).

**Sound**: `motion/sound.js` synthesises every effect in Web Audio (no audio files). Call `sfx('name')`. There's a speaker toggle in the header, remembered per visitor.

**Office photos**: `content/team.js` → `officePhotos` (converted from "Anchovies Photo & Video"; set `SLOTS` > 0 for placeholders).

**Colours**: chip values are sampled from brand imagery on anchovies.agency (`magnets.js`), not official brand specs. Replace with real palettes when available.

### Sound credits

The typewriter uses real recordings, cut into `public/assets/sound/typewriter.m4a` (offsets in `typewriter.json`):

- Keys, space bar, carriage return, paper: **"WWS Typewriter"**, an Erika 5 typewriter (Seidel & Naumann, 1940), recorded by Konrad Gutkowski for Work With Sounds. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:WWS_Typewriter.ogg). Trimmed and normalised.
- Bell: **"typewriter ding near mono"** by _stubb, [CC0](https://creativecommons.org/publicdomain/zero/1.0/), via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:406243_stubb_typewriter-ding-near-mono.wav).

CC BY 4.0 needs a visible credit on the live site (e.g. in a colophon or footer) before launch.

All other sounds are synthesised in `src/motion/sound.js`.

// The studio's services, as the vending machine sells them.
//
// sourced: names and order are the 'Services' list on https://anchovies.agency/about
// (checked 2026-09-30). The About page lists names only: there is no per-service
// description anywhere on it. The descriptions further down are DRAFTS written for
// this prototype (see DESCRIPTIONS_ARE_DRAFT), not site copy.
//
// sourced: `workTag` / `projects` come from the deliverable tags on each project in the
// https://anchovies.agency/work index. Those tags are only Illustration, Signage, Motion,
// Social Media, Print, Packaging, Website, Naming and Brand Identity, so a service gets a
// project list only where a tag plainly names the same deliverable:
//   Illustration, Naming, Packaging, Brand Identity  -> the tag of the same name
//   Signage & Wayfinding                              -> 'Signage'
//   Website UI & UX, Website Development              -> 'Website' (the tag doesn't say
//                                                        which, so both carry it, and the
//                                                        card names the tag it came from)
// Not mapped on purpose: Print (broader than Publication Design), Motion and Social Media
// (no matching service; 'Digital' and 'Campaign' would be a guess).
// Project display names are the case-page titles on anchovies.agency/work/<slug>.

import { projects } from './projects.js'

export const ROWS = ['A', 'B', 'C', 'D', 'E', 'F']
export const COLS = [1, 2, 3]

// sourced: /work index tags -> projects carrying that tag, in /work order
const WORK_TAGS = {
  'Brand Identity': [
    { slug: 'lex-politica', name: 'Lex Politica' },
    { slug: 'tagawa', name: 'Tagawa' },
    { slug: 'soft-hours', name: 'Soft Hours' },
    { slug: 'molly-engles', name: 'Molly Engles' },
    { slug: 'arc88', name: 'Arc 88' },
    { slug: 'runway', name: 'Runway' },
    { slug: 'garza', name: 'Garza' },
    { slug: 'heartwood', name: 'Heartwood' },
    { slug: 'notably', name: 'Notably' },
    { slug: 'freddie', name: 'Freddie' },
    { slug: 'koplow', name: 'Koplow' },
    { slug: 'offmenu', name: 'Off Menu' },
    { slug: 'perlavi', name: 'PerlaVi' },
    { slug: 'avodah', name: 'Avodah' },
    { slug: '206', name: '206' },
    { slug: 'seed', name: 'Seed' },
    { slug: 'duo', name: 'Duo' },
    { slug: 'adlib', name: 'Adlib' },
    { slug: 'rhythm', name: 'Rhythm' },
    { slug: 'out-there', name: 'Out There' },
    { slug: 'wild-hare', name: 'Wild Hare' },
    { slug: 'moat', name: 'Moat' },
    { slug: 'nymph', name: 'Nymph' },
    { slug: 'within', name: 'Within' },
    { slug: 's-w', name: 'S&W' },
    { slug: 'soft', name: 'Soft' },
    { slug: 'lookout-tower', name: 'Lookout Tower' },
    { slug: 'belzer-law', name: 'Belzer Law' },
    { slug: 'donna-beth', name: 'Donna Beth' },
    { slug: 'pickleballers-next-door', name: 'Pickleballers Next Door' },
    { slug: 'sage', name: 'Sage' },
    { slug: 'trek', name: 'Trek' },
    { slug: 'hometown', name: 'Hometown' },
    { slug: 'maven', name: 'Maven' },
    { slug: 'odd-feather', name: 'Odd Feather' },
    { slug: 'nylo', name: 'Nylo' },
    { slug: 'marlowe-bennet', name: 'Marlowe Bennet' },
    { slug: 'museum', name: 'Museum' },
    { slug: 'vantage', name: 'Vantage' },
    { slug: 'the-passenger', name: 'The Passenger' },
    { slug: 'italic', name: 'Italic' },
    { slug: 'the-work', name: 'The Work' },
    { slug: 'green-nomad', name: 'Green Nomad' },
    { slug: 'layers', name: 'Layers' },
    { slug: 'good-measure', name: 'Good Measure' },
  ],
  'Illustration': [
    { slug: 'tagawa', name: 'Tagawa' },
    { slug: 'soft-hours', name: 'Soft Hours' },
    { slug: 'molly-engles', name: 'Molly Engles' },
    { slug: 'heartwood', name: 'Heartwood' },
    { slug: 'freddie', name: 'Freddie' },
    { slug: 'offmenu', name: 'Off Menu' },
    { slug: '206', name: '206' },
    { slug: 'adlib', name: 'Adlib' },
    { slug: 'wild-hare', name: 'Wild Hare' },
    { slug: 'lookout-tower', name: 'Lookout Tower' },
    { slug: 'pickleballers-next-door', name: 'Pickleballers Next Door' },
    { slug: 'sage', name: 'Sage' },
    { slug: 'hometown', name: 'Hometown' },
    { slug: 'odd-feather', name: 'Odd Feather' },
    { slug: 'nylo', name: 'Nylo' },
    { slug: 'marlowe-bennet', name: 'Marlowe Bennet' },
    { slug: 'the-passenger', name: 'The Passenger' },
    { slug: 'green-nomad', name: 'Green Nomad' },
  ],
  'Naming': [
    { slug: 'soft-hours', name: 'Soft Hours' },
    { slug: 'heartwood', name: 'Heartwood' },
    { slug: 'notably', name: 'Notably' },
    { slug: 'offmenu', name: 'Off Menu' },
    { slug: 'seed', name: 'Seed' },
    { slug: 'out-there', name: 'Out There' },
    { slug: 'nymph', name: 'Nymph' },
    { slug: 'within', name: 'Within' },
    { slug: 'soft', name: 'Soft' },
    { slug: 'lookout-tower', name: 'Lookout Tower' },
    { slug: 'pickleballers-next-door', name: 'Pickleballers Next Door' },
    { slug: 'trek', name: 'Trek' },
    { slug: 'odd-feather', name: 'Odd Feather' },
    { slug: 'nylo', name: 'Nylo' },
    { slug: 'marlowe-bennet', name: 'Marlowe Bennet' },
    { slug: 'museum', name: 'Museum' },
    { slug: 'the-passenger', name: 'The Passenger' },
    { slug: 'italic', name: 'Italic' },
    { slug: 'the-work', name: 'The Work' },
    { slug: 'green-nomad', name: 'Green Nomad' },
    { slug: 'layers', name: 'Layers' },
    { slug: 'good-measure', name: 'Good Measure' },
  ],
  'Packaging': [
    { slug: 'soft-hours', name: 'Soft Hours' },
    { slug: 'koplow', name: 'Koplow' },
    { slug: 'offmenu', name: 'Off Menu' },
    { slug: 'duo', name: 'Duo' },
    { slug: 'adlib', name: 'Adlib' },
    { slug: 'wild-hare', name: 'Wild Hare' },
    { slug: 'moat', name: 'Moat' },
    { slug: 'soft', name: 'Soft' },
    { slug: 'lookout-tower', name: 'Lookout Tower' },
    { slug: 'donna-beth', name: 'Donna Beth' },
    { slug: 'sage', name: 'Sage' },
    { slug: 'odd-feather', name: 'Odd Feather' },
    { slug: 'vantage', name: 'Vantage' },
    { slug: 'the-passenger', name: 'The Passenger' },
    { slug: 'italic', name: 'Italic' },
    { slug: 'the-work', name: 'The Work' },
    { slug: 'green-nomad', name: 'Green Nomad' },
  ],
  'Signage': [
    { slug: 'lex-politica', name: 'Lex Politica' },
    { slug: 'tagawa', name: 'Tagawa' },
    { slug: 'runway', name: 'Runway' },
    { slug: 'garza', name: 'Garza' },
    { slug: 'koplow', name: 'Koplow' },
    { slug: 'offmenu', name: 'Off Menu' },
    { slug: '206', name: '206' },
    { slug: 'seed', name: 'Seed' },
    { slug: 'duo', name: 'Duo' },
    { slug: 'adlib', name: 'Adlib' },
    { slug: 'rhythm', name: 'Rhythm' },
    { slug: 'wild-hare', name: 'Wild Hare' },
    { slug: 'within', name: 'Within' },
    { slug: 's-w', name: 'S&W' },
    { slug: 'soft', name: 'Soft' },
    { slug: 'lookout-tower', name: 'Lookout Tower' },
    { slug: 'belzer-law', name: 'Belzer Law' },
    { slug: 'donna-beth', name: 'Donna Beth' },
    { slug: 'pickleballers-next-door', name: 'Pickleballers Next Door' },
    { slug: 'trek', name: 'Trek' },
    { slug: 'hometown', name: 'Hometown' },
    { slug: 'vantage', name: 'Vantage' },
    { slug: 'the-passenger', name: 'The Passenger' },
    { slug: 'italic', name: 'Italic' },
    { slug: 'the-work', name: 'The Work' },
    { slug: 'green-nomad', name: 'Green Nomad' },
  ],
  'Website': [
    { slug: 'lex-politica', name: 'Lex Politica' },
    { slug: 'soft-hours', name: 'Soft Hours' },
    { slug: 'molly-engles', name: 'Molly Engles' },
    { slug: 'arc88', name: 'Arc 88' },
    { slug: 'garza', name: 'Garza' },
    { slug: 'heartwood', name: 'Heartwood' },
    { slug: 'notably', name: 'Notably' },
    { slug: 'offmenu', name: 'Off Menu' },
    { slug: 'perlavi', name: 'PerlaVi' },
    { slug: 'avodah', name: 'Avodah' },
    { slug: '206', name: '206' },
    { slug: 'wild-hare', name: 'Wild Hare' },
    { slug: 'moat', name: 'Moat' },
    { slug: 'nymph', name: 'Nymph' },
    { slug: 's-w', name: 'S&W' },
    { slug: 'soft', name: 'Soft' },
    { slug: 'lookout-tower', name: 'Lookout Tower' },
    { slug: 'belzer-law', name: 'Belzer Law' },
    { slug: 'donna-beth', name: 'Donna Beth' },
    { slug: 'pickleballers-next-door', name: 'Pickleballers Next Door' },
    { slug: 'sage', name: 'Sage' },
    { slug: 'trek', name: 'Trek' },
    { slug: 'maven', name: 'Maven' },
    { slug: 'nylo', name: 'Nylo' },
    { slug: 'marlowe-bennet', name: 'Marlowe Bennet' },
    { slug: 'vantage', name: 'Vantage' },
    { slug: 'the-passenger', name: 'The Passenger' },
    { slug: 'italic', name: 'Italic' },
    { slug: 'the-work', name: 'The Work' },
    { slug: 'layers', name: 'Layers' },
    { slug: 'good-measure', name: 'Good Measure' },
  ],
}

// sourced: anchovies.agency/about, Services (names only)
const SERVICE_NAMES = [
  'App Development',
  'Art Direction',
  'Brand Identity',
  'Brand System',
  'Campaign',
  'Copywriting',
  'Creative Direction',
  'Digital',
  'Graphic Design',
  'Illustration',
  'Naming',
  'Packaging',
  'Production',
  'Publication Design',
  'Signage & Wayfinding',
  'Strategy',
  'Website UI & UX',
  'Website Development',
]

// sourced (see header): which /work tag, if any, honestly names the same deliverable
const TAG_FOR = {
  'Illustration': 'Illustration',
  'Naming': 'Naming',
  'Packaging': 'Packaging',
  'Brand Identity': 'Brand Identity',
  'Signage & Wayfinding': 'Signage',
  'Website UI & UX': 'Website',
  'Website Development': 'Website',
}

// ── Descriptions ────────────────────────────────────────────────────────────
// The live site has NO per-service copy. Everything below is draft copy written
// for this prototype. The card labels it as a draft; nothing here should read as
// if it came from anchovies.agency.
export const DESCRIPTIONS_ARE_DRAFT = true

const DESCRIPTIONS = {
  // draft: written for the prototype, needs Anchovies' approval
  'App Development':
    'We design and build apps that carry a brand onto the phone, from the first screens to the finished build. The aim is an app that feels like the rest of the brand and is easy to use every day.',
  // draft: written for the prototype, needs Anchovies' approval
  'Art Direction':
    'Art direction sets how a brand looks and feels: photography, type, layout and colour. We guide the visual choices on every piece so the work holds together wherever it shows up.',
  // draft: written for the prototype, needs Anchovies' approval
  'Brand Identity':
    'The core of a brand: the mark, typography, colour and the visual language around them. We build an identity around one clear idea, so it feels like it could only belong to you.',
  // draft: written for the prototype, needs Anchovies' approval
  'Brand System':
    'A brand system turns an identity into rules and tools a team can use every day. Templates, guidelines and components keep things consistent as the brand grows, without making it rigid.',
  // draft: written for the prototype, needs Anchovies' approval
  Campaign:
    "A campaign takes a brand's idea out into the world for a set time, across posters, social, screens and more. We shape the concept and carry it through each piece so it reads as one story.",
  // draft: written for the prototype, needs Anchovies' approval
  Copywriting:
    'Words are part of the brand too. We write taglines, headlines and site copy in a voice that sounds like you, clear enough to take in at a glance.',
  // draft: written for the prototype, needs Anchovies' approval
  'Creative Direction':
    'Creative direction is the thread through a whole project: the idea, the tone and the decisions that follow from them. We keep hold of that thread from the first sketches to the launch.',
  // draft: written for the prototype, needs Anchovies' approval
  Digital:
    'Digital covers the places a brand lives on screens, from social posts and ads to email and motion. We make sure the brand works as well there as it does on paper.',
  // draft: written for the prototype, needs Anchovies' approval
  'Graphic Design':
    'The everyday craft of putting type, image and colour on a page or a screen. Posters, stationery, menus and more, each one made with care and made to fit the brand.',
  // draft: written for the prototype, needs Anchovies' approval
  Illustration:
    "Drawn work made for the brand: characters, patterns, icons and scenes. Illustration gives a brand a hand-made voice that's hard to copy.",
  // draft: written for the prototype, needs Anchovies' approval
  Naming:
    'A good name is easy to say, easy to remember and has room to grow. We explore and shortlist names with you, then help you choose one you can build a brand on.',
  // draft: written for the prototype, needs Anchovies' approval
  Packaging:
    'Packaging is often the first part of a brand people hold. We design boxes, labels, bags and wraps that look right on the shelf and feel good to open.',
  // draft: written for the prototype, needs Anchovies' approval
  Production:
    'Production is where designs become real things: files prepared properly, materials chosen, printers and fabricators briefed. We see the work through so what arrives matches what was designed.',
  // draft: written for the prototype, needs Anchovies' approval
  'Publication Design':
    'Books, booklets, reports, magazines and menus: anything with pages. We design the layout and typography so longer reading is a pleasure rather than a chore.',
  // draft: written for the prototype, needs Anchovies' approval
  'Signage & Wayfinding':
    'Signs that help people find their way and make a place feel like the brand, from storefronts and awnings to the signs inside. We design for how people actually move through a space.',
  // draft: written for the prototype, needs Anchovies' approval
  Strategy:
    "Before design comes the thinking: who you're for, what sets you apart and what the brand should stand for. We work that out with you, so every later decision has something solid under it.",
  // draft: written for the prototype, needs Anchovies' approval
  'Website UI & UX':
    'We design websites that are clear to find your way around and feel like the brand, screen by screen. Structure, interface and interaction are worked out together, on phones and desktops.',
  // draft: written for the prototype, needs Anchovies' approval
  'Website Development':
    'We build the sites we design, so the finished website matches the design down to the details. Responsive, and set up so your team can keep it up to date.',
}

// ── Examples ────────────────────────────────────────────────────────────────
// sourced: a project is an example of a service only when that deliverable is in
// its `meta.deliverables` (projects.js, from each case page) or in its /work tags
// (WORK_TAGS above), using the same honest tag mapping as TAG_FOR. Services with
// no matching tag get no examples. The picture is a stack image whose label or
// caption shows that deliverable (observed captions in projects.js), else the cover.
const PICK = {
  'Signage & Wayfinding': /sign|awning|banner|window graphics|lightbox|billboard/i,
  Packaging: /packag|box|jar|wrap|tote/i,
  'Website UI & UX': /website|screen/i,
  'Website Development': /website|screen/i,
}
const WORK_SLUG = { 'molly-engels': 'molly-engles' } // projects.js id -> /work slug
const MAX_EXAMPLES = 4

function examplesFor(name) {
  const tag = TAG_FOR[name]
  if (!tag) return []
  const onWork = new Set((WORK_TAGS[tag] || []).map((p) => p.slug))
  const fit = PICK[name]
  const found = []
  projects.forEach((p, projectIndex) => {
    const listed = (p.meta?.deliverables || []).includes(tag) || onWork.has(WORK_SLUG[p.id] || p.id)
    if (!listed || !p.cover) return
    const shot = fit && (p.stack || []).find((im) => fit.test(`${im.label || ''} ${im.caption || ''}`))
    found.push({ projectIndex, id: p.id, name: p.name, image: shot || p.cover, caption: shot?.caption || null, fits: !!shot })
  })
  // Projects with a picture of this very deliverable first, then the rest.
  found.sort((a, b) => b.fits - a.fits)
  return found.slice(0, MAX_EXAMPLES)
}

// Slot codes run left to right, top to bottom: A1 A2 A3, B1 … F3.
export const services = SERVICE_NAMES.map((name, i) => {
  const workTag = TAG_FOR[name] || null
  return {
    code: ROWS[Math.floor(i / COLS.length)] + COLS[i % COLS.length],
    name,
    description: DESCRIPTIONS[name] || null, // draft, see DESCRIPTIONS_ARE_DRAFT
    workTag,
    projects: workTag ? WORK_TAGS[workTag] : [],
    examples: examplesFor(name),
  }
})

export const serviceByCode = Object.fromEntries(services.map((s) => [s.code, s]))

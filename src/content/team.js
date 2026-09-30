/*
 * The studio drawer: the team's own Polaroids, from anchovies.agency/about.
 * Every word on the backs is from that page (retrieved 2026-09-30):
 * the three tags under each name, the role, and a line from each bio.
 * The handwriting is a font (Nothing You Could Do) standing in for real
 * handwriting; scans of handwritten names and backs can replace it later.
 */

const img = (file, w, h, alt) => ({ src: `${import.meta.env.BASE_URL}assets/team/${file}`, w, h, alt })

export const team = [
  {
    id: 'sean',
    name: 'Sean Ashlow',
    role: 'Founder & Creative Director',
    tags: ['Incognito Musician', 'Founder', 'Cowboy'],
    line: 'Helps brands find the one clear idea worth building around.',
    photo: img('polaroid-sean.webp', 1315, 1591, 'Polaroid of Sean Ashlow, bearded, in a black T-shirt, in a dim green-lit room'), // observed
  },
  {
    id: 'kira',
    name: 'Kira Knoop',
    role: 'Illustrative Art Director',
    tags: ['Turtle Neck Collector', 'Painter', 'Has Bangs'],
    line: 'Shapes the creative vision and illustrative direction.',
    photo: img('polaroid-kira.webp', 1300, 1574, 'Polaroid of Kira Knoop, smiling, with long blonde hair and bangs, in a blue turtleneck'), // observed
  },
  {
    id: 'logan',
    name: 'Logan Causey',
    role: 'Art Director',
    tags: ['Americano Drinker', 'Type Expert', 'Frequent Yawner'],
    line: 'Executes the creative vision and ensures visual consistency.',
    photo: img('polaroid-logan.webp', 1014, 1588, 'Polaroid of Logan Causey, smiling, in a checked overshirt, beside framed pictures'), // observed
  },
]

/*
 * Office Polaroids: photos and clips from around the studio, scattered beneath
 * the three above. Clips autoplay, muted and looping (paused under reduced motion). Supplied in "Anchovies Photo & Video" (converted from HEIC
 * and MOV; videos re-encoded to 960 px MP4 with a poster frame). Alt text is what's in the frame (observed);
 * the backs are left blank rather than invent captions — add `caption` to write one.
 *   { id: 'desk', photo: office('desk.webp', 900, 900, 'Sean’s desk'), caption: 'Friday, 5pm' }
 */
const office = (file, w, h, alt) => ({ src: `${import.meta.env.BASE_URL}assets/team/office/${file}`, w, h, alt })
const clip = (name, alt) => ({
  id: name,
  photo: office(`${name}-poster.webp`, 337, 600, alt),
  video: `${import.meta.env.BASE_URL}assets/team/office/${name}.mp4`,
})

export const officePhotos = [
  { id: 'IMG_2956', photo: office('IMG_2956.webp', 675, 900, 'Sean at the long studio table, laptops and watercolour swatches spread out, framed prints on the wall behind') },
  { id: 'IMG_3059', photo: office('IMG_3059.webp', 675, 900, 'A whiteboard of pink character sketches with handwritten notes') },
  { id: 'IMG_3437', photo: office('IMG_3437.webp', 675, 900, 'Holding up a framed print by the studio window, a gold balloon in the corner') },
  { id: 'IMG_3456', photo: office('IMG_3456.webp', 900, 675, 'Drawing red character sketches in a sketchbook beside a laptop and printouts') },
  { id: 'IMG_4106', photo: office('IMG_4106.webp', 675, 900, 'The three of us out on the water, a paddleboard with cards laid out') },
  { id: 'IMG_4643', photo: office('IMG_4643.webp', 675, 900, 'A whiteboard drawing of a character with an octopus, by the window') },
  { id: 'IMG_4961', photo: office('IMG_4961.webp', 675, 900, 'A painting of crashing waves in progress on a cluttered desk') },
  clip('IMG_4619', 'The Union Station sign and neighbouring towers against a blue sky'),
  clip('IMG_4625', 'Botanical line drawings on a big screen'),
  clip('IMG_4757', 'Framed pictures on a studio wall beside a plant'),
  clip('IMG_4759', 'Watercolour sheets being shuffled on the desk'),
  clip('IMG_4761', 'Writing on the whiteboard by the window'),
  clip('IMG_4774', 'Looking out of the tall studio window'),
  clip('IMG_4779', 'The studio in low evening light'),
]

// Empty slots for photos still to come; set SLOTS to 0 when the drawer's full.
const SLOTS = 0
const placeholder = (n) => ({
  id: `slot-${String(n).padStart(2, '0')}`,
  photo: { src: null, w: 1000, h: 1000, alt: `Placeholder ${String(n).padStart(2, '0')}: studio photo to come` },
  caption: 'Photo to come',
})
officePhotos.push(...Array.from({ length: SLOTS }, (_, i) => placeholder(i + 1)))

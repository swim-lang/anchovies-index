/*
 * The Anchovies Index — editable project content.
 *
 * Everything the interface displays lives here. Replace freely.
 *
 * SOURCING KEY
 *   Text fields marked `// sourced` were copied verbatim from the live page
 *   named in `source` (retrieved 2026-09-30). Punctuation kept as published.
 *   `alt` and `caption` text was written by us from looking at each image.
 *   The live site publishes no alt text or captions. Those fields are marked
 *   `// observed`. Please review them.
 *
 * IMAGES
 *   Files are local copies in /public/assets/<project>/, downloaded from
 *   framerusercontent.com (the site's own CDN) at max 2048px. The original
 *   CDN URL is kept in `origin` so you can trace or swap any file.
 *   `w`/`h` are the intrinsic pixel sizes of the local files and are used to
 *   reserve layout space. Update them if you replace a file.
 */

const CDN = 'https://framerusercontent.com/images/'
const img = (project, file, w, h, alt, extra = {}) => ({
  src: `${import.meta.env.BASE_URL}assets/${project}/${file}`,
  origin: CDN + file,
  w,
  h,
  alt,
  ...extra,
})

export const agency = {
  name: 'Anchovies', // sourced
  contact: 'mailto:andy@anchovies.agency', // sourced: site footer
  contactLabel: 'andy@anchovies.agency',
  lockup: img('brand', 'anchovies-lockup.png', 2048, 300, 'Anchovies'), // the site header's lockup (wordmark + fish), in ink
  mark: img('brand', 'anchovies-mark.png', 1078, 663, 'Anchovies'), // cut out from the supplied fish mark, tight to the fish
  site: 'https://anchovies.agency/',
}

export const projects = [
  {
    id: 'lex-politica',
    number: '001',
    name: 'Lex Politica', // sourced
    category: 'Legal', // sourced: homepage card label
    kind: 'full', // complete interactive case study
    source: 'https://anchovies.agency/work/lex-politica',
    meta: {
      client: 'Lex Politica', // sourced
      industry: 'Legal', // sourced
      location: 'Austin, TX', // sourced
      year: '2025', // sourced
      deliverables: ['Brand Identity', 'Print', 'Signage', 'Website'], // sourced
      website: { label: 'lexpolitica.com', href: 'https://lexpolitica.com/' }, // sourced link
    },
    // Card image = case-study hero (the same file, so continuity is literal).
    cover: img('lex-politica', 'zzeXdh0hCMUwn2vUS1RNTJS5kIc.jpg', 2048, 1365,
      'Lex Politica presentation folders in black and white, with the griffin mark, fanned out on a dark surface'), // observed
    intro: 'Lex Politica engages in critical matters of policy, regulation, and politics with precision and determination.', // sourced
    statements: [
      'The griffin symbolizes the union of traditional power and visionary precision.', // sourced
      'Our choice of pure black and white represents more than visual simplicity, it’s strategic boldness.', // sourced
    ],
    story: 'Lex Politica came from a sudden naming conflict that forced Chris to rebrand quickly, but without losing momentum or stature. He wanted something that blended old-world credibility with new-world clarity — a brand that felt part newspaper, part institution, part modern think tank. We built an identity rooted in that balance and anchored it with a confident, ownable griffin mark. He loved it so much he’s considering getting it tattooed. The final brand gave him exactly what he needed: something timeless, authoritative, and undeniably his.', // sourced
    identity: img('lex-politica', 'GfOrl2pKLb2oyA6j76FPGzeh8.jpg', 2400, 1325,
      'The Lex Politica wordmark with griffin symbol, in white on black'), // observed
    engraving: img('lex-politica', 'JgJF1l17NXMJs8m5lju96mSdfA.jpg', 724, 666,
      'Stippled black-and-white image of classical columns, viewed from below'), // observed
    // The signature interaction. Order = order in the stack.
    stack: [
      img('lex-politica', 'eVUyX93EKPmBn96Uxfi9Zhg6wyE.jpg', 1531, 2048,
        'Office entrance with a black Lex Politica awning, door lettering reading “The Legal Offices of Lex Politica” and a black wall plaque',
        { label: 'Signage', caption: 'Entrance awning, door lettering and wall plaque' }), // observed
      img('lex-politica', 'sjB867sK5k0SMFs3N09MDb95U.jpg', 1362, 2048,
        'Freestanding street poster reading “Navigate beyond now. Representing ambitious & high-profile changemakers.” above a stippled image of columns',
        { label: 'Print', caption: 'Street poster — “Navigate beyond now.”' }), // observed
      img('lex-politica', 'QYAXONNz4GkUKEdW9rYsvqhyed0.jpg', 2400, 1865,
        'Lex Politica letterhead on black, headed “Where Knowledge Meets Power”, with the griffin and wordmark at mid-page',
        { label: 'Print', caption: 'Letterhead — “Where Knowledge Meets Power”' }), // observed
      img('lex-politica', 'rDP96v9rPhNH0sBujSEUht2zdc.jpg', 2400, 1596,
        'Black banner reading “Ahead of Tomorrow.” with the griffin, hung across a classical stone facade',
        { label: 'Signage', caption: 'Facade banner — “Ahead of Tomorrow.”' }), // observed
    ],
    // Supplied by the studio: the letterhead photographed as a real, folded sheet, cut out
    // on transparency. Shown as a sheet you can hold and tilt. It has one side only.
    sheet: img('lex-politica', 'letterhead-folded.webp', 1625, 2232,
      'The Lex Politica letterhead as a real sheet with two fold creases: griffin and wordmark top left, contact details along the foot', // observed
      { supplied: 'Real-Letterhead.png', caption: 'Letterhead, folded to post' }),
    // Supplied: the griffin mark, pressed into a wax seal on the folded letter.
    seal: { mark: img('lex-politica', 'griffin.svg', 1080, 1039, 'The Lex Politica griffin', { supplied: 'Lex-Politica.svg' }) },
    // The studio's pixel treatment, as a toy, on a plain photograph of columns
    // (not a mockup). Swap in any photo: a courthouse or columns works best.
    pixel: [img('lex-politica', 'JgJF1l17NXMJs8m5lju96mSdfA.jpg', 724, 666, 'Classical columns, viewed from below', { label: 'Columns' })],
    web: [
      img('lex-politica', '8uYBzg3xAhoIoiVUtsPbWS6iIM4.jpg', 2400, 1100,
        'A hand holding a phone showing the Lex Politica website'), // observed
      img('lex-politica', 'kvfK3TGvi6bzc3uNWWXab8x7sE.jpg', 2400, 1345,
        'A laptop in soft sunlight showing a team profile page on the Lex Politica website'), // observed
    ],
  },

  {
    id: 'tagawa',
    number: '002',
    name: 'Tagawa Gardens', // sourced: client name. The site's card reads “Tagawa”
    category: 'Retail', // sourced
    kind: 'preview',
    source: 'https://anchovies.agency/work/tagawa',
    meta: {
      client: 'Tagawa Gardens', // sourced
      industry: 'Retail', // sourced
      location: 'Denver, CO', // sourced
      year: '2025', // sourced
      deliverables: ['Brand Identity', 'Illustration', 'Signage', 'Print', 'Social Media'], // sourced
    },
    cover: img('tagawa', 'seJjCeYWC0uBIVsb7NrXJOyS0.jpg', 2000, 1333,
      'Two green Tagawa Gardens pole banners among trees, one with the gardener mark, one with wayfinding for plants, florals and supplies'), // observed
    intro: 'Founded in 1982, Tagawa Gardens remains what it’s always been, a place built on uncommon variety, guided by curiosity, and devoted to one simple idea: keep growing.', // sourced
    statements: ['Grown to last.'], // sourced
    story: 'Tagawa Gardens is a historic Colorado garden center with deep roots in roses, built over decades of serving locals who know it by heart. They came to us with a tricky challenge: attract a new generation and modernize the experience without losing the trust, warmth, and legacy that made Tagawa what it is.', // sourced (first paragraph)
    // Supplied: the gardener mark, standing at the end of a rose bed you can plant.
    garden: { gardener: img('tagawa', 'tagawa-gardener-plain.svg', 3000, 5528, 'The Tagawa gardener holding an oversized rose', { supplied: 'Tagawa-Logo-Shrub copy.svg, with the ™ removed for this view' }) },
    feature: img('tagawa', 'dNg7C0t54b4079T19eNKdtdf5o.jpg', 2000, 1400,
      'Green roadside billboard reading “Great People, Great Plants.” with plant illustrations'), // observed
    stack: [
      img('tagawa', 'AdTcYJD8q4LeMECuh3zxgBEmOiY.jpg', 1463, 2048,
        'A green Tagawa street poster reading “Great People, Great Plants.” on a tree-lined sidewalk',
        { label: 'Print', caption: 'Street poster — “Great People, Great Plants.”' }), // observed
      img('tagawa', 'QPLzXbBomYitbmoCGkSIDKGDkA.jpg', 2048, 1365,
        'Hands opening a green Tagawa Gardens brochure among leaves',
        { label: 'Print', caption: 'Folded brochure' }), // observed
      img('tagawa', 'IdNUm1Y6cL5SMDHsFjBhww7TdQc.jpg', 2000, 1333,
        'A green Tagawa tote bag reading “For People Who Love Plants.” carried on a sunny street',
        { label: 'Tote bag', caption: '“For People Who Love Plants.”' }), // observed
      img('tagawa', '1X9bw3ourwAUs12JTxj7TbAjM.jpg', 1200, 1800,
        'Hands holding a phone showing a green Tagawa social post',
        { label: 'Social Media', caption: 'A post, on the phone' }), // observed
    ],
  },

  {
    id: 'soft-hours',
    number: '003',
    name: 'Soft Hours', // sourced
    category: 'Retail', // sourced
    kind: 'preview',
    source: 'https://anchovies.agency/work/soft-hours',
    meta: {
      client: 'Soft Hours', // sourced
      industry: 'Retail', // sourced
      location: 'Austria', // sourced
      year: '2026', // sourced
      deliverables: ['Brand Identity', 'Website', 'Print'], // sourced
    },
    cover: img('soft-hours', 'kd8qLFdlWyFl346C354iGuG1Jo.webp', 2048, 1366,
      'A cream Soft Hours box lid with the wordmark and a small square symbol, on dark fabric'), // observed
    intro: 'The day belongs to many things. The soft hours belong to her.', // sourced
    statements: ['For the first hour and the last.', 'For doing very little, beautifully.'], // sourced
    story: 'Soft Hours is a premium women’s restwear brand. The founder originally came to us with the name Sleep Like a Goddess after working with several designers and still not finding an identity that connected.', // sourced (first paragraph)
    // Supplied by the studio: both sides of the hang tag as flat artwork.
    tag: {
      front: img('soft-hours', 'hangtag-front.jpg', 1200, 1900,
        'Soft Hours hang tag, front: a watercolor wash of lilac and peach above “Boutique · Pyjamas” and the Soft Hours wordmark on black', { supplied: 'Hangtag-Front.png' }), // observed
      back: img('soft-hours', 'hangtag-back.jpg', 1200, 1900,
        'Soft Hours hang tag, back: the small watch-face symbol centred on black', { supplied: 'Hangtag-Back.png' }), // observed
    },
    // Supplied: the watch-face lockup, shown keeping real time (approved to animate).
    dial: { mark: img('soft-hours', 'soft-hours-watchface.svg', 1034, 1034, 'The Soft Hours watch-face lockup: SOFT and HOURS inside a railroad minute track, with a small diamond at the centre', { supplied: 'Soft-Hours-Watchface-Lockup-Black copy.svg' }) },
    feature: img('soft-hours', '0pz9LWFfDM2LTBNRjMbbdKHLHM.webp', 1366, 2048,
      'A Soft Hours hang tag with a watercolor image, resting on mauve fabric'), // observed
    stack: [
      img('soft-hours', 'JBiXdmvclAWUAVbyTwOO5ohyI.png', 2048, 1365,
        'A stitched Soft Hours garment label reading “High Quality Pyjamas” with a short paragraph about rest',
        { label: 'Label', caption: 'Sewn-in label — “High Quality Pyjamas”' }), // observed
      img('soft-hours', '6kqIzmHroDsNylaWnfvkkvZ7u3w.webp', 1479, 2048,
        'Printed tissue paper repeating the Soft Hours name and circular marks, sealed with a round sticker',
        { label: 'Print', caption: 'Tissue wrap and seal' }), // observed
      img('soft-hours', 'sW4PQ8fdRW6PDir8NUQeL8ZqI.webp', 1363, 2048,
        'A square Soft Hours sign mounted on a dark brick wall',
        { label: 'Sign', caption: 'Wall sign, after the watch face' }), // observed
      img('soft-hours', 'xFFw0StLiKXrScGbrIuPkYIS4.webp', 2048, 1366,
        'A laptop showing the Soft Hours website with a “New Arrivals” page',
        { label: 'Website', caption: '“New Arrivals”' }), // observed
    ],
  },

  {
    id: 'molly-engels',
    number: '004',
    name: 'Molly Engels', // the logo and client field read “Engels”; the page title reads “Molly Engles”
    category: 'Creative Freelancer', // sourced
    kind: 'preview',
    source: 'https://anchovies.agency/work/molly-engles',
    meta: {
      client: 'Molly Engels', // sourced
      industry: 'Creative Freelancer', // sourced
      location: 'Denver, CO', // sourced
      year: '2026', // sourced
      deliverables: ['Brand Identity', 'Illustration', 'Motion', 'Print', 'Website'], // sourced from the /work index tags (the case page lists none)
    },
    cover: img('molly-engles', 'W9N25Vdc37odROFddB2ATtq6N3Q.webp', 2048, 1366,
      'A blue tram wrapped in yellow, pink and red Molly Engels branding, passing a stone building'), // observed
    intro: 'Helping people & organizations find their story.', // sourced
    statements: ['Playful, Bold, and Whimsical.', 'Handcrafted stamps featuring original watercolor illustrations.'], // sourced
    story: 'We found our visual direction in Molly’s passion for stamp collecting. As a philatelist, she was drawn not only to the objects themselves, but to the people, places, and stories each stamp could hold. That idea became the foundation for a bold, maximalist identity designed to get attention and evolve alongside her career.', // sourced (third paragraph)
    // Supplied: the envelope and ten hand-drawn stamps, as separate files.
    stamps: {
      envelope: img('molly-engles', 'envelope.png', 600, 545, 'An open red envelope with a pale pink letter inside', { supplied: 'Molly-Envelope.png' }),
      set: [
        { key: 'basil', name: 'Basil', src: `${import.meta.env.BASE_URL}assets/molly-engles/stamps/basil.webp` },
        { key: 'beetle', name: 'Beetle', src: `${import.meta.env.BASE_URL}assets/molly-engles/stamps/beetle.webp` },
        { key: 'books', name: 'Books', src: `${import.meta.env.BASE_URL}assets/molly-engles/stamps/books.webp` },
        { key: 'clover', name: 'Clover', src: `${import.meta.env.BASE_URL}assets/molly-engles/stamps/clover.webp` },
        { key: 'dog', name: 'Dog', src: `${import.meta.env.BASE_URL}assets/molly-engles/stamps/dog.webp` },
        { key: 'face', name: 'Face', src: `${import.meta.env.BASE_URL}assets/molly-engles/stamps/face.webp` },
        { key: 'lemon', name: 'Lemon', src: `${import.meta.env.BASE_URL}assets/molly-engles/stamps/lemon.webp` },
        { key: 'orange', name: 'Orange', src: `${import.meta.env.BASE_URL}assets/molly-engles/stamps/orange.webp` },
        { key: 'star', name: 'Star', src: `${import.meta.env.BASE_URL}assets/molly-engles/stamps/star.webp` },
        { key: 'vermont', name: 'Vermont', src: `${import.meta.env.BASE_URL}assets/molly-engles/stamps/vermont.webp` },
      ],
    },
    feature: img('molly-engles', 'qIT1Z2QIk2DQtHVMwInv4YzYso.webp', 1536, 2048,
      'An open hand holding a pile of illustrated Molly Engels stamps: a heart, a star, a strawberry, an eye, a face'), // observed
    stack: [
      img('molly-engles', 'mbcXrkVIIkRWLd9Or35ivZrRfjs.webp', 2048, 1478,
        'A yellow Molly Engels letter with pink stripes, a matchbox and illustrated stamps, on black',
        { label: 'Print', caption: 'Letter, matchbox and stamps' }), // observed
      img('molly-engles', 'wt40QmYQovCZL15BXQZb37yGw.webp', 2048, 1368,
        'Someone reading a striped Molly Engels booklet with their feet up beside a bookshelf',
        { label: 'Print', caption: 'Booklet' }), // observed
      img('molly-engles', 'ZcDa1tlgWahlhvyz2IRCqDrHQk.webp', 2048, 1366,
        'A person in a yellow hoodie printed with the Molly Engels logo, standing by a train',
        { label: 'Apparel', caption: 'Hoodie' }), // observed
      img('molly-engles', 'vXzOf3FO7TIht5uWF7s31okLYsQ.webp', 2048, 1366,
        'A laptop on a bentwood chair showing a red “About Me” page',
        { label: 'Website', caption: '“About Me”' }), // observed
      img('molly-engles', '8VXeKxahoK9ewJbPe0Or8o5U6Kc.webp', 2048, 1366,
        'A rooftop billboard reading “Molly Engels” with stamps and “Helping People & Find Their Story”',
        { label: 'Signage', caption: 'Billboard' }), // observed
    ],
  },

  {
    id: 'arc88',
    number: '005',
    name: 'Arc88', // sourced
    category: 'Design', // sourced
    kind: 'preview',
    source: 'https://anchovies.agency/work/arc88',
    meta: {
      client: 'Salmon Nortje', // sourced
      industry: 'Design', // sourced
      location: 'Cape Town, South Africa', // sourced
      year: '2026', // sourced
      deliverables: ['Brand Identity', 'Motion', 'Website'], // sourced
    },
    cover: img('arc88', 'rB0wrSNownutqJ9cVJoXlEsyQ.webp', 2048, 1366,
      'A large Arc88 billboard on a white industrial building reading “Products made by hand for your hand.”'), // observed
    intro: 'Arc88 is an industrial design practice built around thoughtful problem-solving, product clarity, and real-world viability.', // sourced
    statements: ['Made to work, designed for use.', 'Products that work well, feel considered, and perform in market.'], // sourced
    story: 'The identity drew from perforated steel plates used in machining, forming a symbol that also reads as an abstract 88. From there, we built a restrained website that allows the studio’s portfolio to take the lead.', // sourced (from the second paragraph)
    // Supplied by the studio: the perforated-plate symbol. Shown as a plate you look through.
    plate: {
      mark: img('arc88', 'arc88-plate-mark.svg', 3000, 2841, 'The Arc88 symbol: two black plates, each pierced by two rounded holes', { supplied: 'Arc88-Logo.svg' }),
      behind: img('arc88', 'Y3R0pS1YMPiShWxoz7KXkVYF18.webp', 1366, 2048, ''),
    },
    feature: img('arc88', '6h2xmDI4cdbPjz3us8h4WA0cww.webp', 2048, 1152,
      'An open Arc88 brochure on black, with the symbol, product photographs and text columns'), // observed
    stack: [
      img('arc88', 'xB1cgWfeyZz7QvZ1tmAwoeqq0Q.webp', 1367, 2048,
        'A person lifting a grey Arc88 shipping box from a stack of boxes with orange details',
        { label: 'Boxes', caption: 'Shipping boxes' }), // observed
      img('arc88', '0e5AebQblIjb06cMVaWZRnNBL8o.webp', 1366, 2048,
        'Two Arc88 business cards on light tiles, one showing the perforated-circle symbol',
        { label: 'Print', caption: 'Business cards' }), // observed
      img('arc88', 'OJh7OYEkgO4SiLcnQUIR6cEd1M.webp', 1366, 2048,
        'An arched stone window with Arc88 graphics applied to the glass',
        { label: 'Signage', caption: 'Window graphics' }), // observed
      img('arc88', 'Y3R0pS1YMPiShWxoz7KXkVYF18.webp', 1366, 2048,
        'An Arc88 poster in a lightbox on a subway platform',
        { label: 'Poster', caption: 'Subway lightbox' }), // observed
    ],
  },

  {
    id: 'runway',
    number: '006',
    name: 'Runway', // sourced
    category: 'Health', // sourced
    kind: 'preview',
    source: 'https://anchovies.agency/work/runway',
    meta: {
      client: 'Runway', // sourced
      industry: 'Health', // sourced
      location: 'Brooklyn, NY', // sourced
      year: '2025', // sourced
      deliverables: ['Brand Identity', 'Packaging', 'Print', 'Signage'], // sourced
    },
    cover: img('runway', 'ONxxnqzkgvPlGZHSjtm9ZPLZSs.jpg', 2300, 1500,
      'Four Runway business cards, fronts in bright blue and backs in pale blue, laid against a cloudy sky'), // observed
    intro: 'Runway is a Botox studio designed for beautiful faces. Offering elevated confidence through an experience that’s intentionally simple.', // sourced
    statements: ['Confidence, non-stop.', 'Chrome adds retro luxury — a direct nod to the polished world of ’70s aviation and Pan Am-era glamour.'], // sourced
    story: 'Runway came to us with a deceptively hard challenge: make Botox feel fun and simple without losing trust. Most brands go sterile because they think serious equals credible. We did the opposite, building a playful but premium world, because trust is earned through great design, not a cold tone.', // sourced (opening)
    // Supplied by the studio: the business card, both sides, rendered from the print PDFs.
    card: {
      front: img('runway', 'runway-card-front.png', 2400, 1440,
        'Runway business card, front: the pale blue runway wordmark on bright blue, with “Beauty Without Baggage”', { supplied: 'Runway-Card-Front.pdf' }), // observed
      back: img('runway', 'runway-card-back.png', 2400, 1440,
        'Runway business card, back: name, title “co-founder”, phone, email, web and address in blue on pale blue, headed “Confidence: Non-Stop”', { supplied: 'Runway-Card-Back.pdf' }), // observed
    },
    // Supplied: the aftercare boarding pass, both sides, rendered from the print PDFs.
    pass: {
      perf: 0.675, // where the perforation runs, as a fraction of the width (measured from the artwork)
      front: img('runway', 'boarding-front.png', 2600, 1258,
        'Runway aftercare boarding pass: passenger, flight and gate details in blue, with a tear-off stub and barcode on the right', { supplied: 'BoardingPass-Runway-Front.pdf' }), // observed
      back: img('runway', 'boarding-back.png', 2600, 1258,
        'Back of the Runway boarding pass: a flight plan of what to expect from day 0 to month 3–4', { supplied: 'BoardingPass-Runway-Back.pdf' }), // observed
    },
    feature: img('runway', 'Ipe5p9MraEyCpe0w7tBhhDiIUOU.jpg', 2400, 2399,
      'A person holding a Runway card reading “First Class Botox” in front of their face, against a blue sky'), // observed
    stack: [
      img('runway', 'OrqeSxId3sYnjoyGa0MJ4ZMZbVM.jpg', 1680, 2400,
        'A clear Runway tote with blue handles, holding a blue Runway box',
        { label: 'Packaging', caption: 'Clear tote and box' }), // observed
      img('runway', 'elEd9gXbuxwwinPe42tZCXvMo40.jpg', 1600, 2400,
        'Two blue Runway jars, one lid balanced above the other, on a white ledge',
        { label: 'Packaging', caption: 'Jars' }), // observed
      img('runway', 'DpiqittCYHqbprospAXzI3vw.jpg', 1600, 2400,
        'A phone showing a Runway page, resting on blue tiles beside a white basin',
        { label: 'Screen', caption: 'On the phone' }), // observed
      img('runway', '1QOUy3qwTbv93eDbeeyjnHWMkk.jpg', 2048, 1365,
        'A laptop in warm light showing a Runway page with the blue chrome wordmark',
        { label: 'Screen', caption: 'On the laptop' }), // observed
    ],
  },

  {
    id: 'garza',
    number: '007',
    name: 'Garza', // sourced
    category: 'Legal', // sourced
    kind: 'preview',
    source: 'https://anchovies.agency/work/garza',
    meta: {
      client: 'Garza', // sourced
      industry: 'Legal', // sourced
      location: 'McAllen, TX', // sourced
      year: '2025', // sourced
      deliverables: ['Brand Identity', 'Print', 'Signage', 'Website'], // sourced
    },
    cover: img('garza', 'wbYc8yvARhKCo0AoYwFvzMlCIAU.jpg', 2048, 1434,
      'A tall wooden window with the Garza wordmark applied to the glass in front of sheer curtains'), // observed
    intro: 'Garza Law is a personal injury & complex litigation firm serving South Texas.', // sourced
    statements: [
      'The border draws inspiration from the Charro jackets worn by vaqueros, nodding to heritage while serving as a distinguishing brand element.', // sourced
      'Garza’s color palette evokes an association with the American Frontier, while differentiating itself from other legal competitors.', // sourced
    ],
    story: 'Garza, a Texas-based attorney, came to us wanting to break free from the safe and stale aesthetic most firms fall into. His personality is bold, grounded, and unafraid to stand out, and he wanted a brand that matched that. We created an identity that felt proudly Texan, unmistakably local, and impossible to forget.', // sourced (opening)
    // Supplied by the studio: the painting at full resolution, for close looking.
    painting: {
      full: img('garza', 'garza-painting-full.jpg', 3300, 4200,
        'Painted canyon landscape: red mesas under a towering cloudy sky, a small red horse crossing the valley floor', { supplied: 'Garza-Painting.png' }), // observed
      preview: img('garza', 'garza-painting-preview.jpg', 1100, 1400, ''),
      border: `${import.meta.env.BASE_URL}assets/garza/charro-border.svg`, // supplied: Charo-Border.svg
    },
    feature: img('garza', '8892Esi69w0uWbdOUGZ73MbZrEM.jpg', 2400, 1350,
      'Garza stationery on black: a letterhead printed with the canyon painting, a white envelope with the horse mark, and a brown folder with a red horse and the boxed GARZA wordmark'), // observed
    stack: [
      img('garza', 'ta9k6R7ZZJn8SsaAFOWm8hxAVCI.jpg', 2400, 1596,
        'A dark brown Garza banner reading “Ride Through The Storm” hung across a stone facade',
        { label: 'Signage', caption: 'Facade banner — “Ride Through The Storm”' }), // observed
      img('garza', 'IRdBAl3feNtGtKASL9gqbSpP1w.jpg', 1758, 2400,
        'A white Garza envelope with a window, set against a brown envelope, on black',
        { label: 'Print', caption: 'Envelopes' }), // observed
      img('garza', 'VDJufNMX7e7PbguzSG7tR5PYuGs.jpg', 1463, 2048,
        'A brown Garza poster mounted on a street utility box beside a brick wall',
        { label: 'Signage', caption: 'Street poster' }), // observed
      img('garza', 'yDM1bsQ5cEuheXr4FCyGUWg6npY.jpg', 2400, 1350,
        'A dark glass bottle with a Garza label on a brown background',
        { label: 'Bottle', caption: 'Bottle label' }), // observed
      img('garza', 'HMqIB7zLwgXwhLJmLs1ooESrM.jpg', 2048, 1314,
        'Three phone screens on black showing Garza pages, the centre one with the canyon painting and “Ride Through The Storm”',
        { label: 'Website', caption: 'Three mobile screens' }), // observed
    ],
  },

  {
    id: 'heartwood',
    number: '008',
    name: 'Heartwood', // sourced
    category: 'Wellness', // sourced
    kind: 'preview',
    source: 'https://anchovies.agency/work/heartwood',
    meta: {
      client: 'Heartwood', // sourced
      industry: 'Wellness', // sourced
      location: 'Denver, CO', // sourced
      year: '2026', // sourced
      deliverables: ['Brand Identity', 'Naming', 'Website', 'Illustration', 'Print'], // sourced
    },
    cover: img('heartwood', '43j5EYjJkHW5ncphO4QrCJnEMo.webp', 2048, 1366,
      'A dark green Heartwood billboard reading “Strength from within.” above a street lined with palm trees, under a clear blue sky'), // observed
    intro: 'Heartwood is a personalized team wellbeing platform for modern companies.', // sourced
    // The mark, animated: the supplied SVG has two paths, one per ring. Its own black on off-white
    // (Heartwood's colours are unverified).
    rings: {
      mark: img('magnets/marks', 'heartwood.svg', 193.6, 192.16, 'The Heartwood mark: two wavy black rings, one inside the other', { origin: null }), // observed; a supplied file, not from the CDN
    },
    statements: ['Team health is business health.', 'Strength from within.'], // sourced
    story: 'Heartwood came to us with a brand new idea. Founder Katy had a deep background in meditation, wellness, and sustainability, but was looking for the right way to turn that expertise into a business. Together, we explored not only the brand itself, but also the business model, shaping a concept that could bring a more holistic approach to employee wellbeing into the workplace.', // sourced (first paragraph)
    feature: img('heartwood', 'fgh1qJV5G9UP6qBgmtwnV05RLzI.webp', 2048, 1152,
      'A square hanging sign with the Heartwood ring symbol, projecting from a pale stone building'), // observed
    stack: [
      img('heartwood', '5Yy2tsr0x7us05CBV39GXarkM.webp', 1366, 2048,
        'A Heartwood poster in a bus shelter, blurred greenery behind the line “Heartwood is a personalized team wellbeing platform for modern companies.”',
        { label: 'Print', caption: 'Bus shelter poster' }), // observed
      img('heartwood', 'fX2fdqTHGkLRlIa7zqtTmt56ys.webp', 2048, 1366,
        'A small stack of pale grey Heartwood business cards on a wooden table, striped with window shadows',
        { label: 'Print', caption: 'Business cards' }), // observed
      img('heartwood', '6Qg6f29RnLAyU4OS3LVpIgM8D0.webp', 1366, 2048,
        'A hand holding a phone showing the Heartwood app sign-in screen over a soft photo of purple flowers',
        { label: 'App', caption: 'On the phone' }), // observed
      img('heartwood', 'gSbxcB4jlESZgw9SMzvurRouKzo.png', 2048, 1366,
        'A close crop of a phone home screen with the Heartwood app icon beside Calendar, Photos, Mail and Notes',
        { label: 'App', caption: 'App icon' }), // observed
      img('heartwood', 'waRjtyYyEwxiVsICZJMIaJQoRI.webp', 2048, 1366,
        'A laptop on a bed in low evening light showing a Heartwood web page with an illustration of two figures',
        { label: 'Website', caption: 'On the laptop' }), // observed
    ],
  },

  {
    id: 'notably',
    number: '009',
    name: 'Notably', // sourced
    category: 'Human Resources', // sourced
    kind: 'preview',
    source: 'https://anchovies.agency/work/notably',
    meta: {
      client: 'Julie Anich', // sourced
      industry: 'Human Resources', // sourced
      location: 'Denver, CO', // sourced
      year: '2026', // sourced
      deliverables: ['Brand Identity', 'Motion', 'Naming', 'Website'], // sourced
      website: { label: 'notablyrecruit.com', href: 'https://notablyrecruit.com' }, // sourced link (labelled “Notably Site” on the page)
    },
    cover: img('notably', 'eQy48PpbN6fKII7K4wj08LAg8U.webp', 2048, 1367,
      'A Notably billboard on a brick wall reading “Great hiring is not just about who can do the job. It is about who will move the business forward.” with key words highlighted in yellow'), // observed
    intro: 'Recruiting for the roles that keep the business moving.', // sourced
    // The campaign's highlighter device. Line and highlighted words as on the billboard (observed in the cover photo);
    // the yellow sampled from that photo and lifted a little toward the printed ink.
    highlight: {
      text: 'Great hiring is not just about who can do the job. It is about who will move the business forward.',
      marks: [0, 1, 14, 16, 19], // Great hiring · who · move · forward.
      color: '#ebe58c',
    },
    statements: ['Talent worth your attention.', 'Accounting, finance, and tax recruiting led by Julie Anich.'], // sourced
    story: 'Julie, the founder of Notably, came to us to create a recruiting brand that could feel distinct without losing credibility with its audience. Recruiting is not a space known for taking many creative risks, so the challenge was to build something unexpected but still immediately relevant.', // sourced (first paragraph)
    feature: img('notably', 'dr0qfQT3FBwu0Ib9gotcjnWk.webp', 2048, 1366,
      'A stack of white Notably business cards with the striped highlighter mark, on a wooden table in slatted sunlight'), // observed
    stack: [
      img('notably', 'fHVAzKLJRz5qxy4JX2WUgYtukw4.webp', 1366, 2048,
        'A hanging Notably sign with a large striped mark on pale yellow, mounted on a street pole beside a mural',
        { label: 'Signage', caption: 'Hanging sign' }), // observed
      img('notably', 'ZH4KSmHgDhxupXs50PWMFTSps.webp', 1367, 2048,
        'A freestanding Notably street poster reading “Standout Hires For Growing Teams” in yellow highlighted bands',
        { label: 'Print', caption: 'Street poster — “Standout Hires For Growing Teams”' }), // observed
      img('notably', '8N8E4ugYvE4kYr6JR1Huk2dDCe0.webp', 1367, 2048,
        'A hand holding a pale green lanyard with a Notably name badge for Julie Anich',
        { label: 'Print', caption: 'Lanyard and badge' }), // observed
      img('notably', 'qWIbYT6GyZP5Qv61JzRigRrlTZU.webp', 1367, 2048,
        'Hands holding a white and yellow Notably report titled “Merlin ‘New Hire’ Prospects Dossier” against a striped shirt',
        { label: 'Print', caption: 'Prospects dossier' }), // observed
    ],
  },

  {
    id: 'freddie',
    number: '010',
    name: 'Freddie', // sourced
    category: 'Retail', // sourced
    kind: 'preview',
    source: 'https://anchovies.agency/work/freddie',
    meta: {
      client: 'Freddie', // sourced
      industry: 'Retail', // sourced
      location: 'Boston, MA', // sourced
      year: '2026', // sourced
      deliverables: ['Brand Identity', 'Illustration', 'Motion'], // sourced
    },
    cover: img('freddie', '74b2Zn1YfZKDHcj6q9lL2nOe9w.jpg', 2400, 1599,
      'A laptop on a wooden desk showing a Freddie page reading “Tomorrow Starts Tonight” among colorful hand-drawn characters'), // observed
    intro: 'Differentiating an industry newcomer from it\'s overly sterile, performance-focused competitors.', // sourced (apostrophe as published)
    // The red-lens viewer: the laptop mockup from the cover (observed: its white page and blue, lilac and
    // green characters show the red lens best). Colours from the studio's Freddie deck (supplied in the brief).
    // Freddie's illustrations are not used as a toy: the live page publishes no standalone illustration files,
    // only photographs and a motion reel that contain them.
    redLens: {
      image: img('freddie', '74b2Zn1YfZKDHcj6q9lL2nOe9w.jpg', 2400, 1599,
        'A laptop on a wooden desk showing a Freddie page reading “Tomorrow Starts Tonight” among colorful hand-drawn characters'), // observed
      colors: { brown: '#4b1d11', blue: '#6896fc', red: '#ef414a', cream: '#f7f0ed', lilac: '#cfb1e5', pistachio: '#d9ef9a' }, // studio deck
    },
    statements: ['Tomorrow starts tonight.', 'Made for the after-hours crowd.'], // sourced
    story: 'Freddie came to us with a clear ambition: to rethink what sleep glasses could look and feel like for a younger audience. In a category crowded with performance claims, scientific language, and brands that take themselves a little too seriously, he wanted to build something more honest, more lifestyle-driven, and more culturally in tune.', // sourced (opening)
    feature: img('freddie', 'ZwstGyimirdFvRXJo4c6U39Mo.jpg', 2048, 1365,
      'Brown Freddie packaging printed “Glasses For A Healthier Bedtime Routine”, with a lilac card showing a sleeping character and “Tomorrow starts tonight”'), // observed
    stack: [
      img('freddie', '035K87ekC6C89DyG6jJRXu5QKfo.jpg', 1366, 2048,
        'Someone holding up a folded Freddie poster at night: a lilac-outlined character in a starry nightcap under the headline “Good Glasses For Bad Screen Habtis”',
        { label: 'Print', caption: 'Poster' }), // observed
      img('freddie', '7OCPL725bIsRYNr5NkE1JEOEcAc.jpg', 1364, 2048,
        'A lit bus shelter at night with a lilac Freddie poster of a smiling face in glasses, headed “Glasses For A Healthier Bedtime Routine”',
        { label: 'Signage', caption: 'Bus shelter at night' }), // observed
      img('freddie', 'RTxOHUEGc4OikH0RlOnl7IMNPw.jpg', 2400, 2117,
        'A glowing blue Freddie lightbox sign on a dark wall, with a drawn smiling face in glasses',
        { label: 'Signage', caption: 'Lightbox sign' }), // observed
      img('freddie', 'EiEO3ijsET3uYe2ds9tNNfND9tk.jpg', 2048, 1769,
        'Hands holding a phone over denim, the screen in green reading “We Got Glasses For Anybody And Everybody” with drawn glasses',
        { label: 'Social Media', caption: 'On the phone' }), // observed
      img('freddie', 'yj6u5jHqwLsXINhDDb7dLBkybDs.jpg', 1601, 2400,
        'A person carrying two stacked Freddie boxes, the top one reading “Glasses For Late-Night Everything” with a drawn bear',
        { label: 'Packaging', caption: 'Shipping boxes' }), // observed
      img('freddie', 'pE0qLpvGc0OFhfDcEZu4ARUkFHc.jpeg', 1600, 1066,
        'Clear-framed glasses with red lenses on a pale blue cloth, beside a white Freddie case and a kraft box',
        { label: 'Product', caption: 'Glasses and case' }), // observed
    ],
  },

  {
    id: 'koplow',
    number: '011',
    name: 'Koplow', // sourced
    category: 'Legal', // sourced
    kind: 'preview',
    source: 'https://anchovies.agency/work/koplow',
    meta: {
      client: 'Koplow Defense', // sourced
      industry: 'Legal', // sourced
      location: 'Phoenix, AZ', // sourced
      year: '2025', // sourced
      deliverables: ['Brand Identity', 'Packaging', 'Print', 'Signage'], // sourced
    },
    cover: img('koplow', 'pJQ0WEpr7pabh1ucSqyrdC1dj4.jpg', 2400, 1680,
      'A huge black Koplow screen in a dark concourse showing a black-and-white prickly pear cactus and “Sharp Defense for Serious Charges”, with people walking past in silhouette'), // observed
    intro: 'Koplow Defense helps people facing High-Stakes Charges get the Sharp Defense they need.', // sourced
    statements: [
      'Drawing from the sharp, defensive structure of Arizona cacti, the logo fits both the region and nature of defense.', // sourced
      'Not A Volume Firm. On Purpose.', // sourced
    ],
    story: 'Lawrence Koplow, an Arizona criminal defense attorney known for taking on the kinds of cases the system would rather push through, came to us wanting a brand that actually looked and sounded like the way he practices law. He needed an identity that could hold that edge while still feeling rigorous and premium. We repositioned his practice from a single-issue DUI site to Koplow Defense—a justice-forward brand built around high-stakes charges, a limited-caseload model, and a simple promise: sharp defense for serious cases. The new identity feels precise and strategically built for the moments when the state throws its full weight at someone.', // sourced
    feature: img('koplow', 'GnGNws9x84TaMMkxu5Z6shMl6o4.jpg', 2048, 1336,
      'Two Koplow Defense business cards, one black and one white, each with the star mark, laid over a black-and-white photo of cacti'), // observed
    stack: [
      img('koplow', 'PYDGO6i60pJk3oAj3bHYDzFWE.jpg', 1755, 2193,
        'A black square sign reading “Koplow ✶ Defense” projecting from a pale building, dappled with leaf shadows',
        { label: 'Signage', caption: 'Hanging sign' }), // observed
      img('koplow', 'W1dGJDw1l3AWl0dQEprwomAkFQ.jpg', 2048, 1366,
        'A street kiosk with two black Koplow posters, one showing a tall saguaro cactus, the other the star mark',
        { label: 'Print', caption: 'Street kiosk posters' }), // observed
      img('koplow', 'kRgIJ638DStJQmH5hjt3YuUwuU.jpg', 2249, 1500,
        'A shop window with a large white star compass mark, the name Koplow and the line “Arizona Criminal Defense Attorney” applied to the glass',
        { label: 'Signage', caption: 'Window graphics' }), // observed
      img('koplow', 'q9xoo76ypKHXQM7VjYaBjxZaJo.jpg', 1715, 2400,
        'A black Koplow Defense poster with a large grey star in a city bus shelter, people passing on the pavement',
        { label: 'Print', caption: 'Bus shelter poster' }), // observed
    ],
  },
]

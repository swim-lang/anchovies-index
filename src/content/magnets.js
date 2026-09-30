/*
 * Fridge magnets: every client mark on anchovies.agency/work (retrieved 2026-09-30),
 * 84 in all. These are the marks from the work page's project cards, on
 * transparent backgrounds. Brands with a colour are shown in it (`color`: taken
 * from how the logo appears in the brand's own case-study hero); the rest stay black.
 *
 * Links: `project` opens a case study in this prototype; `url` opens the live
 * case study on anchovies.agency. 39 of the brands have a mark on the site but
 * no finished case study yet (their pages are unpublished templates), so their
 * `url` is null and the magnet doesn't link anywhere.
 */

const a = (file) => `${import.meta.env.BASE_URL}assets/magnets/marks/${file}`

export const magnets = [
  { id: '206', label: "206", project: null, src: a('206.svg'), w: 533.32, h: 381.36, color: '#9c604f', url: 'https://anchovies.agency/work/206' },
  { id: '30-60-90', label: "30 60 90", project: null, src: a('30-60-90.png'), w: 600, h: 589, color: null, url: null },
  { id: 'adlib', label: "Adlib", project: null, src: a('adlib.png'), w: 600, h: 177, color: null, url: 'https://anchovies.agency/work/adlib' },
  { id: 'agate', label: "Agate", project: null, src: a('agate.png'), w: 600, h: 600, color: null, url: null },
  { id: 'aliana', label: "Aliana", project: null, src: a('aliana.png'), w: 600, h: 393, color: null, url: null },
  { id: 'antidote', label: "Antidote", project: null, src: a('antidote.png'), w: 598, h: 600, color: null, url: null },
  { id: 'arc88', label: "Arc88", project: 'arc88', src: a('arc88.png'), w: 600, h: 568, color: null, url: 'https://anchovies.agency/work/arc88' },
  { id: 'avodah', label: "Avodah", project: null, src: a('avodah.png'), w: 600, h: 547, color: '#c74e33', url: 'https://anchovies.agency/work/avodah' },
  { id: 'belzer-law', label: "Belzer Law", project: null, src: a('belzer-law.png'), w: 600, h: 600, color: null, url: 'https://anchovies.agency/work/belzer-law' },
  { id: 'blanchet', label: "Blanchet", project: null, src: a('blanchet.svg'), w: 346.3, h: 300.0, color: null, url: null },
  { id: 'ceremony', label: "Ceremony", project: null, src: a('ceremony.png'), w: 277, h: 600, color: null, url: null },
  { id: 'constellation', label: "Constellation", project: null, src: a('constellation.png'), w: 571, h: 600, color: null, url: null },
  { id: 'copper-coyote', label: "Copper Coyote", project: null, src: a('copper-coyote.png'), w: 531, h: 600, color: null, url: null },
  { id: 'day-one', label: "Day One", project: null, src: a('day-one.png'), w: 600, h: 187, color: null, url: null },
  { id: 'donna-beth', label: "Donna Beth", project: null, src: a('donna-beth.png'), w: 524, h: 600, color: null, url: 'https://anchovies.agency/work/donna-beth' },
  { id: 'duo', label: "Duo", project: null, src: a('duo.svg'), w: 377.78, h: 144.24, color: '#f49819', url: 'https://anchovies.agency/work/duo' },
  { id: 'frank-devincent', label: "Frank DeVincent", project: null, src: a('frank-devincent.png'), w: 585, h: 600, color: null, url: null },
  { id: 'freddie', label: "Freddie", project: 'freddie', src: a('freddie.png'), w: 600, h: 397, color: '#461e12', url: 'https://anchovies.agency/work/freddie' },
  { id: 'garza', label: "Garza", project: 'garza', src: a('garza.png'), w: 600, h: 473, color: '#c63938', url: 'https://anchovies.agency/work/garza' },
  { id: 'gober', label: "Gober", project: null, src: a('gober.png'), w: 579, h: 600, color: null, url: null },
  { id: 'gober-group', label: "Gober Group", project: null, src: a('gober-group.png'), w: 600, h: 413, color: null, url: null },
  { id: 'good-days-bad-days', label: "Good Days Bad Days", project: null, src: a('good-days-bad-days.png'), w: 292, h: 600, color: null, url: null },
  { id: 'good-measure', label: "Good Measure", project: null, src: a('good-measure.png'), w: 600, h: 180, color: null, url: 'https://anchovies.agency/work/good-measure' },
  { id: 'green-nomad', label: "Green Nomad", project: null, src: a('green-nomad.png'), w: 600, h: 570, color: '#083f1f', url: 'https://anchovies.agency/work/green-nomad' },
  { id: 'heartwood', label: "Heartwood", project: 'heartwood', src: a('heartwood.svg'), w: 193.6, h: 192.16, color: null, url: 'https://anchovies.agency/work/heartwood' },
  { id: 'hometown', label: "Hometown", project: null, src: a('hometown.png'), w: 600, h: 573, color: '#f97b00', url: 'https://anchovies.agency/work/hometown' },
  { id: 'humanly', label: "Humanly", project: null, src: a('humanly.png'), w: 514, h: 600, color: null, url: null },
  { id: 'inbank', label: "InBank", project: null, src: a('inbank.png'), w: 600, h: 438, color: null, url: null },
  { id: 'italic', label: "Italic", project: null, src: a('italic.png'), w: 600, h: 312, color: '#16396f', url: 'https://anchovies.agency/work/italic' },
  { id: 'koplow', label: "Koplow", project: 'koplow', src: a('koplow.svg'), w: 156.75, h: 196.54, color: null, url: 'https://anchovies.agency/work/koplow' },
  { id: 'lattice', label: "Lattice", project: null, src: a('lattice.png'), w: 600, h: 577, color: null, url: null },
  { id: 'layers', label: "Layers", project: null, src: a('layers.png'), w: 473, h: 600, color: '#e0b944', url: 'https://anchovies.agency/work/layers' },
  { id: 'lex-politica', label: "Lex Politica", project: 'lex-politica', src: a('lex-politica.png'), w: 600, h: 577, color: null, url: 'https://anchovies.agency/work/lex-politica' },
  { id: 'lookout-tower', label: "Lookout Tower", project: null, src: a('lookout-tower.png'), w: 600, h: 555, color: null, url: 'https://anchovies.agency/work/lookout-tower' },
  { id: 'lost-dog', label: "Lost Dog", project: null, src: a('lost-dog.svg'), w: 140.54, h: 186.96, color: null, url: null },
  { id: 'marlowe-bennet', label: "Marlowe Bennet", project: null, src: a('marlowe-bennet.png'), w: 600, h: 35, color: null, url: 'https://anchovies.agency/work/marlowe-bennet' },
  { id: 'maven', label: "Maven", project: null, src: a('maven.png'), w: 600, h: 417, color: null, url: 'https://anchovies.agency/work/maven' },
  { id: 'middlemist', label: "Middlemist", project: null, src: a('middlemist.png'), w: 554, h: 600, color: null, url: null },
  { id: 'minerva', label: "Minerva", project: null, src: a('minerva.png'), w: 600, h: 391, color: null, url: null },
  { id: 'moat', label: "Moat", project: null, src: a('moat.png'), w: 600, h: 579, color: '#233cf0', url: 'https://anchovies.agency/work/moat' },
  { id: 'molly-engles', label: "Molly Engels", project: 'molly-engels', src: a('molly-engles.svg'), w: 224.91, h: 201.6, color: null, url: 'https://anchovies.agency/work/molly-engles' },
  { id: 'museum', label: "Museum", project: null, src: a('museum.png'), w: 542, h: 600, color: '#4c392b', url: 'https://anchovies.agency/work/museum' },
  { id: 'natural-habitat', label: "Natural Habitat", project: null, src: a('natural-habitat.png'), w: 493, h: 600, color: null, url: null },
  { id: 'no-walls', label: "No Walls", project: null, src: a('no-walls.png'), w: 600, h: 570, color: null, url: null },
  { id: 'notably', label: "Notably", project: 'notably', src: a('notably.png'), w: 593, h: 600, color: null, url: 'https://anchovies.agency/work/notably' },
  { id: 'nylo', label: "Nylo", project: null, src: a('nylo.png'), w: 600, h: 555, color: '#e9a1a5', url: 'https://anchovies.agency/work/nylo' },
  { id: 'nymph', label: "Nymph", project: null, src: a('nymph.png'), w: 600, h: 473, color: '#c43c38', url: 'https://anchovies.agency/work/nymph' },
  { id: 'odd-feather', label: "Odd Feather", project: null, src: a('odd-feather.png'), w: 559, h: 600, color: '#262b14', url: 'https://anchovies.agency/work/odd-feather' },
  { id: 'offmenu', label: "Off Menu", project: null, src: a('offmenu.svg'), w: 560.02, h: 293.71, color: '#d9322e', url: 'https://anchovies.agency/work/offmenu' },
  { id: 'osseocentric', label: "OsseoCentric", project: null, src: a('osseocentric.png'), w: 596, h: 600, color: null, url: null },
  { id: 'out-there', label: "Out There", project: null, src: a('out-there.png'), w: 600, h: 600, color: null, url: 'https://anchovies.agency/work/out-there' },
  { id: 'parachute', label: "Parachute", project: null, src: a('parachute.png'), w: 600, h: 327, color: null, url: null },
  { id: 'perlavi', label: "PerlaVi", project: null, src: a('perlavi.svg'), w: 74.14, h: 74.15, color: null, url: 'https://anchovies.agency/work/perlavi' },
  { id: 'pickleballers-next-door', label: "Pickleballers Next Door", project: null, src: a('pickleballers-next-door.png'), w: 600, h: 256, color: '#bc3726', url: 'https://anchovies.agency/work/pickleballers-next-door' },
  { id: 'placewise', label: "Placewise", project: null, src: a('placewise.png'), w: 600, h: 399, color: null, url: null },
  { id: 'portis', label: "Portis", project: null, src: a('portis.png'), w: 344, h: 600, color: null, url: null },
  { id: 'remastered', label: "Remastered", project: null, src: a('remastered.png'), w: 600, h: 303, color: null, url: null },
  { id: 'remingo', label: "Remingo", project: null, src: a('remingo.png'), w: 409, h: 600, color: null, url: null },
  { id: 'renaissance-homes', label: "Renaissance Homes", project: null, src: a('renaissance-homes.svg'), w: 1715.88, h: 1441.81, color: null, url: null },
  { id: 'revolve-ride', label: "Revolve Ride", project: null, src: a('revolve-ride.png'), w: 600, h: 583, color: null, url: null },
  { id: 'rhythm', label: "Rhythm", project: null, src: a('rhythm.png'), w: 600, h: 600, color: '#6f68e9', url: 'https://anchovies.agency/work/rhythm' },
  { id: 'roman-kandle', label: "Roman Kandle", project: null, src: a('roman-kandle.png'), w: 600, h: 575, color: null, url: null },
  { id: 'runway', label: "Runway", project: 'runway', src: a('runway.svg'), w: 416.18, h: 321.06, color: '#1463e2', url: 'https://anchovies.agency/work/runway' },
  { id: 's-w', label: "S&W", project: null, src: a('s-w.png'), w: 383, h: 600, color: null, url: 'https://anchovies.agency/work/s-w' },
  { id: 'safavi', label: "Safavi", project: null, src: a('safavi.png'), w: 600, h: 600, color: null, url: null },
  { id: 'sage', label: "Sage", project: null, src: a('sage.png'), w: 600, h: 199, color: null, url: 'https://anchovies.agency/work/sage' },
  { id: 'seed', label: "Seed", project: null, src: a('seed.png'), w: 600, h: 276, color: null, url: 'https://anchovies.agency/work/seed' },
  { id: 'smell-the-roses', label: "Smell The Roses", project: null, src: a('smell-the-roses.svg'), w: 337.59, h: 315.9, color: null, url: null },
  { id: 'soft', label: "Soft", project: null, src: a('soft.png'), w: 600, h: 308, color: null, url: 'https://anchovies.agency/work/soft' },
  { id: 'soft-hours', label: "Soft Hours", project: 'soft-hours', src: a('soft-hours.svg'), w: 103.37, h: 103.38, color: null, url: 'https://anchovies.agency/work/soft-hours' },
  { id: 'tagawa', label: "Tagawa", project: 'tagawa', src: a('tagawa.svg'), w: 351.97, h: 690.98, color: '#224526', url: 'https://anchovies.agency/work/tagawa' },
  { id: 'the-inn', label: "The Inn", project: null, src: a('the-inn.png'), w: 600, h: 535, color: null, url: null },
  { id: 'the-passenger', label: "The Passenger", project: null, src: a('the-passenger.png'), w: 600, h: 344, color: '#2d3945', url: 'https://anchovies.agency/work/the-passenger' },
  { id: 'the-work', label: "The Work", project: null, src: a('the-work.png'), w: 442, h: 330, color: null, url: 'https://anchovies.agency/work/the-work' },
  { id: 'thrive', label: "Thrive", project: null, src: a('thrive.png'), w: 538, h: 600, color: null, url: null },
  { id: 'trek', label: "Trek", project: null, src: a('trek.png'), w: 597, h: 600, color: '#a74f27', url: 'https://anchovies.agency/work/trek' },
  { id: 'umami', label: "Umami", project: null, src: a('umami.svg'), w: 793.0, h: 756.9, color: null, url: null },
  { id: 'unibell', label: "Unibell", project: null, src: a('unibell.png'), w: 600, h: 317, color: null, url: null },
  { id: 'vantage', label: "Vantage", project: null, src: a('vantage.png'), w: 600, h: 599, color: null, url: 'https://anchovies.agency/work/vantage' },
  { id: 'viridian', label: "Viridian", project: null, src: a('viridian.png'), w: 600, h: 599, color: null, url: null },
  { id: 'visible', label: "Visible", project: null, src: a('visible.png'), w: 600, h: 600, color: null, url: null },
  { id: 'weather-pattern', label: "Weather Pattern", project: null, src: a('weather-pattern.png'), w: 600, h: 585, color: null, url: null },
  { id: 'wild-hare', label: "Wild Hare", project: null, src: a('wild-hare.png'), w: 473, h: 600, color: '#f5adb8', url: 'https://anchovies.agency/work/wild-hare' },
  { id: 'within', label: "Within", project: null, src: a('within.png'), w: 600, h: 362, color: null, url: 'https://anchovies.agency/work/within' },
]

/*
 * The order the brands appear on anchovies.agency/work (retrieved 2026-09-30):
 * newest first, with the brands that have no finished case study toward the end.
 * The fridge hangs them in this order, top to bottom.
 */
export const workOrder = [
  'lex-politica', 'tagawa', 'soft-hours', 'molly-engles', 'arc88', 'runway', 'garza', 'heartwood',
  'notably', 'freddie', 'koplow', 'offmenu', 'perlavi', 'avodah', '206', 'seed',
  'duo', 'adlib', 'rhythm', 'out-there', 'wild-hare', 'moat', 'nymph', 'within',
  's-w', 'soft', 'lookout-tower', 'belzer-law', 'donna-beth', 'pickleballers-next-door', 'sage', 'trek',
  'hometown', 'maven', 'blanchet', 'odd-feather', 'nylo', 'marlowe-bennet', 'museum', 'vantage',
  'the-passenger', 'italic', 'the-work', 'green-nomad', 'umami', 'layers', 'good-measure', 'renaissance-homes',
  'day-one', 'thrive', 'safavi', 'roman-kandle', 'remastered', 'no-walls', 'gober-group', 'copper-coyote',
  'aliana', 'smell-the-roses', 'remingo', '30-60-90', 'weather-pattern', 'visible', 'lost-dog', 'viridian',
  'unibell', 'the-inn', 'revolve-ride', 'portis', 'placewise', 'parachute', 'osseocentric', 'natural-habitat',
  'middlemist', 'minerva', 'lattice', 'inbank', 'humanly', 'good-days-bad-days', 'gober', 'frank-devincent',
  'constellation', 'ceremony', 'antidote', 'agate',
]

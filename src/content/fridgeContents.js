/*
 * What's inside the fridge: a playful homage to a handful of Anchovies clients,
 * printed on generic packaging. Nothing here is a real product, and the packs
 * make no claims: each shows the client's mark, wordmark or name, in its brand
 * colour, and a plain product word.
 *
 *   brand  a magnet id from magnets.js (its mark, colour, label and links)
 *   kind   which pack to draw (see Pack in Fridge.jsx)
 *   word   the generic product word printed on the pack
 *   print  how the brand appears: 'mark' (default), 'wordmark' (the brand's
 *          panel from anchovies.agency/work, see WORDMARKS) or 'name' (set in type)
 *   fill   (jars, soup) what's inside
 *   tone   (unbranded bottles) the glass
 *
 * Items without a `brand` are unbranded set dressing: drawn, but not clickable.
 * Shelves run top to bottom; each shelf's items stand left to right.
 */

// Wordmark panels in public/assets/magnets/*.webp that read cleanly as a printed
// label (flat brand-colour grounds). Left out: heartwood and sage (photographic
// grounds), arc88 and molly-engles (grey / striped grounds that look like mistakes on a pack).
// Each with its panel's ground colour, so a pack can run the panel into a band of the same colour.
const WORDMARKS = {
  garza: '#2f1c14', runway: '#cfdcee', tagawa: '#224525', 'soft-hours': '#1e1c16', 'lex-politica': '#000000',
  'wild-hare': '#f5adb8', 'green-nomad': '#d6e3c8', offmenu: '#c6686f', layers: '#e1b945', hometown: '#f77c00',
  notably: '#fcfbf4', freddie: '#471e13', duo: '#f4991a', nylo: '#e8a1a7', moat: '#233cf1', seed: '#313836',
  italic: '#16386f', trek: '#a84f27', 'odd-feather': '#f3f3d8',
}
export const wordmarkGround = (id) => WORDMARKS[id] ?? null
export const wordmarkOf = (id) => (id in WORDMARKS ? `${import.meta.env.BASE_URL}assets/magnets/${id}.webp` : null)

export const fridgeContents = {
  freezer: {
    shelves: [
      [
        { brand: 'soft-hours', kind: 'pint', word: 'Ice Cream' },
        { brand: 'wild-hare', kind: 'pint', word: 'Ice Cream', print: 'wordmark' },
        { kind: 'ice-tray' }, // a tray, not a product
      ],
      [
        { brand: 'garza', kind: 'pizza', word: 'Frozen Pizza', print: 'wordmark' },
        { brand: 'green-nomad', kind: 'peas', word: 'Garden Peas', print: 'name' },
        { brand: 'trek', kind: 'freezer-bag', word: 'Berries', print: 'name' },
      ],
    ],
    // Bins on the inside of the door, top to bottom.
    door: [
      [
        { brand: 'arc88', kind: 'pops', word: 'Ice Pops' },
        { brand: 'duo', kind: 'dumplings', word: 'Dumplings', print: 'wordmark' },
      ],
    ],
  },
  fridge: {
    shelves: [
      [
        { brand: 'runway', kind: 'milk', word: 'Milk', print: 'wordmark' },
        { brand: 'molly-engles', kind: 'juice', word: 'Orange Juice' },
        { brand: 'sage', kind: 'soup', word: 'Spinach Soup', fill: '#5d7a2e' },
      ],
      [
        { brand: 'odd-feather', kind: 'eggs', word: 'Eggs', print: 'wordmark' },
        { brand: 'freddie', kind: 'cheese', word: 'Cheese', print: 'wordmark' },
        { brand: 'offmenu', kind: 'takeout', word: 'Takeout', print: 'wordmark' },
      ],
      [
        // Lex Politica is pure black and white: black jam, a white label, the black wordmark band.
        { brand: 'lex-politica', kind: 'jar', word: 'Black Jam', fill: '#141013', lid: 'black', print: 'wordmark' },
        { brand: 'italic', kind: 'yogurt', word: 'Yogurt', print: 'wordmark' },
        { brand: 'tagawa', kind: 'pickles', word: 'Pickles', print: 'wordmark' },
      ],
    ],
    // The two crisper drawers.
    produce: [
      ['lettuce', 'carrots'],
      ['lemons', 'apples'],
    ],
    door: [
      [
        { brand: 'layers', kind: 'butter', word: 'Butter', print: 'wordmark' },
        { brand: 'seed', kind: 'mustard', word: 'Mustard', print: 'wordmark' },
      ],
      [
        { brand: 'moat', kind: 'sparkling', word: 'Sparkling Water', print: 'wordmark' },
        { brand: 'hometown', kind: 'sauce', word: 'Hot Sauce', print: 'wordmark' },
      ],
      [
        { brand: 'notably', kind: 'lemonade', word: 'Lemonade', print: 'wordmark' },
        { brand: 'nylo', kind: 'kombucha', word: 'Kombucha', print: 'wordmark' },
      ],
    ],
  },
}

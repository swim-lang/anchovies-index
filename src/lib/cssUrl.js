/*
 * A CSS url() for an asset, made absolute. Asset paths are relative ('./assets/…',
 * from base: './'), and a url() handed to CSS through a custom property (--mark,
 * --sheet-src) is resolved against the *stylesheet* that uses it — which in the
 * build lives in /assets/ — so relative paths break there. Absolute ones don't.
 */
export const cssUrl = (src) => `url("${new URL(src, document.baseURI).href}")`

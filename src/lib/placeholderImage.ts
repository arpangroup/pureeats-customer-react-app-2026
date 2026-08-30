/**
 * Generates a small inline SVG data-URI as a stand-in "photo" for demo
 * restaurants/dishes — keeps mock mode 100% self-contained (no external
 * image host to fail to load, no network dependency at all).
 */
export function placeholderImage(emoji: string, from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${from}"/>
        <stop offset="100%" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#g)"/>
    <text x="200" y="175" font-size="110" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

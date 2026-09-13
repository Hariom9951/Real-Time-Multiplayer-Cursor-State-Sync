// ─── User Color Palette ────────────────────────────────────────────────────────
// A curated set of vivid, accessible colors for cursor/avatar identification

const USER_COLORS: string[] = [
  '#6EE7B7', // emerald
  '#93C5FD', // blue
  '#F9A8D4', // pink
  '#FCD34D', // amber
  '#A78BFA', // violet
  '#34D399', // green
  '#FB923C', // orange
  '#38BDF8', // sky
  '#F472B6', // rose
  '#4ADE80', // lime
  '#C084FC', // purple
  '#FB7185', // red
];

/**
 * Returns a deterministic color for a given user ID.
 */
export function getColorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

/**
 * Generates a random color from the palette.
 */
export function getRandomColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

/**
 * Returns a hex color with reduced opacity as rgba.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

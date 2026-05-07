// Paleta suave estilo protótipo — cores warm para avatares
const AVATAR_COLORS = [
  '#A8C5F5', // azul claro
  '#B5D8C8', // verde menta
  '#F5C5A8', // pêssego
  '#D4B5F5', // lavanda
  '#F5D9A8', // âmbar claro
  '#A8E0E8', // ciano claro
  '#E8B5C5', // rosa
  '#C5D8A8', // verde oliva claro
];

export function colorForName(name: string | null | undefined): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initialsOf(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last  = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

// Solo se usa al compilar (o en `npm run dev`): lista las imágenes de public/projects/
// para que el panel las muestre como galería. No necesita Firebase Storage.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const IMAGE_EXT = /\.(webp|png|jpe?g|avif)$/i;

export function projectImages() {
  try {
    return readdirSync(join(process.cwd(), 'public', 'projects'))
      .filter((name) => IMAGE_EXT.test(name))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ name, src: `/projects/${encodeURIComponent(name)}` }));
  } catch {
    return [];
  }
}

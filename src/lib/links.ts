import type { SiteSettings } from './types';

export const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');

export function whatsappUrl(number: string, text?: string) {
  const base = `https://wa.me/${onlyDigits(number)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function formatPhone(number: string) {
  const d = onlyDigits(number);
  if (d.startsWith('57') && d.length === 12) {
    return `+57 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  }
  return `+${d}`;
}

/** Acepta un usuario o una URL completa y devuelve una URL segura (https). */
export function socialUrl(kind: 'instagram' | 'linkedin' | 'github', value?: string) {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^https:\/\//i.test(v)) return v;
  if (/^http:\/\//i.test(v)) return v.replace(/^http:/i, 'https:');
  const handle = v.replace(/^@/, '');
  const bases = {
    instagram: 'https://instagram.com/',
    linkedin: 'https://www.linkedin.com/in/',
    github: 'https://github.com/',
  } as const;
  return bases[kind] + encodeURIComponent(handle);
}

export function safeHttpsUrl(value?: string) {
  const v = (value || '').trim();
  if (!v) return '';
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : '';
  } catch {
    return '';
  }
}

export function contactLinks(s: SiteSettings) {
  return [
    { key: 'whatsapp', label: 'WhatsApp', href: whatsappUrl(s.whatsapp), detail: formatPhone(s.whatsapp) },
    { key: 'instagram', label: 'Instagram', href: socialUrl('instagram', s.instagram), detail: '' },
    { key: 'linkedin', label: 'LinkedIn', href: socialUrl('linkedin', s.linkedin), detail: '' },
    { key: 'github', label: 'GitHub', href: socialUrl('github', s.github), detail: '' },
    { key: 'email', label: 'Correo', href: emailUrl(s.email), detail: emailUrl(s.email) ? s.email!.trim() : '' },
  ].filter((l) => l.href);
}

function emailUrl(value?: string) {
  const v = (value || '').trim();
  return /^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(v) ? `mailto:${v}` : '';
}

/** Imagen de un proyecto: archivo de public/projects/ o una URL https. */
export function safeImageUrl(value?: string) {
  const v = (value || '').trim();
  if (/^\/projects\/[\w.%-]+\.(webp|png|jpe?g|avif)$/i.test(v)) return v;
  return safeHttpsUrl(v);
}

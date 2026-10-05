import type { Project, SiteSettings } from './types';

// Contenido inicial. Se muestra mientras carga Firestore o si aún no hay datos,
// y el panel permite importarlo con un clic.
export const defaultSettings: SiteSettings = {
  whatsapp: '573225276020',
  instagram: '',
  linkedin: '',
  github: '',
  email: '',
};

export const defaultProjects: Project[] = [
  {
    title: 'Barber Creiizii Shop',
    client: 'Barbería',
    summary:
      'Sitio de reservas y panel administrativo para una barbería. Los clientes eligen barbero, servicio, fecha y productos en un flujo de cinco pasos; el equipo gestiona la agenda desde un panel privado.',
    stack: ['Vue 3', 'TypeScript', 'Tailwind CSS', 'Firebase'],
    year: '2026',
    url: '',
    repo: '',
    imageUrl: '',
    published: true,
    order: 1,
  },
];

// Lee el contenido real de Firestore al compilar, para que el HTML que ven Google y las redes
// sociales ya traiga los proyectos y los datos de contacto. Si falla, usa el contenido inicial.
// En el navegador, public.ts vuelve a consultar Firestore y muestra los cambios hechos después.
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from 'firebase/firestore/lite';
import { firebaseApp, isFirebaseConfigured } from './firebase';
import { defaultProjects, defaultSettings } from './defaults';
import type { Project, SiteSettings } from './types';

const TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado')), TIMEOUT_MS)),
  ]);
}

export async function loadSiteContent(): Promise<{ settings: SiteSettings; projects: Project[] }> {
  const fallback = {
    settings: defaultSettings,
    projects: defaultProjects.filter((p) => p.published).sort((a, b) => a.order - b.order),
  };
  if (!isFirebaseConfigured) return fallback;

  try {
    const db = getFirestore(firebaseApp());
    const [settingsSnap, projectsSnap] = await withTimeout(
      Promise.all([
        getDoc(doc(db, 'settings', 'site')),
        getDocs(query(collection(db, 'projects'), where('published', '==', true))),
      ]),
    );
    const projects = projectsSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Project) }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return {
      settings: settingsSnap.exists() ? { ...defaultSettings, ...(settingsSnap.data() as SiteSettings) } : defaultSettings,
      projects: projects.length ? projects : fallback.projects,
    };
  } catch (err) {
    console.warn('[content] No se pudo leer Firestore al compilar; se usa el contenido inicial.', err);
    return fallback;
  }
}

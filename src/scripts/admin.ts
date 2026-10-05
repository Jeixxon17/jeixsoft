import {
  browserSessionPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore/lite';
import { adminEmail, adminUid, firebaseApp, isFirebaseConfigured } from '../lib/firebase';
import { defaultProjects, defaultSettings } from '../lib/defaults';
import { onlyDigits, safeHttpsUrl, safeImageUrl } from '../lib/links';
import type { Project, SiteSettings } from '../lib/types';
import { ui } from '../lib/ui';

const IDLE_LIMIT_MS = 30 * 60 * 1000;

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const pinView = $('[data-pin-view]');
const pinForm = $<HTMLFormElement>('[data-pin-form]');
const pinInput = $<HTMLInputElement>('#pin');
const pinError = $('[data-pin-error]');
const pinSubmit = $<HTMLButtonElement>('[data-pin-submit]');
const adminView = $('[data-admin]');
const projectList = $('[data-project-list]');
const settingsForm = $<HTMLFormElement>('[data-settings-form]');
const editor = $<HTMLDialogElement>('[data-editor]');
const projectForm = $<HTMLFormElement>('[data-project-form]');
const editorTitle = $('[data-editor-title]');
const editorError = $('[data-editor-error]');
const editorSave = $<HTMLButtonElement>('[data-editor-save]');
const gallery = document.querySelector<HTMLElement>('[data-gallery]');
const galleryEmpty = $('[data-gallery-empty]');
const galleryItems = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-gallery-item]'));
const imagePreview = $('[data-image-preview]');
const imageRemove = $<HTMLButtonElement>('[data-image-remove]');
const summaryCount = $('[data-summary-count]');
const toastBox = $('[data-toast]');

/* ---------- Utilidades de interfaz ---------- */

let toastTimer = 0;
function toast(message: string, isError = false) {
  toastBox.textContent = message;
  toastBox.classList.toggle(ui.admin.toastError, isError);
  toastBox.classList.toggle(ui.admin.toastOk, !isError);
  toastBox.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toastBox.hidden = true), 3500);
}

function showError(box: HTMLElement, message: string) {
  box.textContent = message;
  box.hidden = !message;
}

// Muestra en la consola por qué falló una escritura (para comparar el UID con el de las reglas).
function writeErrorCode(action: string, err: unknown) {
  const code = (err as { code?: string }).code || 'desconocido';
  console.error(`[${action}] ${code}`, {
    usuarioActual: auth.currentUser?.uid ?? '(sin sesión)',
    uidEnEnv: adminUid,
    error: err,
  });
  return code;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

if (!isFirebaseConfigured || !adminEmail || !adminUid) {
  showError(pinError, 'Falta la configuración de Firebase o del administrador. Revisa el archivo .env.');
  pinSubmit.disabled = true;
  pinView.hidden = false;
  throw new Error('Firebase no está configurado');
}

const app = firebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);

/* ---------- Sesión ---------- */

const sessionReady = setPersistence(auth, browserSessionPersistence);

pinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pin = pinInput.value.trim();
  pinInput.value = '';
  if (!/^[0-9]{6,12}$/.test(pin)) {
    showError(pinError, 'El PIN debe tener entre 6 y 12 dígitos.');
    pinInput.focus();
    return;
  }
  showError(pinError, '');
  pinSubmit.disabled = true;
  pinSubmit.textContent = 'Verificando...';
  try {
    await sessionReady;
    await signInWithEmailAndPassword(auth, adminEmail, pin);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code || '';
    if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(code))
      showError(pinError, 'PIN incorrecto.');
    else if (code === 'auth/too-many-requests')
      showError(pinError, 'Demasiados intentos. Espera unos minutos e intenta de nuevo.');
    else if (code === 'auth/operation-not-allowed')
      showError(pinError, 'Activa el proveedor Correo/contraseña en Firebase Authentication.');
    else showError(pinError, 'No se pudo verificar el PIN. Revisa tu conexión e intenta de nuevo.');
    pinInput.focus();
  } finally {
    pinSubmit.disabled = false;
    pinSubmit.textContent = 'Entrar';
  }
});

$('[data-logout]').addEventListener('click', () => signOut(auth));

let idleTimer = 0;
function resetIdle() {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    signOut(auth);
    toast('La sesión se cerró por inactividad.');
  }, IDLE_LIMIT_MS);
}
['pointerdown', 'keydown', 'scroll'].forEach((evt) =>
  window.addEventListener(evt, () => auth.currentUser && resetIdle(), { passive: true }),
);

onAuthStateChanged(auth, (user) => {
  const isAdmin = user?.uid === adminUid;
  if (user && !isAdmin) {
    signOut(auth);
    return;
  }
  pinView.hidden = isAdmin;
  adminView.hidden = !isAdmin;
  if (isAdmin) {
    resetIdle();
    loadProjects();
    loadSettings();
  } else {
    window.clearTimeout(idleTimer);
    if (editor.open) editor.close();
    projects = [];
    pinInput.focus();
  }
});

/* ---------- Pestañas ---------- */

const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tab]'));
function selectTab(tab: HTMLButtonElement) {
  tabs.forEach((t) => {
    const active = t === tab;
    t.setAttribute('aria-selected', String(active));
    t.tabIndex = active ? 0 : -1;
    $(`[data-panel="${t.dataset.tab}"]`).hidden = !active;
  });
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    selectTab(next);
    next.focus();
  });
});

/* ---------- Ajustes de contacto ---------- */

async function loadSettings() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'site'));
    const data: SiteSettings = { ...defaultSettings, ...(snap.exists() ? (snap.data() as SiteSettings) : {}) };
    (['whatsapp', 'instagram', 'linkedin', 'github', 'email'] as const).forEach((key) => {
      (settingsForm.elements.namedItem(key) as HTMLInputElement).value = data[key] || '';
    });
  } catch {
    toast('No se pudieron cargar los datos de contacto.', true);
  }
}

settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(settingsForm);
  const whatsapp = onlyDigits(String(f.get('whatsapp') || ''));
  const waInput = settingsForm.elements.namedItem('whatsapp') as HTMLInputElement;
  if (whatsapp.length < 8 || whatsapp.length > 15) {
    waInput.setAttribute('aria-invalid', 'true');
    waInput.focus();
    toast('Escribe el número de WhatsApp con código de país, entre 8 y 15 dígitos.', true);
    return;
  }
  waInput.setAttribute('aria-invalid', 'false');
  const email = String(f.get('email') || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast('El correo no tiene un formato válido.', true);
    return;
  }
  const button = settingsForm.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  button.disabled = true;
  try {
    await setDoc(doc(db, 'settings', 'site'), {
      whatsapp,
      instagram: String(f.get('instagram') || '').trim(),
      linkedin: String(f.get('linkedin') || '').trim(),
      github: String(f.get('github') || '').trim(),
      email,
      updatedAt: serverTimestamp(),
    });
    waInput.value = whatsapp;
    toast('Cambios guardados.');
  } catch {
    toast('No se pudieron guardar los cambios. Vuelve a entrar e intenta de nuevo.', true);
  } finally {
    button.disabled = false;
  }
});

/* ---------- Proyectos ---------- */

let projects: Project[] = [];

async function loadProjects() {
  try {
    const snap = await getDocs(collection(db, 'projects'));
    projects = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Project) }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    renderProjectList();
  } catch {
    projectList.replaceChildren(el('p', ui.error, 'No se pudieron cargar los proyectos.'));
  }
}

function renderProjectList() {
  if (!projects.length) {
    const empty = el('div', ui.admin.emptyState);
    empty.append(
      el('p', undefined, 'Aún no hay proyectos guardados. El sitio muestra el proyecto inicial mientras tanto.'),
    );
    const importBtn = el('button', ui.btnGhost, 'Importar proyecto inicial');
    importBtn.type = 'button';
    importBtn.addEventListener('click', importDefaults);
    empty.append(importBtn);
    projectList.replaceChildren(empty);
    return;
  }

  projectList.replaceChildren(
    ...projects.map((p) => {
      const row = el('div', ui.admin.row);
      const thumb = el('div', ui.admin.thumb);
      const imageUrl = safeImageUrl(p.imageUrl);
      if (imageUrl) {
        const img = el('img');
        img.src = imageUrl;
        img.alt = '';
        thumb.append(img);
      }
      const info = el('div');
      info.append(el('h3', ui.admin.rowTitle, p.title));
      const status = el('p', ui.admin.rowStatus);
      status.append(
        el('span', p.published ? '' : ui.admin.draft, p.published ? 'Publicado' : 'Oculto'),
        document.createTextNode(`, orden ${p.order}`),
      );
      info.append(status);

      const actions = el('div', ui.admin.rowActions);
      const edit = el('button', ui.linkButton, 'Editar');
      edit.type = 'button';
      edit.addEventListener('click', () => openEditor(p));
      const del = el('button', ui.linkButtonDanger, 'Eliminar');
      del.type = 'button';
      del.addEventListener('click', () => removeProject(p));
      actions.append(edit, del);

      row.append(thumb, info, actions);
      return row;
    }),
  );
}

async function importDefaults() {
  try {
    for (const p of defaultProjects) {
      const id = doc(collection(db, 'projects')).id;
      await setDoc(doc(db, 'projects', id), {
        ...p,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    toast('Proyecto inicial importado.');
    loadProjects();
  } catch (err) {
    toast(`No se pudo importar el proyecto (${writeErrorCode('importar', err)}).`, true);
  }
}

async function removeProject(p: Project) {
  if (!p.id) return;
  if (!window.confirm(`¿Eliminar "${p.title}"? Esta acción no se puede deshacer.`)) return;
  try {
    await deleteDoc(doc(db, 'projects', p.id));
    toast('Proyecto eliminado.');
    loadProjects();
  } catch {
    toast('No se pudo eliminar el proyecto.', true);
  }
}

/* ---------- Editor ---------- */

let editing: Project | null = null;
// Imagen elegida: una de public/projects/ (galería) o un enlace https.
let selectedImage = '';

function setPreview(src: string) {
  if (src) {
    const img = el('img');
    img.src = src;
    img.alt = 'Vista previa';
    imagePreview.replaceChildren(img);
    imageRemove.hidden = false;
  } else {
    imagePreview.replaceChildren(el('span', undefined, 'Sin imagen'));
    imageRemove.hidden = true;
  }
}

function selectImage(src: string) {
  selectedImage = src;
  galleryItems.forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.src === src)));
  setPreview(safeImageUrl(src));
}

// Oculta de la galería las imágenes que ya usa otro proyecto (cada imagen es de un solo proyecto).
function filterGallery(current?: Project) {
  const used = new Set(projects.filter((x) => x.id !== current?.id).map((x) => x.imageUrl).filter(Boolean));
  let visible = 0;
  galleryItems.forEach((item) => {
    item.hidden = used.has(item.dataset.src || '');
    if (!item.hidden) visible++;
  });
  if (gallery) gallery.hidden = visible === 0;
  galleryEmpty.hidden = !gallery || visible > 0;
}

function field(name: string) {
  return projectForm.elements.namedItem(name) as HTMLInputElement;
}

function openEditor(p?: Project) {
  editing = p || null;
  projectForm.reset();
  showError(editorError, '');
  editorTitle.textContent = p ? 'Editar proyecto' : 'Nuevo proyecto';
  editorSave.textContent = p ? 'Guardar cambios' : 'Guardar proyecto';

  const nextOrder = projects.length ? Math.max(...projects.map((x) => x.order ?? 0)) + 1 : 1;
  field('title').value = p?.title || '';
  field('client').value = p?.client || '';
  field('year').value = p?.year || String(new Date().getFullYear());
  field('summary').value = p?.summary || '';
  field('stack').value = (p?.stack || []).join(', ');
  field('url').value = p?.url || '';
  field('repo').value = p?.repo || '';
  const image = p?.imageUrl || '';
  field('imageUrl').value = image.startsWith('/projects/') ? '' : image;
  field('order').value = String(p?.order ?? nextOrder);
  field('published').checked = p ? p.published : true;
  summaryCount.textContent = `${field('summary').value.length} / 600`;
  filterGallery(p);
  selectImage(image);
  editor.showModal();
  field('title').focus();
}

$('[data-new-project]').addEventListener('click', () => openEditor());
$('[data-editor-close]').addEventListener('click', () => editor.close());
editor.addEventListener('close', () => setPreview(''));

field('summary').addEventListener('input', () => {
  summaryCount.textContent = `${field('summary').value.length} / 600`;
});

galleryItems.forEach((item) =>
  item.addEventListener('click', () => {
    field('imageUrl').value = '';
    showError(editorError, '');
    selectImage(item.dataset.src || '');
  }),
);

field('imageUrl').addEventListener('change', () => {
  const link = safeHttpsUrl(field('imageUrl').value.trim());
  if (link) selectImage(link);
});

imageRemove.addEventListener('click', () => {
  field('imageUrl').value = '';
  selectImage('');
});

projectForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = field('title').value.trim();
  const summary = field('summary').value.trim();
  const stack = field('stack')
    .value.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  const url = field('url').value.trim();
  const repo = field('repo').value.trim();
  const order = Number.parseInt(field('order').value, 10);
  const imageLink = field('imageUrl').value.trim();

  if (!title) return showError(editorError, 'Escribe el nombre del proyecto.');
  if (!summary) return showError(editorError, 'Escribe una descripción.');
  if (url && !safeHttpsUrl(url)) return showError(editorError, 'El enlace al proyecto no es válido.');
  if (repo && !safeHttpsUrl(repo)) return showError(editorError, 'El enlace del repositorio no es válido.');
  if (imageLink && !safeHttpsUrl(imageLink)) return showError(editorError, 'El enlace de la imagen no es válido.');
  if (Number.isNaN(order)) return showError(editorError, 'El orden debe ser un número.');
  showError(editorError, '');

  editorSave.disabled = true;
  editorSave.textContent = 'Guardando...';
  const id = editing?.id || doc(collection(db, 'projects')).id;
  const imageUrl = imageLink ? safeHttpsUrl(imageLink) : safeImageUrl(selectedImage);

  try {
    const data = {
      title,
      client: field('client').value.trim(),
      summary,
      stack,
      year: field('year').value.trim(),
      url: url ? safeHttpsUrl(url) : '',
      repo: repo ? safeHttpsUrl(repo) : '',
      imageUrl,
      imagePath: '',
      published: field('published').checked,
      order,
      updatedAt: serverTimestamp(),
    };

    if (editing?.id) {
      await setDoc(doc(db, 'projects', id), data, { merge: true });
    } else {
      await setDoc(doc(db, 'projects', id), { ...data, createdAt: serverTimestamp() });
    }

    editor.close();
    toast(editing ? 'Proyecto actualizado.' : 'Proyecto guardado.');
    loadProjects();
  } catch (err) {
    const code = writeErrorCode('guardar proyecto', err);
    showError(editorError, `No se pudo guardar el proyecto (${code}). Abre la consola del navegador (F12) para ver el detalle.`);
  } finally {
    editorSave.disabled = false;
    editorSave.textContent = editing ? 'Guardar cambios' : 'Guardar proyecto';
  }
});

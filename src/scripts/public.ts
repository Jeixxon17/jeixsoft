import { collection, doc, getDoc, getDocs, getFirestore, query, where } from 'firebase/firestore/lite';
import { firebaseApp, isFirebaseConfigured } from '../lib/firebase';
import { defaultSettings } from '../lib/defaults';
import { contactLinks, safeHttpsUrl, safeImageUrl, whatsappUrl } from '../lib/links';
import type { Project, SiteSettings } from '../lib/types';
import { ui } from '../lib/ui';
import { iconSvg } from '../lib/icons';

let settings: SiteSettings = { ...defaultSettings };

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function externalLink(href: string, text: string, className?: string) {
  const a = el('a', className, text);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}

function renderProject(p: Project) {
  const c = ui.project;
  const article = el('article', c.article);

  const media = el('div', c.media);
  const imageUrl = safeImageUrl(p.imageUrl);
  if (imageUrl) {
    const img = el('img', c.img);
    img.src = imageUrl;
    img.alt = `Captura de ${p.title}`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 1600;
    img.height = 1000;
    media.append(img);
  } else {
    const ph = el('div', c.placeholder);
    ph.setAttribute('aria-hidden', 'true');
    ph.append(el('span', c.placeholderText, p.title));
    media.append(ph);
  }

  const body = el('div');
  const meta = [p.client, p.year].filter(Boolean).join(', ');
  if (meta) body.append(el('p', c.meta, meta));
  body.append(el('h3', c.title, p.title));
  body.append(el('p', c.summary, p.summary));

  if (p.stack?.length) {
    const stack = el('p', c.stack);
    stack.append(el('span', 'sr-only', 'Tecnologías: '), document.createTextNode(p.stack.join(', ')));
    body.append(stack);
  }

  const url = safeHttpsUrl(p.url);
  const repo = safeHttpsUrl(p.repo);
  if (url || repo) {
    const links = el('div', c.links);
    if (url) links.append(externalLink(url, 'Ver proyecto', c.link));
    if (repo) links.append(externalLink(repo, 'Ver código', c.link));
    body.append(links);
  }

  article.append(media, body);
  return article;
}

function renderProjects(projects: Project[]) {
  const container = document.querySelector<HTMLElement>('[data-projects]');
  if (!container) return;
  if (!projects.length) return; // se conserva el contenido inicial
  container.replaceChildren(...projects.map(renderProject));
}

function renderSettings(s: SiteSettings) {
  const links = contactLinks(s);

  document.querySelectorAll<HTMLAnchorElement>('[data-wa-link]').forEach((a) => {
    a.href = whatsappUrl(s.whatsapp);
  });

  const contactList = document.querySelector('[data-contact-links]');
  if (contactList) {
    contactList.replaceChildren(
      ...links.map((l) => {
        const li = el('li');
        const a = externalLink(l.href, '', ui.contactLink);
        a.dataset.kind = l.key;
        const icon = el('span', ui.contactIcon);
        icon.innerHTML = iconSvg(l.key); // SVG fijo definido en icons.ts
        a.append(icon, el('span', ui.contactLabel, l.label));
        if (l.detail) a.append(el('span', ui.contactDetail, l.detail));
        a.insertAdjacentHTML('beforeend', iconSvg('arrow', ui.contactArrow));
        li.append(a);
        return li;
      }),
    );
  }

  const footerList = document.querySelector('[data-footer-links]');
  if (footerList) {
    footerList.replaceChildren(
      ...links.map((l) => {
        const li = el('li');
        const a = externalLink(l.href, '', ui.footerLink);
        a.insertAdjacentHTML('beforeend', iconSvg(l.key, ui.footerIcon));
        a.append(document.createTextNode(l.label));
        li.append(a);
        return li;
      }),
    );
  }
}

async function loadLiveData() {
  if (!isFirebaseConfigured) return;
  try {
    const db = getFirestore(firebaseApp());
    const [settingsSnap, projectsSnap] = await Promise.all([
      getDoc(doc(db, 'settings', 'site')),
      getDocs(query(collection(db, 'projects'), where('published', '==', true))),
    ]);

    if (settingsSnap.exists()) {
      settings = { ...defaultSettings, ...(settingsSnap.data() as SiteSettings) };
      renderSettings(settings);
    }

    const projects = projectsSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Project) }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    renderProjects(projects);
  } catch (err) {
    console.warn('No se pudo cargar el contenido actualizado.', err);
  }
}

function setupContactForm() {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  if (!form) return;
  const errorBox = form.querySelector<HTMLElement>('[data-form-error]')!;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const company = String(data.get('company') || '').trim();
    const type = String(data.get('type') || '').trim();
    const message = String(data.get('message') || '').trim();

    const fields: [string, string, string][] = [
      ['name', name, 'Escribe tu nombre.'],
      ['type', type, 'Elige qué necesitas.'],
      ['message', message, 'Escribe un mensaje corto sobre tu proyecto.'],
    ];
    let firstError = '';
    for (const [field, value, msg] of fields) {
      const input = form.elements.namedItem(field) as HTMLElement;
      input.setAttribute('aria-invalid', value ? 'false' : 'true');
      if (!value && !firstError) {
        firstError = msg;
        input.focus();
      }
    }
    if (firstError) {
      errorBox.textContent = firstError;
      errorBox.hidden = false;
      return;
    }
    errorBox.hidden = true;

    const text = [
      `Hola, soy ${name}${company ? ` de ${company}` : ''}.`,
      `Me interesa: ${type}.`,
      '',
      message,
    ].join('\n');

    window.open(whatsappUrl(settings.whatsapp, text), '_blank', 'noopener');
    form.reset();
  });
}

setupContactForm();
loadLiveData();

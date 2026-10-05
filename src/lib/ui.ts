// Clases de Tailwind compartidas entre las páginas .astro y los scripts que crean elementos.
// Breakpoints (escritorio primero, igual que el CSS original):
//   max-[961px] = tablet, max-[721px] = móvil, max-[641px] = panel móvil, max-[561px] = móvil pequeño.

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] font-body text-step-0 font-semibold leading-none no-underline cursor-pointer transition-colors duration-150 ease-in-out disabled:cursor-not-allowed disabled:opacity-55';
const btnSize = 'min-h-12 px-[1.4rem] py-3';
const inputBase =
  'w-full rounded-field border-[1.5px] border-line bg-surface text-ink transition-[border-color] duration-150 ease-in-out hover:border-line-strong focus:border-cobalt focus:outline-none aria-[invalid=true]:border-danger';
const linkButtonBase =
  'cursor-pointer bg-transparent px-0 py-1 font-body text-fine leading-[1.4] font-semibold underline underline-offset-4';

export const ui = {
  wrap: 'mx-auto w-full max-w-site px-gutter',
  adminWrap: 'mx-auto w-full max-w-admin px-gutter',

  btnPrimary: `${btnBase} ${btnSize} border-transparent bg-cobalt text-white hover:bg-cobalt-deep`,
  btnPrimarySmall: `${btnBase} min-h-[2.6rem] px-[1.1rem] py-[0.55rem] border-transparent bg-cobalt text-white hover:bg-cobalt-deep`,
  btnGhost: `${btnBase} ${btnSize} border-ink bg-transparent text-ink hover:bg-ink hover:text-paper`,
  linkButton: `${linkButtonBase} text-ink`,
  linkButtonDanger: `${linkButtonBase} text-danger`,

  field: 'grid gap-[0.4rem]',
  label: 'text-fine font-semibold',
  hint: 'text-fine text-ink-soft',
  input: `${inputBase} min-h-12 px-[0.85rem] py-3`,
  textarea: `${inputBase} min-h-32 resize-y px-[0.85rem] py-3`,
  error: 'text-fine text-danger',
  muted: 'text-ink-soft',

  section: 'py-[clamp(4rem,9vw,7rem)]',
  sectionHead: 'mb-[clamp(2rem,5vw,3.5rem)] flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3',
  sectionTitle: 'text-step-3',
  sectionText: 'max-w-[30rem] text-ink-soft',

  project: {
    article:
      'grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-center gap-[clamp(1.5rem,4vw,3.5rem)] max-[961px]:grid-cols-1',
    media: 'aspect-[16/10] overflow-hidden rounded-card border border-line bg-night',
    img: 'h-full w-full object-cover',
    placeholder:
      'flex h-full items-end bg-[linear-gradient(135deg,var(--color-cobalt-deep),var(--color-cobalt)_45%,var(--color-sky))] p-[clamp(1.25rem,3vw,2.25rem)] text-white',
    placeholderText:
      'max-w-[10ch] font-display text-[length:clamp(1.8rem,1rem_+_3.5vw,3.6rem)] leading-[0.98] font-bold tracking-[-0.035em]',
    meta: 'mb-2 text-fine text-ink-soft',
    title: 'text-step-2',
    summary: 'mt-4 max-w-[34rem] text-ink-soft',
    stack: 'mt-5 text-fine font-medium',
    links: 'mt-6 flex flex-wrap gap-6',
    link: 'font-semibold text-sky underline decoration-[1.5px] underline-offset-[5px] hover:text-white',
  },

  contactLink:
    'group flex items-center gap-4 border-b border-line py-3.5 font-semibold no-underline transition-colors hover:text-sky',
  contactIcon:
    'grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-sky transition-colors duration-200 group-hover:border-cobalt group-hover:bg-cobalt group-hover:text-white',
  contactLabel: 'flex-1',
  contactDetail: 'font-normal text-ink-soft max-[480px]:hidden',
  contactArrow:
    'size-4 shrink-0 text-ink-soft transition-[translate,color] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-sky',
  footerLink:
    'group inline-flex items-center gap-2.5 text-footer-text no-underline transition-colors duration-200 hover:text-white',
  footerIcon: 'size-4 shrink-0 text-footer-muted transition-colors duration-200 group-hover:text-sky',

  admin: {
    emptyState: 'grid justify-items-start gap-4 rounded-card border border-dashed border-line bg-surface p-8',
    row: 'grid grid-cols-[6rem_minmax(0,1fr)_auto] items-center gap-4 rounded-field border border-line bg-surface p-3 max-[641px]:grid-cols-[4.5rem_minmax(0,1fr)]',
    thumb: 'aspect-[16/10] overflow-hidden rounded-[4px] bg-[linear-gradient(135deg,var(--color-cobalt),var(--color-sky))] [&_img]:h-full [&_img]:w-full [&_img]:object-cover',
    rowTitle: 'font-body text-step-0 font-semibold tracking-normal',
    rowStatus: 'text-fine text-ink-soft',
    draft: 'text-danger',
    rowActions: 'flex gap-4 max-[641px]:col-span-full',
    toastOk: 'bg-cobalt-deep',
    toastError: 'bg-danger-strong',
  },
};

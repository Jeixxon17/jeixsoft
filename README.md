# JeiXSoft

Sitio de portafolio de la marca JeiXSoft con un panel privado para gestionar proyectos y datos de contacto.

- **Sitio público** (`/`): presentación, proyectos, proceso de trabajo y formulario que abre WhatsApp con el mensaje listo.
- **Panel** (`/admin`): acceso con PIN, crear/editar/ocultar/eliminar proyectos con imagen, y cambiar WhatsApp, Instagram, LinkedIn, GitHub y correo.

Stack: Astro (sitio estático), Tailwind CSS v4, Firebase Hosting, Firestore y Auth (sin Storage).

## Cómo funciona la seguridad del PIN

El PIN nunca está en el código, en el `.env` ni en el navegador.

1. El PIN es la contraseña de un único usuario de **Firebase Authentication** (correo/contraseña).
2. Firebase guarda solo su hash (scrypt) en sus servidores y lo compara al iniciar sesión.
3. Firebase Auth bloquea temporalmente los intentos repetidos (`auth/too-many-requests`).
4. Las reglas de Firestore solo permiten escribir al UID de ese usuario (`PUBLIC_ADMIN_UID`).
   Leer es público solo para proyectos publicados y la configuración de contacto.

Todo esto funciona en el plan gratuito Spark; no hace falta Cloud Functions.

La sesión dura solo mientras la pestaña esté abierta y se cierra sola tras 30 minutos sin actividad.

## Requisitos

- Node 22 o superior
- Firebase CLI: `npm i -g firebase-tools`

## Configuración paso a paso

### 1. Crear el proyecto en Firebase

En la consola de Firebase:

1. **Firestore Database**: crea la base de datos en modo producción.
2. **Authentication > Método de acceso**: activa **Correo electrónico/contraseña**.
3. **Authentication > Configuración > Acciones del usuario**: desactiva "Habilitar creación (registro)" y "Habilitar eliminación",
   y activa la protección contra enumeración de correos.
4. **Configuración del proyecto > Tus apps**: registra una app web y copia la configuración.

### 2. Crear el usuario administrador (el PIN)

En **Authentication > Usuarios > Agregar usuario**:

- Correo: el tuyo (o cualquiera que controles).
- Contraseña: tu PIN de 6 a 12 dígitos.

Copia el **UID** que aparece en la lista de usuarios.

Para cambiar el PIN más adelante, en la lista de usuarios usa el menú del usuario > "Restablecer contraseña"
o cambia la contraseña desde la consola. No hay que volver a desplegar nada.

### 3. Variables de entorno

```bash
cp .firebaserc.example .firebaserc
```

Llena `.env` con la configuración web, `PUBLIC_ADMIN_EMAIL` y `PUBLIC_ADMIN_UID`, y pon el ID del proyecto en `.firebaserc`.
Pon el mismo UID en `firestore.rules` (función `isAdmin`).

### 4. Instalar dependencias

```bash
npm install
```

### 5. Desplegar

```bash
firebase login
npm run deploy
```

Esto compila el sitio y despliega Hosting y las reglas de Firestore.
Sin CLI, también puedes copiar `firestore.rules` en Firebase Console > Firestore Database > Reglas y pulsar Publicar.

### Despliegue en Vercel (alternativa)

El sitio también funciona en Vercel. `vercel.json` activa las URLs limpias (`/admin` sirve `admin.html`) y las cabeceras de seguridad.

1. Importa el repositorio en Vercel (detecta Astro solo; la carpeta de salida es `dist`).
2. En **Settings > Environment Variables** agrega las mismas variables del `.env` (`PUBLIC_FIREBASE_*`, `PUBLIC_ADMIN_EMAIL`, `PUBLIC_ADMIN_UID`) y vuelve a desplegar.
3. Las reglas de Firestore se siguen publicando desde la consola de Firebase o con `firebase deploy --only firestore`.

Si cambias de dominio, actualiza `site` en `astro.config.mjs`.

### 7. Primer ingreso

1. Entra a `https://tu-dominio/admin` y escribe tu PIN.
2. En **Proyectos**, pulsa "Importar proyecto inicial" para cargar Barber Creiizii Shop y luego edítalo para agregarle imagen y enlace.
3. En **Contacto y redes**, confirma el WhatsApp y agrega tus usuarios de Instagram, LinkedIn y GitHub.

Mientras Firestore esté vacío, el sitio muestra el contenido de `src/lib/defaults.ts`.

## Desarrollo local

```bash
npm run dev
```

El sitio funciona en local leyendo Firestore real. El panel en local inicia sesión con el mismo usuario de Firebase Auth.

## Estructura

```
src/
  pages/index.astro       Sitio público
  pages/admin.astro       Panel
  scripts/public.ts       Carga de datos y formulario a WhatsApp
  scripts/admin.ts        Lógica del panel
  lib/defaults.ts         Contenido inicial
  styles/app.css          Tailwind y tokens de diseño (colores, tipografía, animaciones)
  lib/ui.ts               Clases de Tailwind compartidas (botones, campos, tarjetas)
firestore.rules           Reglas de base de datos
```

## SEO y redes sociales

- Al compilar, `src/lib/content.ts` lee los proyectos y los datos de contacto de Firestore, así el HTML que ven Google
  y las redes ya los incluye. En el navegador se vuelven a consultar para mostrar cambios hechos después.
  **Después de cambios importantes en el panel, vuelve a desplegar** (en Vercel: Deployments > Redeploy) para que
  Google y las vistas previas de enlaces los vean.
- `src/layouts/Base.astro`: título, descripción, URL canónica, Open Graph (WhatsApp, Facebook, LinkedIn) y X/Twitter.
- Datos estructurados (schema.org) en la página principal: la marca, su fundador, el sitio y la lista de proyectos.
- `/sitemap.xml` y `/robots.txt` se generan solos con el dominio de `site` en `astro.config.mjs`.
- `public/og.jpg` (1200×630) es la imagen que aparece al compartir el enlace.

## Imágenes de los proyectos

No se usa Firebase Storage. Las imágenes viven dentro del sitio:

1. Copia la imagen en `public/projects/` (WebP o JPG, idealmente de 1600 px de ancho y proporción 16:10).
2. En local (`npm run dev`) recarga el panel: la imagen aparece en la galería del editor de proyectos.
3. Elígela, guarda el proyecto y despliega (`npm run deploy`) para que también exista en el sitio publicado.

También puedes pegar el enlace `https://` de una imagen alojada en otro lugar.

## Marca

- `public/logo.png`: logo con fondo transparente (encabezado, pie y panel).
- `public/logo-x.png`: solo la X, en degradado.
- `public/favicon.png` y `public/apple-touch-icon.png`: la X sobre fondo azul noche.
- `public/og.jpg`: imagen que se muestra al compartir el enlace en redes y WhatsApp.
- Los colores de la marca están en `src/styles/app.css` (`@theme`).

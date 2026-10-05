import { getApp, getApps, initializeApp } from 'firebase/app';

const config = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId);

// Usuario administrador de Firebase Auth. El PIN es su contraseña y solo Firebase guarda su hash.
export const adminEmail = import.meta.env.PUBLIC_ADMIN_EMAIL || '';
export const adminUid = import.meta.env.PUBLIC_ADMIN_UID || '';

export function firebaseApp() {
  return getApps().length ? getApp() : initializeApp(config);
}

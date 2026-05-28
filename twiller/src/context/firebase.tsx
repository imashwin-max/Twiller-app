import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAlA3cY46mmnexaRpXMwocKuEoIspTgsHo",
  authDomain: "twiller-project-ba42c.firebaseapp.com",
  projectId: "twiller-project-ba42c",
  storageBucket: "twiller-project-ba42c.firebasestorage.app",
  messagingSenderId: "822952840753",
  appId: "1:822952840753:web:3db8bb9a74421a4e2c0f10"
};

export const isMockAuth = false;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { auth };
export default app;
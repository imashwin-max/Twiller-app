import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// keep your credentials 
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

// Check if credentials are provided
export const isMockAuth = !firebaseConfig.apiKey;

let app = null;
let auth: any = {
  currentUser: null,
};

if (!isMockAuth) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
}

export { auth };
export default app;

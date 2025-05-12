import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyCq1yyYm7BtGFoYWUinjMBCYp_mWoIspeQ",
  authDomain: "orderlo-8ea11.firebaseapp.com",
  projectId: "orderlo-8ea11",
  storageBucket: "orderlo-8ea11.firebasestorage.app",
  messagingSenderId: "881041655297",
  appId: "1:881041655297:web:21cc9fea1fdce68ae2e200",
  measurementId: "G-1P2NVX2X51"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LeVGyJrAAAAAGDcDU2IWFgco-J633DNBpOvA3AK'),
  isTokenAutoRefreshEnabled: true,
});

export { analytics, app, appCheck, auth, db, firebaseConfig };

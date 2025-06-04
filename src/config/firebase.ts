import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDhGhzkN3_8LK2uWusX0VdZKarIhPXIfrQ",
  authDomain: "budget-coloc.firebaseapp.com",
  projectId: "budget-coloc",
  storageBucket: "budget-coloc.firebasestorage.app",
  messagingSenderId: "841078184710",
  appId: "1:841078184710:web:66e9cd6efe5c1a8a6a9c87",
  measurementId: "G-XNLBCJKPDQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const storage = getStorage(app); 
// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  GoogleAuthProvider, // Importa o provedor Google
  signInWithPopup,    // Para login com pop-up (Google)
  createUserWithEmailAndPassword, // Para registrar com e-mail e senha
  signInWithEmailAndPassword,     // Para login com e-mail e senha
  signOut                   // Para logout
} from "firebase/auth";

// Suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBDfLm05eL526FYkpgqT2mZlHzrNGPlM3s",
  authDomain: "organizauni-38a98.firebaseapp.com",
  projectId: "organizauni-38a98",
  storageBucket: "organizauni-38a98.firebasestorage.app",
  messagingSenderId: "15365921961",
  appId: "1:15365921961:web:261adf1b670d5124165db8"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa os serviços que você vai usar
const db = getFirestore(app);
const auth = getAuth(app);

// Provedor Google
const googleProvider = new GoogleAuthProvider();

// Variáveis globais fornecidas pelo ambiente Canvas (se aplicável)
const appId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Função para autenticação inicial (mantida para compatibilidade com ambiente Canvas)
const initializeAuth = async () => {
  try {
    if (initialAuthToken) {
      await signInWithCustomToken(auth, initialAuthToken);
      console.log("Autenticado com token personalizado.");
    } else {
      // Se não houver token personalizado, ainda tentamos autenticação anônima
      // para que o Firestore possa ser acessado se as regras permitirem.
      await signInAnonymously(auth);
      console.log("Autenticado anonimamente.");
    }
  } catch (error) {
    console.error("Erro na autenticação inicial do Firebase:", error);
  }
};

// Funções de autenticação a serem exportadas
const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
    console.log("Login com Google realizado com sucesso!");
  } catch (error) {
    console.error("Erro no login com Google:", error);
    throw error; // Propaga o erro para ser tratado no componente
  }
};

const registerWithEmail = async (email, password) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    console.log("Registro com e-mail e senha realizado com sucesso!");
  } catch (error) {
    console.error("Erro no registro com e-mail e senha:", error);
    throw error;
  }
};

const loginWithEmail = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Login com e-mail e senha realizado com sucesso!");
  } catch (error) {
    console.error("Erro no login com e-mail e senha:", error);
    throw error;
  }
};

const logout = async () => {
  try {
    await signOut(auth);
    console.log("Logout realizado com sucesso!");
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    throw error;
  }
};


export {
  db,
  auth,
  appId,
  initializeAuth,
  loginWithGoogle,
  registerWithEmail,
  loginWithEmail,
  logout
};

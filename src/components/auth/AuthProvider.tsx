import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { LoginDialog } from "./LoginDialog";
import { RegisterDialog } from "./RegisterDialog";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Si l'utilisateur n'est pas authentifié, montrer la popup de connexion
    if (!isAuthenticated) {
      setShowLogin(true);
    }
  }, [isAuthenticated]);

  const handleRegisterClick = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleLoginClick = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  return (
    <>
      <LoginDialog
        isOpen={showLogin}
        onOpenChange={setShowLogin}
        onRegisterClick={handleRegisterClick}
      />
      <RegisterDialog
        isOpen={showRegister}
        onOpenChange={setShowRegister}
        onLoginClick={handleLoginClick}
      />
      {children}
    </>
  );
} 
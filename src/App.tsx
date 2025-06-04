import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import MonthDetail from "./components/MonthDetail";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./components/auth/AuthProvider";
import { UserMenu } from "./components/auth/UserMenu";
import { useAuthStore } from "./store/authStore";

const queryClient = new QueryClient();

// Composant pour protéger les routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          {/* Header avec UserMenu */}
          <header className="fixed top-0 right-0 p-4 z-50">
            <UserMenu />
          </header>
          
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route
                path="/month/:monthKey"
                element={
                  <ProtectedRoute>
                    <MonthDetail />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import api from "./services/api";
import Layout from "./components/Layout";
import ChatPage from "./pages/ChatPage";
import Dashboard from "./pages/Dashboard";
import ResumeAnalyzerPage from "./pages/ResumeAnalyzerPage";
import ResumeEditorPage from "./pages/ResumeEditorPage";
import JobMatchingPage from "./pages/JobMatchingPage";
import MockInterviewPage from "./pages/MockInterviewPage";
import SkillAnalyzerPage from "./pages/SkillAnalyzerPage";
import RoadmapGeneratorPage from "./pages/RoadmapGeneratorPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Global Authentication Context
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on startup if JWT exists in localStorage
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await api.get("/auth/me");
          setUser(response.data);
        } catch (err) {
          // Token expired or invalid
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  // Authenticate user credentials and save token
  async function login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", response.data.access_token);
    const profileResponse = await api.get("/auth/me");
    setUser(profileResponse.data);
  }

  // Clear authentication token and state
  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to consume the AuthContext easily
export function useAuth() {
  return useContext(AuthContext);
}

// Wrapper for pages requiring active authenticated sessions
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 font-semibold">
        Verifying session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wrap authenticated children inside the main Sidebar layout
  return <Layout>{children}</Layout>;
}

// Wrapper to prevent logged-in users from accessing login/register
function AuthRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 font-semibold">
        Verifying session...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route
            path="/login"
            element={
              <AuthRoute>
                <LoginPage />
              </AuthRoute>
            }
          />
          <Route
            path="/register"
            element={
              <AuthRoute>
                <RegisterPage />
              </AuthRoute>
            }
          />

          {/* Protected Main Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-analyzer"
            element={
              <ProtectedRoute>
                <ResumeAnalyzerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-editor"
            element={
              <ProtectedRoute>
                <ResumeEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-matching"
            element={
              <ProtectedRoute>
                <JobMatchingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-interview"
            element={
              <ProtectedRoute>
                <MockInterviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/skill-analyzer"
            element={
              <ProtectedRoute>
                <SkillAnalyzerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roadmap"
            element={
              <ProtectedRoute>
                <RoadmapGeneratorPage />
              </ProtectedRoute>
            }
          />

          {/* Wildcard Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

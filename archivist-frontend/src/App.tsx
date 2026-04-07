import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Folders } from "./pages/Folders";
import { Boxes } from "./pages/Boxes";
import { Codes } from "./pages/Codes";
import { Locations } from "./pages/Locations";
import { Archives } from "./pages/Archives";
import { Settings } from "./pages/Settings";
import { Imports } from "./pages/Imports";
import { Login } from "./pages/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import "./App.css";

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/folders" element={<Folders />} />
        <Route path="/boxes" element={<Boxes />} />
        <Route path="/codes" element={<Codes />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/archives" element={<Archives />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/imports" element={<Imports />} />
      </Route>
    </Routes>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

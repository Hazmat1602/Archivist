import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Folders } from "./pages/Folders";
import { Boxes } from "./pages/Boxes";
import { Codes } from "./pages/Codes";
import { Locations } from "./pages/Locations";
import { Archives } from "./pages/Archives";
import { Search } from "./pages/Search";
import { Settings } from "./pages/Settings";
import { Imports } from "./pages/Imports";
import { Users } from "./pages/Users";
import { Login } from "./pages/Login";
import { ChangePassword } from "./pages/ChangePassword";
import { ServerSetup } from "./pages/ServerSetup";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { isServerConfigured } from "./lib/config";
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
  if (user.password_temporary) {
    return <Navigate to="/change-password" replace />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/folders" element={<Folders />} />
        <Route path="/search" element={<Search />} />
        <Route path="/boxes" element={<Boxes />} />
        <Route path="/codes" element={<Codes />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/archives" element={<Archives />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/imports" element={<Imports />} />
        <Route path="/users" element={<Users />} />
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
      <Route path="/change-password" element={!user ? <Navigate to="/login" replace /> : user.password_temporary ? <ChangePassword /> : <Navigate to="/" replace />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

function App() {
  const [serverReady, setServerReady] = useState(isServerConfigured());

  if (!serverReady) {
    return <ServerSetup onComplete={() => setServerReady(true)} />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

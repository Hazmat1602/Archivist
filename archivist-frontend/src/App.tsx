import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Folders } from "./pages/Folders";
import { Boxes } from "./pages/Boxes";
import { Codes } from "./pages/Codes";
import { Locations } from "./pages/Locations";
import { Archives } from "./pages/Archives";
import { Settings } from "./pages/Settings";
import { Imports } from "./pages/Imports";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;

import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Listings from "./pages/Listings";
import Predictor from "./pages/Predictor";
import Recommendations from "./pages/Recommendations";
import SellProperty from "./pages/SellProperty";
import AuthPage from "./pages/AuthPage";
import { api, getSession } from "./services/api";

export default function App() {
  const [activeTab, setActiveTab] = useState("Listings");
  const [darkMode, setDarkMode] = useState(false);
  const [properties, setProperties] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [toast, setToast] = useState(null);
  const [session, setSession] = useState(getSession());
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    bedrooms: "",
    property_type: "",
    furnishing: "",
    max_price: "",
    sort: "recommended",
  });

  async function refreshProperties() {
    if (!session) return;
    const data = await api.getProperties(filters);
    setProperties(data.items);
  }

  async function refreshDashboard() {
    if (!session) return;
    const data = await api.dashboard();
    setDashboard(data);
  }

  async function toggleSaved(id) {
    const result = await api.toggleSaved(id);
    setProperties((current) => current.map((property) => (
      property.id === id ? { ...property, saved: result.saved } : property
    )));
    setToast(result.saved ? "Added to saved properties" : "Removed from saved properties");
    window.setTimeout(() => setToast(null), 2400);
    await refreshProperties();
    await refreshDashboard();
  }

  async function logout() {
    await api.logout();
    setSession(null);
    setProperties([]);
    setDashboard(null);
    setActiveTab("Listings");
  }

  useEffect(() => {
    refreshProperties().catch(console.error);
  }, [filters, session]);

  useEffect(() => {
    api.me().then((currentSession) => {
      if (currentSession) setSession(currentSession);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    refreshDashboard().catch(console.error);
  }, [session]);

  if (!session) {
    return <AuthPage onAuthed={setSession} />;
  }

  return (
    <main className={darkMode ? "app dark" : "app light"}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} darkMode={darkMode} setDarkMode={setDarkMode} user={session.user} onLogout={logout} />
      {toast && <div className="toast">{toast}</div>}
      <div className="shell">
        {activeTab === "Listings" && <Listings properties={properties} filters={filters} setFilters={setFilters} onSave={toggleSaved} />}
        {activeTab === "Predict" && <Predictor onPrediction={refreshDashboard} />}
        {activeTab === "Sell" && <SellProperty onPublished={refreshProperties} />}
        {activeTab === "Recommend" && <Recommendations onSave={toggleSaved} />}
        {activeTab === "Dashboard" && <Dashboard dashboard={dashboard} onSave={toggleSaved} />}
      </div>
    </main>
  );
}

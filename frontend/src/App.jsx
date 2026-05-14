import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Listings from "./pages/Listings";
import Predictor from "./pages/Predictor";
import Recommendations from "./pages/Recommendations";
import SellProperty from "./pages/SellProperty";
import { api } from "./services/api";

export default function App() {
  const [activeTab, setActiveTab] = useState("Listings");
  const [darkMode, setDarkMode] = useState(false);
  const [properties, setProperties] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [toast, setToast] = useState(null);
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
    const data = await api.getProperties(filters);
    setProperties(data.items);
  }

  async function refreshDashboard() {
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

  useEffect(() => {
    refreshProperties().catch(console.error);
  }, [filters]);

  useEffect(() => {
    refreshDashboard().catch(console.error);
  }, []);

  return (
    <main className={darkMode ? "app dark" : "app light"}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} darkMode={darkMode} setDarkMode={setDarkMode} />
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

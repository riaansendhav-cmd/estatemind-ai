import React from "react";
import { Building2, LogOut, Moon, Search, Sun } from "lucide-react";

export default function Header({ activeTab, setActiveTab, darkMode, setDarkMode, user, onLogout }) {
  const tabs = ["Listings", "Predict", "Sell", "Recommend", "Dashboard"];

  return (
    <header className="topbar">
      <button className="brand" onClick={() => setActiveTab("Listings")} aria-label="EstateMind home">
        <span className="brand-icon"><Building2 size={22} /></span>
        <span>EstateMind AI</span>
      </button>

      <nav className="tabs" aria-label="Main navigation">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "tab active" : "tab"}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="top-actions">
        <Search size={18} />
        <span className="user-chip">{user?.name || "User"}</span>
        <button className="icon-button" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle theme">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="icon-button" onClick={onLogout} aria-label="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

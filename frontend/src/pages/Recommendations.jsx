import React, { useState } from "react";
import { Radar, Sparkles } from "lucide-react";
import PropertyCard from "../components/PropertyCard";
import { api } from "../services/api";

export default function Recommendations({ onSave }) {
  const [form, setForm] = useState({ budget: 16000000, location: "Bengaluru", bedrooms: 3, amenities: "Gym, Security, Pool" });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    const data = await api.recommend({
      budget: Number(form.budget),
      location: form.location,
      bedrooms: Number(form.bedrooms),
      amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean),
    });
    setItems(data.items);
    setLoading(false);
  }

  return (
    <section className="split-layout">
      <form className="panel form-panel" onSubmit={submit}>
        <div className="section-title">
          <Radar size={20} />
          <h2>Recommendation Engine</h2>
        </div>
        <label>
          Budget
          <input type="number" value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} />
        </label>
        <div className="control-row">
          <select value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })}>
            {["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune"].map((city) => <option key={city}>{city}</option>)}
          </select>
          <select value={form.bedrooms} onChange={(event) => setForm({ ...form, bedrooms: event.target.value })}>
            {[1, 2, 3, 4, 5].map((bhk) => <option key={bhk} value={bhk}>{bhk} BHK</option>)}
          </select>
        </div>
        <label>
          Amenities
          <input value={form.amenities} onChange={(event) => setForm({ ...form, amenities: event.target.value })} />
        </label>
        <button className="primary-button" disabled={loading}>
          <Sparkles size={18} />
          {loading ? "Matching..." : "Find similar homes"}
        </button>
      </form>

      <div className="recommendation-list">
        {items.length ? items.map((property) => (
          <PropertyCard key={property.id} property={property} onSave={onSave} compact />
        )) : (
          <div className="panel empty-state">
            <h2>Content-based matching with cosine similarity.</h2>
            <p>Budget fit, location, BHK, furnishing, and amenities are blended into a match score.</p>
          </div>
        )}
      </div>
    </section>
  );
}

import React, { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calculator, WandSparkles } from "lucide-react";
import { api } from "../services/api";
import { mockProperties } from "../services/mockData";
import { formatPrice } from "../utils/format";

const initialForm = {
  location: "Mumbai",
  property_type: "Apartment",
  area: 1450,
  bedrooms: 3,
  bathrooms: 3,
  furnishing: "Semi-Furnished",
  parking: 2,
};

export default function Predictor({ onPrediction }) {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const locationOptions = [...new Set(mockProperties.map((property) => property.location))].sort();
  const propertyTypeOptions = [...new Set(mockProperties.map((property) => property.property_type || "Apartment"))].sort();

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      area: Number(form.area),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      parking: Number(form.parking),
    };
    const data = await api.predict(payload);
    setResult(data);
    onPrediction?.();
    setLoading(false);
  }

  return (
    <section className="split-layout">
      <form className="panel form-panel" onSubmit={submit}>
        <div className="section-title">
          <Calculator size={20} />
          <h2>House Price Prediction</h2>
        </div>
        <div className="control-row">
          <select value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })}>
            {locationOptions.map((city) => <option key={city}>{city}</option>)}
          </select>
          <select value={form.property_type} onChange={(event) => setForm({ ...form, property_type: event.target.value })}>
            {propertyTypeOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="control-row">
          <select value={form.furnishing} onChange={(event) => setForm({ ...form, furnishing: event.target.value })}>
            {["Furnished", "Semi-Furnished", "Unfurnished"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        {[
          ["area", "Area", 250, 10000],
          ["bedrooms", "Bedrooms", 1, 10],
          ["bathrooms", "Bathrooms", 1, 10],
          ["parking", "Parking", 0, 8],
        ].map(([key, label, min, max]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              min={min}
              max={max}
              value={form[key]}
              onChange={(event) => setForm({ ...form, [key]: event.target.value })}
            />
          </label>
        ))}
        <button className="primary-button" disabled={loading}>
          <WandSparkles size={18} />
          {loading ? "Predicting..." : "Predict price"}
        </button>
      </form>

      <div className="panel result-panel">
        {result ? (
          <>
            <span className="eyebrow">{result.model_name}</span>
            <h2>{formatPrice(result.predicted_price)}</h2>
            <p>{result.confidence}% confidence · {formatPrice(result.range_low)} to {formatPrice(result.range_high)}</p>
            {result.offline && <p className="muted-copy">Backend model unavailable, showing a local fallback estimate.</p>}
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={result.chart}>
                  <defs>
                    <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.85} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.25)" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 100000)}L`} />
                  <Tooltip formatter={(value) => formatPrice(value)} />
                  <Area type="monotone" dataKey="value" stroke="#38bdf8" fill="url(#predictionGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h2>Predictive valuation, ready when you are.</h2>
            <p>Enter a property profile to estimate its market value with the trained backend model.</p>
          </div>
        )}
      </div>
    </section>
  );
}

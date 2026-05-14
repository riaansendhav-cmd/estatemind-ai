import React from "react";
import PropertyCard from "../components/PropertyCard";
import StatCard from "../components/StatCard";
import { formatPrice } from "../utils/format";

export default function Dashboard({ dashboard, onSave }) {
  if (!dashboard) {
    return <div className="panel empty-state"><h2>Loading dashboard...</h2></div>;
  }

  return (
    <section className="dashboard">
      <div className="stats-grid">
        <StatCard label="Saved homes" value={dashboard.stats.saved} tone="blue" />
        <StatCard label="Predictions" value={dashboard.stats.predictions} tone="green" />
        <StatCard label="Recommendation runs" value={dashboard.stats.recommendations} tone="pink" />
        <StatCard label="Average market price" value={formatPrice(dashboard.stats.average_price)} tone="gold" />
      </div>

      <div className="history-grid">
        <div className="panel">
          <div className="saved-header">
            <div>
              <h2>Saved properties</h2>
              <p>Homes you liked are kept here for quick comparison.</p>
            </div>
            <strong>{dashboard.saved_properties.length}</strong>
          </div>
          <div className="mini-list">
            {dashboard.saved_properties.length ? dashboard.saved_properties.map((property) => (
              <PropertyCard key={property.id} property={property} onSave={onSave} compact />
            )) : <p>No saved properties yet.</p>}
          </div>
        </div>
        <div className="panel timeline">
          <h2>Prediction history</h2>
          {dashboard.prediction_history.length ? dashboard.prediction_history.map((item, index) => (
            <div className="timeline-item" key={`${item.created_at}-${index}`}>
              <strong>{formatPrice(item.result.predicted_price)}</strong>
              <span>{item.input.location} · {item.input.bedrooms} BHK · {item.input.area} sq ft</span>
            </div>
          )) : <p>No predictions yet.</p>}
        </div>
      </div>
    </section>
  );
}

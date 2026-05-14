import React from "react";
import { SlidersHorizontal } from "lucide-react";
import PropertyCard from "../components/PropertyCard";
import { formatPrice } from "../utils/format";

export default function Listings({ properties, filters, setFilters, onSave }) {
  const [selected, setSelected] = React.useState(null);
  const [visibleCount, setVisibleCount] = React.useState(96);
  const cityOptions = [...new Set(properties.map((property) => property.location).filter(Boolean))].sort();
  const typeOptions = [...new Set(properties.map((property) => property.property_type || "Apartment"))].sort();
  const maxDatasetPrice = Math.max(35000000, ...properties.map((property) => property.price || 0));
  const selectedMaxPrice = filters.max_price || maxDatasetPrice;
  const visibleProperties = properties.slice(0, visibleCount);

  React.useEffect(() => {
    setVisibleCount(96);
  }, [filters]);

  return (
    <>
      <section className="page-grid">
        <div className="panel filters-panel">
          <div className="section-title">
            <SlidersHorizontal size={19} />
            <h2>Find your next address</h2>
          </div>
          <input
            placeholder="Search city, seller, or home"
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />
          <div className="control-row">
            <select value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })}>
              <option value="">All cities</option>
              {cityOptions.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
            <select value={filters.bedrooms} onChange={(event) => setFilters({ ...filters, bedrooms: event.target.value })}>
              <option value="">BHK</option>
              {[1, 2, 3, 4, 5].map((bhk) => (
                <option key={bhk} value={bhk}>{bhk} BHK</option>
              ))}
            </select>
          </div>
          <div className="control-row">
            <select value={filters.property_type} onChange={(event) => setFilters({ ...filters, property_type: event.target.value })}>
              <option value="">Any type</option>
              {typeOptions.map((type) => <option key={type}>{type}</option>)}
            </select>
            <select value={filters.furnishing} onChange={(event) => setFilters({ ...filters, furnishing: event.target.value })}>
              <option value="">Any furnishing</option>
              {["Furnished", "Semi-Furnished", "Unfurnished"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <label>
            Max price
            <input
              type="range"
              min="4000000"
              max={maxDatasetPrice}
              step="500000"
              value={selectedMaxPrice}
              onChange={(event) => setFilters({ ...filters, max_price: event.target.value })}
            />
            <span>Rs {Math.round(selectedMaxPrice / 100000)}L</span>
          </label>
          <select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}>
            <option value="recommended">Recommended</option>
            <option value="price_asc">Price low to high</option>
            <option value="price_desc">Price high to low</option>
            <option value="area_desc">Largest area</option>
          </select>
        </div>

        <div className="listing-area">
          <div className="hero-copy">
            <span>AI-powered real estate marketplace</span>
            <h1>Buy, sell, predict, and compare premium homes in one place.</h1>
          </div>
          <div className="market-strip">
            <span>{properties.length} active listings</span>
            <span>Instant AI estimates</span>
            <span>Seller contact details</span>
          </div>
          <div className="property-grid">
            {visibleProperties.map((property) => (
              <PropertyCard key={property.id} property={property} onSave={onSave} onView={setSelected} />
            ))}
          </div>
          {visibleCount < properties.length && (
            <button className="load-more-button" onClick={() => setVisibleCount((count) => count + 96)}>
              Load more listings ({Math.min(visibleCount + 96, properties.length)} of {properties.length})
            </button>
          )}
        </div>
      </section>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="detail-modal" onClick={(event) => event.stopPropagation()}>
            <img src={selected.image} alt={selected.title} />
            <div className="detail-content">
              <span className="eyebrow">{selected.property_type || "Apartment"} · {selected.listing_status || "For Sale"}</span>
              <h2>{selected.title}</h2>
              <strong>{formatPrice(selected.price)}</strong>
              <p>{selected.description || "A verified marketplace listing with complete property details."}</p>
              <div className="facts">
                <span>{selected.bedrooms} BHK</span>
                <span>{selected.bathrooms} baths</span>
                <span>{selected.area} sq ft</span>
                <span>{selected.furnishing}</span>
                <span>{selected.parking} parking</span>
              </div>
              <div className="amenities">
                {(selected.amenities || []).length ? selected.amenities.map((item) => <span key={item}>{item}</span>) : <span>No amenities added</span>}
              </div>
              <div className="seller-box">
                <strong>Seller contact</strong>
                <span>{selected.seller_name || "Verified seller"}</span>
                <span>{selected.seller_phone || "Contact number not added"}</span>
              </div>
              <button className="primary-button" onClick={() => setSelected(null)}>Close details</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

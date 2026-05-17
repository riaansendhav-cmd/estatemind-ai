import React, { useState } from "react";
import { BadgeIndianRupee, Home } from "lucide-react";
import { api } from "../services/api";
import PropertyCard from "../components/PropertyCard";

const initialForm = {
  title: "",
  description: "",
  seller_name: "",
  seller_phone: "",
  property_type: "Apartment",
  listing_status: "For Sale",
  image: "",
  price: "",
  location: "",
  area: "",
  bedrooms: "",
  bathrooms: "",
  furnishing: "Semi-Furnished",
  parking: "",
  amenities: "",
};

export default function SellProperty({ onPublished }) {
  const [form, setForm] = useState(initialForm);
  const [published, setPublished] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      price: Number(form.price),
      area: Number(form.area),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      parking: Number(form.parking || 0),
      amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean),
    };
    const property = await api.createProperty(payload);
    setPublished(property);
    setForm(initialForm);
    onPublished?.();
    setLoading(false);
  }

  return (
    <section className="split-layout">
      <form className="panel form-panel seller-form" onSubmit={submit}>
        <div className="section-title">
          <Home size={20} />
          <h2>List a Property for Sale</h2>
        </div>

        <label>
          Property title
          <input placeholder="Example: Park-facing 3 BHK apartment" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        </label>

        <label>
          Description
          <textarea placeholder="Describe the property, nearby landmarks, floor, view, and highlights" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
        </label>

        <div className="control-row">
          <label>
            Seller name
            <input placeholder="Owner or agent name" value={form.seller_name} onChange={(event) => setForm({ ...form, seller_name: event.target.value })} required />
          </label>
          <label>
            Phone
            <input placeholder="+91..." value={form.seller_phone} onChange={(event) => setForm({ ...form, seller_phone: event.target.value })} required />
          </label>
        </div>

        <label>
          Image URL
          <input placeholder="Optional property photo URL" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} />
        </label>

        <div className="control-row">
          <label>
            Price
            <input type="number" min="100000" placeholder="12500000" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
          </label>
          <label>
            Location
            <select value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required>
              <option value="">Select city</option>
              {["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune"].map((city) => <option key={city}>{city}</option>)}
            </select>
          </label>
        </div>

        <div className="control-row">
          <label>
            Property type
            <select value={form.property_type} onChange={(event) => setForm({ ...form, property_type: event.target.value })}>
              {["Apartment", "Independent House", "Villa", "Studio", "Penthouse"].map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label>
            Status
            <select value={form.listing_status} onChange={(event) => setForm({ ...form, listing_status: event.target.value })}>
              {["For Sale", "Ready to Move", "Under Construction"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
        </div>

        <div className="control-row">
          <label>
            Area
            <input type="number" min="100" placeholder="1450" value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} required />
          </label>
          <label>
            Furnishing
            <select value={form.furnishing} onChange={(event) => setForm({ ...form, furnishing: event.target.value })}>
              {["Furnished", "Semi-Furnished", "Unfurnished"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>

        <div className="control-row">
          <label>
            Bedrooms
            <input type="number" min="1" placeholder="3" value={form.bedrooms} onChange={(event) => setForm({ ...form, bedrooms: event.target.value })} required />
          </label>
          <label>
            Bathrooms
            <input type="number" min="1" placeholder="3" value={form.bathrooms} onChange={(event) => setForm({ ...form, bathrooms: event.target.value })} required />
          </label>
        </div>

        <label>
          Parking
          <input type="number" min="0" placeholder="0" value={form.parking} onChange={(event) => setForm({ ...form, parking: event.target.value })} />
        </label>

        <label>
          Amenities
          <input placeholder="Optional: Pool, Gym, Balcony, Security" value={form.amenities} onChange={(event) => setForm({ ...form, amenities: event.target.value })} />
        </label>

        <button className="primary-button" disabled={loading}>
          <BadgeIndianRupee size={18} />
          {loading ? "Publishing..." : "Publish listing"}
        </button>
      </form>

      <div className="panel result-panel">
        {published ? (
          <>
            <span className="eyebrow">Published listing</span>
            <PropertyCard property={published} compact />
            <p className="muted-copy">
              Your listing is live and visible in property search.
            </p>
          </>
        ) : (
          <div className="empty-state">
            <h2>A real seller workspace.</h2>
            <p>Add complete listing, seller, pricing, status, image, BHK, and amenity details. Empty fields stay empty; nothing is silently added.</p>
          </div>
        )}
      </div>
    </section>
  );
}

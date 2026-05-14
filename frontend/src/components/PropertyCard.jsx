import React from "react";
import { Bath, BedDouble, Heart, MapPin, Ruler, Sparkles } from "lucide-react";
import { formatPrice } from "../utils/format";

export default function PropertyCard({ property, onSave, onView, compact = false }) {
  return (
    <article className={compact ? "property-card compact" : "property-card"}>
      <div className="property-image-wrap">
        <img className="property-image" src={property.image} alt={property.title} />
        <button
          className={property.saved ? "save-button saved" : "save-button"}
          onClick={() => onSave?.(property.id)}
          aria-label={property.saved ? "Unsave property" : "Save property"}
        >
          <Heart size={18} fill={property.saved ? "currentColor" : "none"} />
        </button>
        {property.saved && <span className="saved-pill">Saved</span>}
      </div>
      <div className="property-body">
        <div className="property-heading">
          <div>
            <h3>{property.title}</h3>
            <p><MapPin size={15} /> {property.location}</p>
          </div>
          <strong>{formatPrice(property.price)}</strong>
        </div>
        <div className="facts">
          <span>{property.property_type || "Apartment"}</span>
          <span>{property.listing_status || "For Sale"}</span>
          <span><BedDouble size={16} /> {property.bedrooms} BHK</span>
          <span><Bath size={16} /> {property.bathrooms}</span>
          <span><Ruler size={16} /> {property.area} sq ft</span>
        </div>
        <div className="amenities">
          {(property.amenities || []).slice(0, 3).map((item) => (
            <span key={item}><Sparkles size={13} /> {item}</span>
          ))}
        </div>
        {property.match_score && <div className="match">{property.match_score}% match</div>}
        {onView && (
          <button className="secondary-button" onClick={() => onView(property)}>
            View details
          </button>
        )}
      </div>
    </article>
  );
}

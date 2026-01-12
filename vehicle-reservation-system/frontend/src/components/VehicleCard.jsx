import { Link } from "react-router-dom";
import { VEHICLE_TYPES } from "../constants/vehicleTypes";

export default function VehicleCard({ vehicle, searchParams }) {
  const { id, name, type, capacity, imageUrl } = vehicle;

  // Construct query string if params exist
  const query = new URLSearchParams();
  if (searchParams?.startDate) query.set('startDate', searchParams.startDate);
  if (searchParams?.endDate) query.set('endDate', searchParams.endDate);
  const queryString = query.toString() ? `?${query.toString()}` : '';

  return (
    <div className="vehicle-card-modern">
      <div className="vehicle-image-wrapper">
        <img src={imageUrl || "https://placehold.co/600x400?text=No+Image"} alt={name} className="vehicle-image" />
        <span className={`vehicle-badge ${type.toLowerCase()}`}>{VEHICLE_TYPES[type] || type}</span>
      </div>
      <div className="vehicle-info">
        <div className="vehicle-header">
          <h3>{name}</h3>
        </div>
        
        <div className="vehicle-specs">
          <div className="spec-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>{capacity} Persons</span>
          </div>
        </div>
        
        <Link to={`/book/${id}${queryString}`} className="btn-book-vehicle">
          Book Now
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}

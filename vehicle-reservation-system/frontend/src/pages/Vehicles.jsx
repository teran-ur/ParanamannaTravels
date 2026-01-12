import React, { useEffect, useState } from 'react';
import { fetchBookingsForVehicle, fetchVehicles } from '../lib/firestore';
import { useNavigate } from 'react-router-dom';
import { VEHICLE_TYPES } from '../constants/vehicleTypes';
import { overlaps } from '../lib/dateOverlap';

/* 
  Enriching fallback/fetched data with extra static details for the design 
  since Firestore schema is simpler.
*/
const SPEC_DETAILS = {
  "deepol-s05": {
    transmission: "Automatic (Electric)",
    luggage: "4 Bags",
    fuel: "Electric",
    feature: "Quiet, Smooth Ride",
    idealFor: "Couples & Eco-Tours"
  },
  "toyota-hiace": {
    transmission: "Automatic",
    luggage: "10 Bags",
    fuel: "Diesel",
    feature: "Dual AC",
    idealFor: "Group Tours & Airport Transfers"
  },
  "toyota-axio": {
    transmission: "Automatic",
    luggage: "3 Medium Bags",
    fuel: "Petrol (Hybrid model)",
    feature: "Excellent Fuel Economy",
    idealFor: "Small Families & Road Trips"
  }
};

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityByVehicleId, setAvailabilityByVehicleId] = useState(null);
  const [bookingParams, setBookingParams] = useState({
    startDate: '',
    endDate: '',
    type: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await fetchVehicles();
      // Sort by price ascending
      data.sort((a, b) => a.pricePerDay - b.pricePerDay);
      setVehicles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    if (!bookingParams.startDate) {
      alert('Please select a date.');
      return;
    }

    if (!bookingParams.endDate) {
      alert('Please select an end date.');
      return;
    }

    if (bookingParams.startDate > bookingParams.endDate) {
      alert('End date must be the same as or after start date.');
      return;
    }

    setCheckingAvailability(true);
    setAvailabilityByVehicleId(null);

    try {
      const checks = await Promise.all(
        vehicles.map(async (vehicle) => {
          const bookings = await fetchBookingsForVehicle(vehicle.id);
          const hasConflict = bookings.some((b) =>
            overlaps(bookingParams.startDate, bookingParams.endDate, b.startDate, b.endDate)
          );
          return [vehicle.id, !hasConflict];
        })
      );

      const nextAvailability = Object.fromEntries(checks);
      setAvailabilityByVehicleId(nextAvailability);
    } catch (err) {
      console.error(err);
      alert('Unable to check availability right now. Please try again.');
    } finally {
      setCheckingAvailability(false);
    }

    // Scroll to fleet section
    const fleetSection = document.getElementById('fleet-vehicles');
    if (fleetSection) {
      fleetSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getSpecs = (id, capacity) => {
    const details = SPEC_DETAILS[id] || {
        transmission: "Automatic",
        luggage: "Standard",
        fuel: "Petrol",
        feature: "AC",
        idealFor: "Travelers"
    };
    return {
      passengers: capacity,
      transmission: details.transmission,
      luggage: details.luggage,
      fuel: details.fuel,
      feature: details.feature,
      idealFor: details.idealFor
    };
  };

  if (loading) {
    return (
      <main className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading our premium fleet...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container fleet-page">
      <div className="page-hero">
        <div className="container">
          <h1>Our Premium Fleet</h1>
          <p>Choose from our carefully selected range of well-maintained vehicles for your Sri Lankan adventure</p>
        </div>
      </div>
      
      <div className="container">
        {/* Book Your Journey Section */}
        <section className="book-journey-section" id="book-journey">
          <div className="book-journey-card">
            <div className="book-journey-header">
              <div className="book-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <h2>Book Your Journey</h2>
                <p>Select your preferences and check available vehicles</p>
              </div>
            </div>
            
            <form className="book-journey-form" onSubmit={handleCheckAvailability}>
              <div className="form-row-book">
                <div className="form-group-book">
                  <label htmlFor="journey-date">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Select Date
                  </label>
                  <input 
                    id="journey-date"
                    type="date" 
                    required 
                    value={bookingParams.startDate}
                    onChange={e => setBookingParams({...bookingParams, startDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group-book">
                  <label htmlFor="journey-end-date">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    End Date
                  </label>
                  <input
                    id="journey-end-date"
                    type="date"
                    required
                    value={bookingParams.endDate}
                    onChange={e => setBookingParams({...bookingParams, endDate: e.target.value})}
                    min={bookingParams.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="form-group-book">
                  <label htmlFor="journey-type">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"></path>
                      <polygon points="12 15 17 21 7 21 12 15"></polygon>
                    </svg>
                    Vehicle Type
                  </label>
                  <select 
                    id="journey-type"
                    value={bookingParams.type}
                    onChange={e => setBookingParams({...bookingParams, type: e.target.value})}
                  >
                    <option value="">All Types</option>
                    {Object.values(VEHICLE_TYPES).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                
                <button type="submit" className="btn-check-availability" disabled={checkingAvailability}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  {checkingAvailability ? 'Checking...' : 'Check Availability'}
                </button>
              </div>
              
              <div className="booking-note-fleet">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Free cancellation up to 24 hours before pickup</span>
              </div>
            </form>
          </div>
        </section>

        {/* Fleet Vehicles Section */}
        <div id="fleet-vehicles" className="fleet-grid">
          {vehicles.map(vehicle => {
            const specs = getSpecs(vehicle.id, vehicle.capacity);
            const availabilityKnown = Boolean(availabilityByVehicleId);
            const isAvailable = availabilityKnown ? Boolean(availabilityByVehicleId[vehicle.id]) : true;
            return (
              <div key={vehicle.id} className="fleet-card-modern" id={vehicle.id}>
                <div className="fleet-image-wrapper">
                  <img src={vehicle.imageUrl || "https://placehold.co/600x400"} alt={vehicle.name} />
                  <div className="fleet-badge">{vehicle.type}</div>
                  {availabilityKnown && !isAvailable && (
                    <div className="availability-badge">Unavailable</div>
                  )}
                </div>
                
                <div className="fleet-content">
                  <div className="fleet-header">
                    <h2>{vehicle.name}</h2>
                  </div>
                  
                  <p className="fleet-description">
                    {vehicle.description || "A safe and comfortable ride for your journey across Sri Lanka."}
                  </p>
                  
                  <div className="fleet-specs-grid">
                    <div className="spec-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <div>
                        <span className="spec-label">Passengers</span>
                        <span className="spec-value">{specs.passengers}</span>
                      </div>
                    </div>
                    
                    <div className="spec-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                      </svg>
                      <div>
                        <span className="spec-label">Transmission</span>
                        <span className="spec-value">{specs.transmission}</span>
                      </div>
                    </div>
                    
                    <div className="spec-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6H4l2 14h12l2-14z"></path>
                        <path d="M12 11c1.7 0 3-1.3 3-3V4H9v4c0 1.7 1.3 3 3 3z"></path>
                      </svg>
                      <div>
                        <span className="spec-label">Luggage</span>
                        <span className="spec-value">{specs.luggage}</span>
                      </div>
                    </div>
                    
                    <div className="spec-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
                      </svg>
                      <div>
                        <span className="spec-label">Fuel Type</span>
                        <span className="spec-value">{specs.fuel}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="fleet-features">
                    <div className="feature-highlight">
                      <strong>Key Feature:</strong> {specs.feature}
                    </div>
                    <div className="feature-highlight">
                      <strong>Ideal For:</strong> {specs.idealFor}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      const query = new URLSearchParams();
                      if (bookingParams.startDate) query.set('startDate', bookingParams.startDate);
                      if (bookingParams.endDate) query.set('endDate', bookingParams.endDate);
                      const qs = query.toString() ? `?${query.toString()}` : '';
                      navigate(`/book/${vehicle.id}${qs}`);
                    }}
                    className="btn-book-fleet"
                    disabled={availabilityKnown && !isAvailable}
                    title={availabilityKnown && !isAvailable ? 'Unavailable for selected dates' : undefined}
                  >
                    {availabilityKnown && !isAvailable ? 'Unavailable for Dates' : `Book ${vehicle.name} Now`}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

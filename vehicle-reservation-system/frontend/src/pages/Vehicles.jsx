import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { fetchVehicles } from '../lib/firestore';
import { useNavigate } from 'react-router-dom';
import { VEHICLE_TYPES } from '../constants/vehicleTypes';

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
      <Helmet>
        <title>CeylonExplorer | Our Fleet - Luxury & Economy Vehicles</title>
        <meta name="description" content="Browse our premium fleet of vehicles including luxury cars, vans, and economy options. Well-maintained and comfortable rides for your Sri Lankan tour." />
      </Helmet>
      <div className="page-hero">
        <div className="container">
          <h1>Our Premium Fleet</h1>
          <p>Choose from our carefully selected range of well-maintained vehicles for your Sri Lankan adventure</p>
        </div>
      </div>

      <div className="container">
        {/* Book Your Journey Section */}


        {/* Fleet Vehicles Section */}
        <div id="fleet-vehicles" className="fleet-grid">
          {vehicles.map(vehicle => {
            const specs = getSpecs(vehicle.id, vehicle.capacity);

            return (
              <div key={vehicle.id} className="fleet-card-modern" id={vehicle.id}>
                <div className="fleet-image-wrapper">
                  <img src={vehicle.imageUrl || "https://placehold.co/600x400"} alt={vehicle.name} />
                  <div className="fleet-badge">{vehicle.type}</div>
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
                      navigate(`/book/${vehicle.id}`);
                    }}
                    className="btn-book-fleet"
                  >
                    Book {vehicle.name} Now
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
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

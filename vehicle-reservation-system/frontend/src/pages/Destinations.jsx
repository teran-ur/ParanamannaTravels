import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

import { DESTINATIONS } from '../constants/destinations';

export default function Destinations() {
  const navigate = useNavigate();

  return (
    <main className="page-container destinations-page">
      <Helmet>
        <title>CeylonExplorer | Destinations - Discover Sri Lanka</title>
        <meta name="description" content="Explore the most beautiful destinations in Sri Lanka with CeylonExplorer. Beach, hill country, cultural triangle, and more." />
      </Helmet>
      <div className="page-hero">
        <div className="container">
          <h1>Discover Sri Lanka</h1>
          <p>Explore breathtaking destinations across the Pearl of the Indian Ocean. We provide the vehicle, you create the adventure.</p>
        </div>
      </div>

      <div className="container">
        <div className="destinations-grid-modern">
          {DESTINATIONS.map((dest, i) => (
            <div key={i} className="destination-card-page">
              <div className="destination-image-container">
                <img
                  src={dest.image}
                  alt={dest.title}
                  onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Destination' }}
                />
                <div className="destination-overlay">
                  <h3>{dest.title}</h3>
                </div>
              </div>
              <div className="destination-details">
                <p>{dest.desc}</p>
                <button
                  onClick={() => navigate('/fleet')}
                  className="btn-destination"
                >
                  Plan Your Trip
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

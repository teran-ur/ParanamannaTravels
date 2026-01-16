import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchVehicles, createBooking, fetchAllActiveBookings } from '../lib/firestore';
import { LOCATIONS } from '../constants/locations';
import { overlaps } from '../lib/dateOverlap';

export default function BookVehicle() {
  const { vehicleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [formData, setFormData] = useState({
    vehicleId: vehicleId || '',
    pickupDate: searchParams.get('startDate') || '',
    dropoffDate: searchParams.get('endDate') || '',
    pickupLocation: '',
    dropoffLocation: '',
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Confirm Booking');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load vehicles for the dropdown
    const load = async () => {
      const [vehiclesData, bookingsData] = await Promise.all([
        fetchVehicles(),
        fetchAllActiveBookings()
      ]);

      // Sort as requested
      vehiclesData.sort((a, b) => a.pricePerDay - b.pricePerDay);
      setVehicles(vehiclesData);
      setAllBookings(bookingsData);

      // If vehicleId param provided, ensure it's selected (React state init handled it, but just in case)
      if (vehicleId) {
        setFormData(prev => ({ ...prev, vehicleId }));
      }
    };
    load();
  }, [vehicleId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Helper to check availability for a specific vehicle against currently selected dates
  const getVehicleAvailability = (vId) => {
    if (!formData.pickupDate || !formData.dropoffDate) return { available: true, reason: null };

    // Check for conflicts
    const vehicleBookings = allBookings.filter(b => b.vehicleId === vId);
    const conflicts = vehicleBookings.filter(b =>
      overlaps(formData.pickupDate, formData.dropoffDate, b.startDate, b.endDate)
    );

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      return { available: false, reason: `Booked until ${conflict.endDate}` };
    }

    return { available: true, reason: null };
  };

  const currentVehicleAvailability = useMemo(() => {
    return getVehicleAvailability(formData.vehicleId);
  }, [formData.vehicleId, formData.pickupDate, formData.dropoffDate, allBookings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingText("Validating...");
    setError(null);

    // 1. Synchronous Validation
    try {
      if (!formData.vehicleId) throw new Error("Please select a vehicle.");

      if (formData.pickupDate > formData.dropoffDate) {
        throw new Error("Drop-off date must be the same as or after pick-up date.");
      }

      // Check availability synchronously
      if (!currentVehicleAvailability.available) {
        throw new Error(`Selected dates are not available for this vehicle. ${currentVehicleAvailability.reason || 'Please choose another vehicle.'}`);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setLoadingText("Confirm Booking"); // Reset text on error
      return;
    }

    // 2. Prepare Data
    const vehicle = vehicles.find(v => v.id === formData.vehicleId);

    // Calculate price
    const starT = new Date(formData.pickupDate);
    const endT = new Date(formData.dropoffDate);
    const diffTime = Math.abs(endT - starT);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const price = vehicle ? vehicle.pricePerDay * diffDays : 0;

    const bookingPayload = {
      vehicleId: formData.vehicleId,
      vehicleName: vehicle ? vehicle.name : 'Unknown',
      startDate: formData.pickupDate,
      endDate: formData.dropoffDate,
      pickupLocation: formData.pickupLocation,
      dropoffLocation: formData.dropoffLocation,
      customerName: formData.name,
      customerEmail: formData.email,
      phoneNumber: formData.phone,
      notes: formData.notes,
      totalPrice: price
    };

    // 3. Generate WhatsApp Link
    const message = `*New Booking Request*

*Vehicle:* ${vehicle ? vehicle.name : 'Unknown'}
*Ref:* ${formData.vehicleId}

*Customer Details:*
Name: ${formData.name}
Phone: ${formData.phone}
Email: ${formData.email}

*Journey Details:*
From: ${formData.pickupLocation}
To: ${formData.dropoffLocation}
Pickup: ${formData.pickupDate}
Dropoff: ${formData.dropoffDate}

*Notes:* ${formData.notes || 'None'}
`;

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/94767439588?text=${encodedMessage}`;
    setWhatsappUrl(waUrl);

    // 4. Reliable Save Logic (Wait for DB with Safety Timeout)
    try {
      setLoadingText("Saving Booking..."); // Tell user we are contacting server

      // Create a timeout promise that rejects after 8000ms (Generous window for mobile)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 8000)
      );

      // Race the DB save against the timeout
      await Promise.race([
        createBooking(bookingPayload),
        timeoutPromise
      ]);

      console.log("Booking saved successfully");
    } catch (err) {
      console.warn("Booking save warning (proceeding to redirect):", err);
      // Proceed to redirect anyway.
      // If save failed or timed out, we still want the user to contact us via WhatsApp.
    }

    // 5. Redirect Logic
    setLoadingText("Redirecting to WhatsApp..."); // Explain next step

    // Small artificial delay so user can read "Redirecting..."
    await new Promise(r => setTimeout(r, 500));

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = waUrl;
    } else {
      window.open(waUrl, '_blank');
    }

    setSuccess(true);
    setLoading(false);
    setLoadingText("Confirm Booking"); // Reset text after completion
    window.scrollTo(0, 0);
  };

  if (success) {
    return (
      <main className="page-container booking-success-page">
        <div className="success-container">
          <div className="success-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h1>Booking Confirmed!</h1>
          <p>Thank you for choosing CeylonExplorer. Redirecting you to WhatsApp...</p>
          <div className="success-message">
            <p>If WhatsApp does not open in a few seconds, please click the button below.</p>
            <p>Our team will contact you shortly to confirm the process.</p>
          </div>
          <div className="success-actions">
            <button onClick={() => navigate('/')} className="btn-primary" style={{ minWidth: '150px', justifyContent: 'center', backgroundColor: '#95a5a6' }}>
              Back to Home
            </button>
            <button onClick={() => navigate('/fleet')} className="btn-primary" style={{ minWidth: '150px', justifyContent: 'center', backgroundColor: '#2C3E50' }}>
              View Our Fleet
            </button>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                className="btn-primary"
                style={{ backgroundColor: '#25D366', borderColor: '#25D366', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                target={/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "_self" : "_blank"}
                rel="noopener noreferrer"
              >
                Open WhatsApp
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </a>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container booking-page">
      <Helmet>
        <title>CeylonExplorer | Book Your Journey - Secure Online Booking</title>
        <meta name="description" content="Book your vehicle online with CeylonExplorer. Easy, secure, and fast booking process for your Sri Lankan tour vehicle." />
      </Helmet>
      <div className="page-hero">
        <div className="container">
          <h1>Book Your Journey</h1>
          <p>Complete the form below to reserve your vehicle. We'll confirm your booking within 24 hours.</p>
        </div>
      </div>

      <div className="container">
        <div className="booking-layout">
          <div className="booking-form-container">
            {error && (
              <div className="error-alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}

            <form className="booking-form-modern" onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Vehicle Selection</h3>
                {formData.vehicleId && formData.pickupDate && formData.dropoffDate && !currentVehicleAvailability.available && (
                  <div className="warning-alert" style={{ marginBottom: '1rem', padding: '10px', background: '#fff3cd', color: '#856404', borderRadius: '4px', border: '1px solid #ffeeba' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'text-bottom' }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <strong>Note:</strong> The selected vehicle is already booked for these dates ({currentVehicleAvailability.reason}). Please choose different dates or another vehicle.
                  </div>
                )}
                <div className="form-group-modern">
                  <label htmlFor="vehicleId">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" />
                      <polygon points="12 15 17 21 7 21 12 15" />
                    </svg>
                    Select Vehicle
                  </label>
                  <select
                    id="vehicleId"
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Choose your vehicle</option>
                    {vehicles.map(v => {
                      const { available, reason } = getVehicleAvailability(v.id);
                      return (
                        <option key={v.id} value={v.id} disabled={!available} style={{ color: available ? 'inherit' : '#999' }}>
                          {v.name} {available ? '' : `(${reason})`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3>Rental Period</h3>
                <div className="form-row-modern">
                  <div className="form-group-modern">
                    <label htmlFor="pickupDate">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      Pick-up Date
                    </label>
                    <input type="date" id="pickupDate" name="pickupDate" required value={formData.pickupDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} />
                  </div>

                  <div className="form-group-modern">
                    <label htmlFor="dropoffDate">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      Drop-off Date
                    </label>
                    <input type="date" id="dropoffDate" name="dropoffDate" required value={formData.dropoffDate} onChange={handleChange} min={formData.pickupDate || new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Location Details</h3>
                <div className="form-group-modern">
                  <label htmlFor="pickupLocation">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    Pick-up Location
                  </label>
                  <input
                    type="text"
                    id="pickupLocation"
                    name="pickupLocation"
                    list="tour-locations"
                    placeholder="Select or type a location"
                    required
                    value={formData.pickupLocation}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group-modern">
                  <label htmlFor="dropoffLocation">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    Drop-off Location
                  </label>
                  <input
                    type="text"
                    id="dropoffLocation"
                    name="dropoffLocation"
                    list="tour-locations"
                    placeholder="Select or type a location"
                    required
                    value={formData.dropoffLocation}
                    onChange={handleChange}
                  />
                </div>

                <datalist id="tour-locations">
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>

              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-group-modern">
                  <label htmlFor="name">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Full Name
                  </label>
                  <input type="text" id="name" name="name" placeholder="Enter your full name" required value={formData.name} onChange={handleChange} />
                </div>

                <div className="form-row-modern">
                  <div className="form-group-modern">
                    <label htmlFor="email">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      Email Address
                    </label>
                    <input type="email" id="email" name="email" placeholder="your@email.com" required value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="form-group-modern">
                    <label htmlFor="phone">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      Phone Number
                    </label>
                    <input type="tel" id="phone" name="phone" placeholder="+94 76 743 9588" required value={formData.phone} onChange={handleChange} />
                  </div>
                </div>

                <div className="form-group-modern">
                  <label htmlFor="notes">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <line x1="10" y1="9" x2="8" y2="9"></line>
                    </svg>
                    Special Requests (Optional)
                  </label>
                  <textarea id="notes" name="notes" rows="4" placeholder="Any special requests or notes for your journey?" value={formData.notes} onChange={handleChange}></textarea>
                </div>
              </div>

              <button type="submit" className="btn-submit-booking" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner-small"></div>
                    {loadingText}
                  </>
                ) : (
                  <>
                    Confirm Booking
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="booking-sidebar">
            <div className="booking-info-card">
              <h3>Why Book With Us?</h3>
              <ul className="benefits-list">
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Free cancellation up to 24 hours</span>
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Professional licensed drivers</span>
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Well-maintained vehicles</span>
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>24/7 customer support</span>
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Transparent pricing</span>
                </li>
              </ul>
            </div>

            <div className="booking-info-card">
              <h3>Need Help?</h3>
              <p>Our team is here to assist you with your booking.</p>
              <div className="contact-info">
                <a href="tel:+94767439588">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  +94 76 743 9588
                </a>
                <a href="mailto:paranamannayomall@gmail.com">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  paranamannayomall@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

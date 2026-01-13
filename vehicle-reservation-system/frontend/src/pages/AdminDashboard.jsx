import React, { useCallback, useEffect, useState } from 'react';
import { fetchBookingsByStatus, updateBookingStatus, fetchBookingsForVehicle } from '../lib/firestore';
import { overlaps } from '../lib/dateOverlap';
import { signOutAdmin } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [status, setStatus] = useState('PENDING'); // Uppercase default
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await fetchBookingsByStatus(status);
      // Ensure we only get what we asked for (though API handles it)
      setBookings(data);
    } catch {
      setActionError("Failed to fetch bookings.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleLogout = async () => {
    await signOutAdmin();
    navigate('/admin/login');
  };

  const handleApprove = async (booking) => {
    // Non-blocking interaction
    setProcessingId(booking.id);
    setActionError(null);

    try {
      // RE-CHECK CONFLICTS
      const existingBookings = await fetchBookingsForVehicle(booking.vehicleId);
      // Filter out self if somehow it's in the list
      const conflicts = existingBookings.filter(b =>
        b.id !== booking.id &&
        overlaps(booking.startDate, booking.endDate, b.startDate, b.endDate)
      );

      if (conflicts.length > 0) {
        throw new Error(`Conflict detected! Overlaps with booking ID: ${conflicts[0].id}`);
      }

      await updateBookingStatus(booking.id, 'APPROVED', adminNote);
      console.log("Booking approved successfully");
      setExpandedId(null);
      setAdminNote("");
      loadBookings();
    } catch (err) {
      console.error("Approve error:", err);
      setActionError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (bookingId) => {
    // Non-blocking interaction
    setProcessingId(bookingId);
    setActionError(null);

    try {
      await updateBookingStatus(bookingId, 'REJECTED', adminNote);
      console.log("Booking rejected successfully");
      setExpandedId(null);
      setAdminNote("");
      loadBookings();
    } catch (err) {
      console.error("Reject error:", err);
      setActionError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setAdminNote("");
    } else {
      setExpandedId(id);
      setAdminNote("");
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'PENDING':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        );
      case 'APPROVED':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'REJECTED':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="admin-dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header-modern">
          <div className="dashboard-title">
            <div className="dashboard-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </div>
            <div>
              <h1>Admin Dashboard</h1>
              <p>Manage bookings and reservations</p>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"></path>
            </svg>
            Logout
          </button>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon pending">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Pending</span>
              <span className="stat-value">{bookings.filter(b => b.status === 'PENDING').length}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon approved">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Approved</span>
              <span className="stat-value">{bookings.filter(b => b.status === 'APPROVED').length}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon rejected">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Rejected</span>
              <span className="stat-value">{bookings.filter(b => b.status === 'REJECTED').length}</span>
            </div>
          </div>
        </div>

        <div className="tabs-modern">
          {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
            <button
              key={s}
              className={status === s ? 'tab-btn active' : 'tab-btn'}
              onClick={() => setStatus(s)}
            >
              {s === status && getStatusIcon()}
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {actionError && (
          <div className="alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading bookings...</p>
          </div>
        ) : (
          <div className="bookings-grid">
            {bookings.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <h3>No {status.toLowerCase()} bookings</h3>
                <p>There are currently no bookings with this status.</p>
              </div>
            ) : (
              bookings.map(b => (
                <div key={b.id} className={`booking-card-modern ${b.status.toLowerCase()}`}>
                  <div className="booking-card-header" onClick={() => toggleExpand(b.id)}>
                    <div className="booking-main-info">
                      <div className="vehicle-name">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" />
                          <polygon points="12 15 17 21 7 21 12 15" />
                        </svg>
                        <strong>{b.vehicleName}</strong>
                      </div>
                      <div className="booking-dates">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {b.startDate} → {b.endDate}
                      </div>
                    </div>
                    <div className="booking-meta-info">
                      <span className="customer-name">{b.customerName || b.name}</span>
                      <span className="location-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        {b.pickupLocation || b.location}
                      </span>
                    </div>
                    <div className="expand-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expandedId === b.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>

                  {expandedId === b.id && (
                    <div className="booking-card-details">
                      <div className="details-grid">
                        <div className="detail-item">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                          </svg>
                          <div>
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{b.customerEmail || b.email}</span>
                          </div>
                        </div>
                        <div className="detail-item">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                          <div>
                            <span className="detail-label">Phone</span>
                            <span className="detail-value">{b.phoneNumber || b.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {b.notes && (
                        <div className="notes-section">
                          <strong>User Notes:</strong>
                          <p>{b.notes}</p>
                        </div>
                      )}

                      {b.adminNote && (
                        <div className="notes-section admin">
                          <strong>Admin Note:</strong>
                          <p>{b.adminNote}</p>
                        </div>
                      )}

                      {status === 'PENDING' && (
                        <div className="admin-actions-modern">
                          <textarea
                            placeholder="Add a note for this booking (optional)"
                            value={adminNote}
                            onChange={e => setAdminNote(e.target.value)}
                            rows="3"
                          />
                          <div className="action-buttons-modern">
                            <button
                              className="btn-approve"
                              onClick={() => handleApprove(b)}
                              disabled={processingId === b.id}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                              {processingId === b.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => handleReject(b.id)}
                              disabled={processingId === b.id}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                              </svg>
                              {processingId === b.id ? 'Processing...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

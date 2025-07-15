import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { parseJwt, getToken } from '../utils';

const RegisteredEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'
  const [currentPage, setCurrentPage] = useState(1);
  const [qrImages, setQrImages] = useState({});
  const [loadingQrIds, setLoadingQrIds] = useState([]);
  const [loadingUnregisterIds, setLoadingUnregisterIds] = useState([]);
  const [expandedEvents, setExpandedEvents] = useState(new Set()); // Track expanded event details

  const EVENTS_PER_PAGE = 5;

  const token = getToken();
  const userId = token ? parseJwt(token)?.id : null;

  useEffect(() => {
    fetchRegisteredEvents();
  }, []);

  // Fetch user's registered events from backend
  const fetchRegisteredEvents = async () => {
    try {
      const res = await API.get('/user/registrations');
      setEvents(res.data);
    } catch (err) {
      console.error('Error fetching events', err);
      alert('Failed to load your registered events.');
    }
  };

  // Handle user unregistering from an event
  const handleUnregister = async (eventId) => {
    if (loadingUnregisterIds.includes(eventId)) return;
    setLoadingUnregisterIds((prev) => [...prev, eventId]);

    try {
      await API.delete(`/events/deregister/${eventId}`);
      await fetchRegisteredEvents();
      setQrImages((prev) => {
        const newState = { ...prev };
        delete newState[eventId];
        return newState;
      });
    } catch (err) {
      alert(err.response?.data?.error || 'Error unregistering');
    } finally {
      setLoadingUnregisterIds((prev) => prev.filter((id) => id !== eventId));
    }
  };

  // Request QR code generation for an event registration
  const handleGetQr = async (event) => {
    if (loadingQrIds.includes(event._id)) return;
    setLoadingQrIds((prev) => [...prev, event._id]);

    try {
      // Extract the organizer ID correctly
      const organizerId = event.organizerId || event.organizer?._id || event.organizer?.id || event.organizer;
      
      const res = await API.post('/qr/generate', {
        organizerId: organizerId,
        userId,
        eventId: event._id,
      });

      setQrImages((prev) => ({
        ...prev,
        [event._id]: res.data.qrImage,
      }));
    } catch (err) {
      const msg = err.response?.data?.msg || 'QR generation failed';
      console.error('QR generation error:', err);
      console.error('Error details:', err.response?.data);
      alert(`❌ ${msg}`);
    } finally {
      setLoadingQrIds((prev) => prev.filter((id) => id !== event._id));
    }
  };

  // Toggle event details expansion
  const toggleEventDetails = (eventId) => {
    setExpandedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  // Filter events based on selected tab (upcoming or past)
  const filtered = events.filter((e) =>
    activeTab === 'upcoming' ? e.status === 'active' : e.status === 'past'
  );

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / EVENTS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE
  );

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Your Registered Events</h1>
          <p className="page-subtitle">Manage your event registrations and access QR codes</p>
        </div>

        {/* Tabs */}
        <div className="tabs-container" style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <button
            onClick={() => {
              setActiveTab('upcoming');
              setCurrentPage(1);
          }}
          className={`btn ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Upcoming
        </button>
        <button
          onClick={() => {
            setActiveTab('past');
            setCurrentPage(1);
          }}
          className={`btn ${activeTab === 'past' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Past
        </button>
        </div>

      {/* Event List */}
      {paginated.length === 0 ? (
        <div className="empty-state">
          <h3>No {activeTab} events found</h3>
          <p>You haven't registered for any {activeTab} events yet.</p>
        </div>
      ) : (
        <div className="grid">
          {paginated.map((e) => (
            <div key={e._id} className="card event-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">{e.title}</h3>
                  <p className="card-subtitle">
                    {new Date(e.date).toLocaleDateString()} • {e.startTime} - {e.endTime}
                  </p>
                </div>
                <div className="status-badges">
                  <span className={`status-badge ${e.status === 'cancelled' ? 'status-cancelled' : e.status === 'active' ? 'status-active' : 'status-past'}`}>
                    {e.status}
                  </span>
                  {e.registrationStatus && (
                    <span className={`status-badge ${
                      e.registrationStatus === 'registered' ? 'status-registered' : 
                      e.registrationStatus === 'pending' ? 'status-pending' : 
                      e.registrationStatus === 'waitlist' ? 'status-waitlist' : 'status-registered'
                    }`}>
                      {e.registrationStatus === 'registered' ? 'Registered' : 
                       e.registrationStatus === 'pending' ? 'Pending Approval' : 
                       e.registrationStatus === 'waitlist' ? 'On Waitlist' : 'Registered'}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="card-content">
                <p className="event-description">{e.description}</p>
                
                <div className="event-meta">
                  <span className="meta-item">
                    <span className="meta-icon">🏷️</span>
                    <span>{e.eventType || 'N/A'}</span>
                  </span>
                  {e.eventType !== 'Online' && (
                    <span className="meta-item">
                      <span className="meta-icon">📍</span>
                      <span>{e.venueName || 'N/A'} ({e.city || 'N/A'})</span>
                    </span>
                  )}
                  <span className="meta-item">
                    <span className="meta-icon">👥</span>
                    <span>{e.attendeesCount || 0}/{e.maxAttendees || 'Unlimited'}</span>
                  </span>
                  <span className="meta-item">
                    <span className="meta-icon">⏰</span>
                    <span>Deadline: {e.registrationDeadline ? new Date(e.registrationDeadline).toLocaleDateString() : 'None'}</span>
                  </span>
                </div>

                {/* Expandable event details */}
                {expandedEvents.has(e._id) && (
                  <div className="event-details">
                    <div className="details-grid">
                      <div className="details-column">
                        <h4 className="details-title">Event Details</h4>
                        <p className="details-item">
                          <span className="details-label">Date:</span>
                          <span>{e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}</span>
                        </p>
                        <p className="details-item">
                          <span className="details-label">End Date:</span>
                          <span>{e.endDate ? new Date(e.endDate).toLocaleDateString() : 'N/A'}</span>
                        </p>
                        <p className="details-item">
                          <span className="details-label">Time:</span>
                          <span>{e.startTime || 'N/A'} - {e.endTime || 'N/A'}</span>
                        </p>
                        <p className="details-item">
                          <span className="details-label">City:</span>
                          <span>{e.city || 'N/A'}</span>
                        </p>
                        <p className="details-item">
                          <span className="details-label">Address:</span>
                          <span>{e.address || 'N/A'}</span>
                        </p>
                        <p className="details-item">
                          <span className="details-label">Registration Deadline:</span>
                          <span>{e.registrationDeadline ? new Date(e.registrationDeadline).toLocaleString() : 'N/A'}</span>
                        </p>
                      </div>
                      <div className="details-column">
                        <h4 className="details-title">Event Information</h4>
                        <p className="details-item">
                          <span className="details-label">Category:</span>
                          <span>{e.category || 'N/A'}</span>
                        </p>
                        <p className="details-item">
                          <span className="details-label">Organizer:</span>
                          <span>{e.organizerName || 'N/A'}</span>
                        </p>
                        <p className="details-item">
                          <span className="details-label">Organizer Email:</span>
                          <span>{e.organizerEmail || 'N/A'}</span>
                        </p>
                        <p className="details-item">
                          <span className="details-label">Current Attendees:</span>
                          <span>{e.attendeesCount || 0}</span>
                        </p>
                        <p className="details-item">
                          <span className="details-label">Max Attendees:</span>
                          <span>{e.maxAttendees || 'Unlimited'}</span>
                        </p>
                        <p className="details-item">
                          <span className="details-label">Requires Approval:</span>
                          <span>{e.requireApproval ? 'Yes' : 'No'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Links section */}
                    <div className="links-section">
                      <h4 className="details-title">Links</h4>
                      <div className="links-grid">
                        {e.onlineLink && (
                          <div className="details-item">
                            <span className="details-label">Online Meeting:</span>
                            <a href={e.onlineLink} target="_blank" rel="noopener noreferrer" className="event-link">
                              🔗 Join Event
                            </a>
                          </div>
                        )}
                        {e.mapLink && (
                          <div className="details-item">
                            <span className="details-label">Location Map:</span>
                            <a href={e.mapLink} target="_blank" rel="noopener noreferrer" className="event-link">
                              🗺️ View Map
                            </a>
                          </div>
                        )}
                        {e.website && (
                          <div className="details-item">
                            <span className="details-label">Website:</span>
                            <a href={e.website} target="_blank" rel="noopener noreferrer" className="event-link">
                              🌐 Visit Website
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags section */}
                    {e.tags && e.tags.length > 0 && (
                      <div className="tags-section">
                        <h4 className="details-title">Tags</h4>
                        <div className="event-tags">
                          {e.tags.map((tag, index) => (
                            <span key={index} className="event-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Show buttons only for upcoming events */}
                {activeTab === 'upcoming' && (
                  <div className="card-actions">
                    <button
                      onClick={() => toggleEventDetails(e._id)}
                      className="btn btn-secondary details-toggle"
                    >
                      {expandedEvents.has(e._id) ? 'Hide Details' : 'Show Details'}
                    </button>

                    <button
                      onClick={() => handleUnregister(e._id)}
                      disabled={loadingUnregisterIds.includes(e._id)}
                      className="btn btn-danger"
                    >
                      {loadingUnregisterIds.includes(e._id) ? 'Unregistering...' : 'Unregister'}
                    </button>

                    {/* Only show QR code button for fully registered users */}
                    {e.registrationStatus === 'registered' && (
                      <button
                        onClick={() => handleGetQr(e)}
                        disabled={loadingQrIds.includes(e._id)}
                        className="btn btn-success"
                      >
                        {loadingQrIds.includes(e._id) ? 'Generating QR...' : 'Get QR Code'}
                      </button>
                    )}
                    
                    {/* Show status message for pending/waitlist users */}
                    {e.registrationStatus === 'pending' && (
                      <span className="registration-note">
                        ⏳ Waiting for organizer approval
                      </span>
                    )}
                    
                    {e.registrationStatus === 'waitlist' && (
                      <span className="registration-note">
                        📝 You're on the waitlist
                      </span>
                    )}
                  </div>
                )}

                {/* Show details button for past events too */}
                {activeTab === 'past' && (
                  <div className="card-actions">
                    <button
                      onClick={() => toggleEventDetails(e._id)}
                      className="btn btn-secondary details-toggle"
                    >
                      {expandedEvents.has(e._id) ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                )}

                {/* Display QR Code image and download link */}
                {qrImages[e._id] && (
                  <div style={{ marginTop: '15px' }}>
                    <p><strong>Your QR Code:</strong></p>
                    <img
                      src={qrImages[e._id]}
                      alt="QR Code"
                      style={{ width: '180px', borderRadius: '8px' }}
                    />
                    <br />
                    <a
                      href={qrImages[e._id]}
                      download={`QR_${e.title || 'event'}.png`}
                      className="btn btn-primary"
                      style={{ marginTop: '10px' }}
                    >
                      Download QR Code
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button 
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} 
            disabled={currentPage === 1}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} 
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

export default RegisteredEventsPage;


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
      await API.delete(`/event/deregister/${eventId}`);
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
      const res = await API.post('/qr/generate', {
        organizerId: event.organizer,
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
      alert(`❌ ${msg}`);
    } finally {
      setLoadingQrIds((prev) => prev.filter((id) => id !== event._id));
    }
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
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h2>Your Registered Events</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <button
          onClick={() => {
            setActiveTab('upcoming');
            setCurrentPage(1);
          }}
          style={{
            backgroundColor: activeTab === 'upcoming' ? '#007bff' : '#ccc',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Upcoming
        </button>
        <button
          onClick={() => {
            setActiveTab('past');
            setCurrentPage(1);
          }}
          style={{
            backgroundColor: activeTab === 'past' ? '#007bff' : '#ccc',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Past
        </button>
      </div>

      {/* Event List */}
      {paginated.length === 0 ? (
        <p>No {activeTab} events found.</p>
      ) : (
        paginated.map((e) => (
          <div
            key={e._id}
            style={{
              border: '1px solid #ddd',
              padding: 12,
              marginBottom: 16,
              borderRadius: 6,
              backgroundColor:
                e.status === 'cancelled'
                  ? '#f8d7da'
                  : activeTab === 'upcoming'
                  ? '#d4edda'
                  : '#f1f1f1',
            }}
          >
            <h4>{e.title}</h4>
            <p>{e.description}</p>
            <p>
              <strong>Date:</strong>{' '}
              {new Date(e.date).toLocaleDateString()} | <strong>Time:</strong>{' '}
              {e.startTime} - {e.endTime}
            </p>
            <p>
              <strong>Type:</strong> {e.eventType || 'N/A'}{' '}
              {e.eventType !== 'Online' && (
                <>
                  | <strong>Venue:</strong> {e.venueName || 'N/A'} ({e.city || 'N/A'})
                </>
              )}
            </p>
            <p>
              <strong>Status:</strong> {e.status}
            </p>

            {/* Show buttons only for upcoming events */}
            {activeTab === 'upcoming' && (
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => handleUnregister(e._id)}
                  disabled={loadingUnregisterIds.includes(e._id)}
                  style={{
                    marginRight: 10,
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    cursor: loadingUnregisterIds.includes(e._id) ? 'not-allowed' : 'pointer',
                    opacity: loadingUnregisterIds.includes(e._id) ? 0.7 : 1,
                  }}
                >
                  {loadingUnregisterIds.includes(e._id) ? 'Unregistering...' : 'Unregister'}
                </button>

                <button
                  onClick={() => handleGetQr(e)}
                  disabled={loadingQrIds.includes(e._id)}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    cursor: loadingQrIds.includes(e._id) ? 'not-allowed' : 'pointer',
                    opacity: loadingQrIds.includes(e._id) ? 0.7 : 1,
                  }}
                >
                  {loadingQrIds.includes(e._id) ? 'Generating QR...' : 'Get QR Code'}
                </button>
              </div>
            )}

            {/* Display QR Code image and download link */}
            {qrImages[e._id] && (
              <div style={{ marginTop: 15 }}>
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
                  style={{
                    display: 'inline-block',
                    marginTop: '10px',
                    padding: '6px 12px',
                    backgroundColor: '#2196f3',
                    color: '#fff',
                    borderRadius: '4px',
                    textDecoration: 'none',
                  }}
                >
                  Download QR Code
                </a>
              </div>
            )}
          </div>
        ))
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          style={{
            marginTop: 20,
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default RegisteredEventsPage;


import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const ManageEvents = () => {
  const [myEvents, setMyEvents] = useState([]);
  const [loadingCancelIds, setLoadingCancelIds] = useState([]);
  const navigate = useNavigate();

  // Fetch events created by the current organizer
  const fetchMyEvents = useCallback(async () => {
    try {
      const res = await API.get('/event/my-events');
      const events = res.data;

      // Sort events by status and date: active first, then past, then cancelled
      const statusOrder = { active: 0, past: 1, cancelled: 2 };
      const sorted = [...events].sort((a, b) => {
        if (a.status === b.status) return new Date(a.date) - new Date(b.date);
        return statusOrder[a.status] - statusOrder[b.status];
      });

      setMyEvents(sorted);
    } catch (err) {
      console.error('Error fetching events:', err);
      alert('Failed to load your events.');
    }
  }, []);

  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);

  // Cancel an event by id
  const cancelEvent = async (id) => {
    if (loadingCancelIds.includes(id)) return;

    setLoadingCancelIds((prev) => [...prev, id]);
    try {
      await API.put(`/event/cancel/${id}`);
      alert('Event cancelled successfully.');
      await fetchMyEvents();
    } catch (err) {
      console.error('Cancel event error:', err);
      alert('Failed to cancel event.');
    } finally {
      setLoadingCancelIds((prev) => prev.filter((eId) => eId !== id));
    }
  };

  // Approve a pending attendee
  const handleApprove = async (eventId, userId) => {
    try {
      await API.post(`/event/${eventId}/approve/${userId}`);
      alert('User approved successfully');
      await fetchMyEvents(); // refresh to update pending list and attendees
    } catch (err) {
      console.error(err);
      alert('Failed to approve user');
    }
  };
  const handleReject = async (eventId, userId) => {
  try {
    await API.post(`/event/${eventId}/reject/${userId}`);
    alert('User rejected successfully');
    await fetchMyEvents(); // Refresh list
  } catch (err) {
    console.error(err);
    alert('Failed to reject user');
  }
};

  // Navigate to QR scanner for the event (only enabled if event is today)
  const goToQRScanner = (eventId, organizerId) => {
    navigate(`/scan-attendees/${eventId}/${organizerId}`);
  };

  // Check if event date is today
  const isToday = useCallback((dateStr) => {
    const today = new Date();
    const eventDate = new Date(dateStr);
    return (
      today.getFullYear() === eventDate.getFullYear() &&
      today.getMonth() === eventDate.getMonth() &&
      today.getDate() === eventDate.getDate()
    );
  }, []);

  // Returns a badge style object for event status
  const getStatusBadge = (status) => {
    const colorMap = {
      active: '#4caf50',    // Green
      past: '#607d8b',      // Blue Grey
      cancelled: '#f44336', // Red
    };
    return {
      backgroundColor: colorMap[status] || '#ccc',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.85rem',
      fontWeight: 'bold',
      display: 'inline-block',
      textTransform: 'capitalize',
    };
  };

  return (
    <div style={{ padding: '20px', maxWidth: 1000, margin: 'auto' }}>
      <h2>My Events</h2>
      {myEvents.length === 0 ? (
        <p>You have no events.</p>
      ) : (
        myEvents.map((e) => (
          <div
            key={e._id}
            style={{
              border: '1px solid #ddd',
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              display: 'flex',
              gap: '16px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            }}
          >
            {e.posterImage && (
              <img
                src={e.posterImage}
                alt="poster"
                style={{ width: 140, height: 140, borderRadius: 8, objectFit: 'cover' }}
              />
            )}
            <div style={{ flex: 1 }}>
              <h3>{e.title || 'Untitled Event'}</h3>
              <div style={{ marginBottom: 10 }}>
                <span style={getStatusBadge(e.status)}>{e.status}</span>
              </div>
              <p>{e.description || 'No description provided.'}</p>
              <p>
                <strong>Date:</strong>{' '}
                {e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}
              </p>
              <p>
                <strong>Time:</strong>{' '}
                {e.startTime && e.endTime ? `${e.startTime} – ${e.endTime}` : 'N/A'}
              </p>

              {/* Pending attendees approval section */}
              
              {e.requireApproval && e.pendingAttendees?.length > 0 && (
  <div style={{ marginTop: 20 }}>
    <h4>Pending Attendee Approvals</h4>
    {e.pendingAttendees.map((att) => (
      <div key={att._id} style={{ marginBottom: 8 }}>
        <span>
          {att.name} ({att.email})
        </span>
        <button
          onClick={() => handleApprove(e._id, att._id)}
          style={{
            marginLeft: 10,
            padding: '4px 8px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Approve
        </button>

        <button
          onClick={() => handleReject(e._id, att._id)}
          style={{
            marginLeft: 8,
            padding: '4px 8px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Reject
        </button>
      </div>
    ))}
    
  </div>
)}


              <div style={{ marginTop: 12 }}>
                {e.status === 'active' && (
                  <>
                    <button
                      onClick={() => cancelEvent(e._id)}
                      disabled={loadingCancelIds.includes(e._id)}
                      style={{
                        marginRight: '10px',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: loadingCancelIds.includes(e._id) ? 'not-allowed' : 'pointer',
                        backgroundColor: loadingCancelIds.includes(e._id) ? '#ccc' : '#f44336',
                        color: '#fff',
                      }}
                    >
                      {loadingCancelIds.includes(e._id) ? 'Cancelling...' : 'Cancel Event'}
                    </button>

                    <button
                      onClick={() => goToQRScanner(e._id, e.organizerId)}
                      // disabled={!isToday(e.date)}
                      style={{
                        backgroundColor: isToday(e.date) ? '#4caf50' : '#aaa',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: isToday(e.date) ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Open QR Scanner
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ManageEvents;

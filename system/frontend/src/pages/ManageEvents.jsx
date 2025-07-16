import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const ManageEvents = () => {
  const [myEvents, setMyEvents] = useState([]);
  const [loadingCancelIds, setLoadingCancelIds] = useState([]);
  const [expandedEvents, setExpandedEvents] = useState(new Set());
  const navigate = useNavigate();

  // Fetch events created by the current organizer
  const fetchMyEvents = async () => {
    try {
      const res = await API.get('/events/my-events');
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
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  // Cancel an event by id
  const cancelEvent = async (id) => {
    if (loadingCancelIds.includes(id)) return;

    setLoadingCancelIds((prev) => [...prev, id]);
    try {
      await API.put(`/events/cancel/${id}`);
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
      await API.post(`/events/${eventId}/approve/${userId}`);
      alert('User approved successfully');
      await fetchMyEvents(); // refresh to update pending list and attendees
    } catch (err) {
      console.error(err);
      alert('Failed to approve user');
    }
  };
  const handleReject = async (eventId, userId) => {
  try {
    await API.post(`/events/${eventId}/reject/${userId}`);
    alert('User rejected successfully');
    await fetchMyEvents(); // Refresh list
  } catch (err) {
    console.error(err);
    alert('Failed to reject user');
  }
};

  // Navigate to QR scanner for the event
  const goToQRScanner = (eventId, event) => {
    // Use the organizerId field returned by the backend
    const organizerId = event.organizerId || 
                       event.organizer?._id || 
                       event.organizer;
    
    if (!organizerId) {
      alert('Error: Cannot determine organizer ID for this event');
      return;
    }
    
    navigate(`/scan-attendees/${eventId}/${organizerId}`);
  };

  // Navigate to edit event page
  const goToEditEvent = (eventId) => {
    navigate(`/edit-event/${eventId}`);
  };

  // Returns a badge style object for event status
  const getStatusBadge = (status) => {
    const statusClasses = {
      'active': 'status-badge status-active',
      'cancelled': 'status-badge status-cancelled',
      'past': 'status-badge status-past'
    };
    return statusClasses[status] || 'status-badge status-pending';
  };

  // Toggle event details expansion
  const toggleEventDetails = (eventId) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Manage My Events</h1>
          <p className="page-subtitle">View and manage your created events</p>
        </div>
        
        {myEvents.length === 0 ? (
          <div className="empty-state">
            <h3>No events created yet</h3>
            <p>Create your first event to get started</p>
          </div>
        ) : (
          <div className="grid">
            {myEvents.map((e) => (
              <div key={e._id} className="card event-card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{e.title || 'Untitled Event'}</h3>
                    <p className="card-subtitle">
                      <span className="event-date">{e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}</span>
                      {e.startTime && e.endTime && (
                        <> • <span className="event-time">{e.startTime} – {e.endTime}</span></>
                      )}
                    </p>
                  </div>
                  <span className={getStatusBadge(e.status)}>{e.status}</span>
                </div>
                
                <div className="card-content">
                  <p className="event-description">{e.description || 'No description provided.'}</p>
                  
                  <div className="event-meta">
                    <span className="meta-item">
                      <span className="meta-icon">🏷️</span>
                      <span>{e.eventType || 'No type'}</span>
                    </span>
                    <span className="meta-item">
                      <span className="meta-icon">📍</span>
                      <span>{e.venueName || 'N/A'}</span>
                    </span>
                    <span className="meta-item">
                      <span className="meta-icon">👥</span>
                      <span>{e.attendees?.length || 0}/{e.maxAttendees || 'Unlimited'}</span>
                    </span>
                    {((e.pendingApprovals?.length || e.pendingAttendees?.length) > 0) && (
                      <span className="meta-item">
                        <span className="meta-icon">⏳</span>
                        <span>{(e.pendingApprovals?.length || e.pendingAttendees?.length) || 0} pending</span>
                      </span>
                    )}
                    <span className="meta-item">
                      <span className="meta-icon">⏰</span>
                      <span>Deadline: {e.registrationDeadline ? new Date(e.registrationDeadline).toLocaleDateString() : 'None'}</span>
                    </span>
                  </div>

                  {/* Always show pending approvals if any exist */}
                  {(e.pendingApprovals?.length > 0 || e.pendingAttendees?.length > 0) && (
                    <div className="pending-section-visible">
                      <h4 className="details-title">
                        Pending Approvals ({(e.pendingApprovals?.length || e.pendingAttendees?.length) || 0})
                      </h4>
                      <div className="pending-list">
                        {(e.pendingApprovals || e.pendingAttendees || []).map((u, i) => (
                          <div key={u._id || i} className="pending-item approval-item">
                            <span className="pending-user">{u.name} ({u.email})</span>
                            <div className="approval-actions">
                              <button
                                onClick={() => handleApprove(e._id, u._id)}
                                className="btn btn-success btn-small"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(e._id, u._id)}
                                className="btn btn-danger btn-small"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                            <span className="details-label">Registration Deadline:</span>
                            <span>{e.registrationDeadline ? new Date(e.registrationDeadline).toLocaleString() : 'N/A'}</span>
                          </p>
                        </div>
                        <div className="details-column">
                          <h4 className="details-title">Attendance</h4>
                          <p className="details-item">
                            <span className="details-label">Max Attendees:</span>
                            <span>{e.maxAttendees || 'Unlimited'}</span>
                          </p>
                          <p className="details-item">
                            <span className="details-label">Current Attendees:</span>
                            <span>{e.attendees?.length || 0}</span>
                          </p>
                          <p className="details-item">
                            <span className="details-label">Pending Approvals:</span>
                            <span>{(e.pendingApprovals?.length || e.pendingAttendees?.length) || 0}</span>
                          </p>
                          <p className="details-item">
                            <span className="details-label">Waitlist:</span>
                            <span>{e.waitlist?.length || 0}</span>
                          </p>
                          <p className="details-item">
                            <span className="details-label">Requires Approval:</span>
                            <span>{e.requireApproval ? 'Yes' : 'No'}</span>
                          </p>
                          <p className="details-item">
                            <span className="details-label">Waitlist Enabled:</span>
                            <span>{e.enableWaitlist ? 'Yes' : 'No'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Attendees section */}
                      <div className="attendees-section">
                        <h4 className="details-title">Attendees ({e.attendees?.length || 0})</h4>
                        {e.attendees?.length > 0 ? (
                          <div className="attendees-list">
                            <ul>
                              {e.attendees.map((attendee, idx) =>
                                attendee && typeof attendee === 'object' ? (
                                  <li key={attendee._id || idx} className="attendee-item"> 
                                    {attendee.name || 'Unnamed'} ({attendee.email || 'No email'})
                                  </li>
                                ) : (
                                  <li key={idx} className="attendee-item invalid">
                                    Invalid attendee
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        ) : (
                          <p className="no-data-message">No attendees yet</p>
                        )}
                      </div>

                      {/* Waitlist section */}
                      {e.waitlist?.length > 0 && (
                        <div className="waitlist-section">
                          <h4 className="details-title">Waitlist ({e.waitlist.length})</h4>
                          <ul className="waitlist-list">
                            {e.waitlist.map((u, i) => (
                              <li key={u._id || i} className="waitlist-item">
                                {u.name} ({u.email})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <button 
                    onClick={() => toggleEventDetails(e._id)}
                    className="btn btn-secondary details-toggle"
                  >
                    {expandedEvents.has(e._id) ? 'Hide Details' : 'More Details'}
                  </button>

                  {e.status === 'active' && (
                    <>
                      <button
                        onClick={() => goToEditEvent(e._id)}
                        className="btn btn-primary"
                        title="Edit event details"
                      >
                        Edit Event
                      </button>

                      <button
                        onClick={() => cancelEvent(e._id)}
                        disabled={loadingCancelIds.includes(e._id)}
                        className="btn btn-danger"
                      >
                        {loadingCancelIds.includes(e._id) ? 'Cancelling...' : 'Cancel Event'}
                      </button>

                      <button
                        onClick={() => goToQRScanner(e._id, e)}
                        className="btn btn-success"
                        title="Open QR Scanner for attendance verification"
                      >
                        Open QR Scanner
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEvents;

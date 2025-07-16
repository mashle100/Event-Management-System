import React, { useEffect, useState } from 'react';
import API from '../api/axios';

const AdminDashboard = () => {
  const [pending, setPending] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [events, setEvents] = useState([]);
  const [expandedEvents, setExpandedEvents] = useState(new Set());
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'organizers', 'users'
  const [selectedUser, setSelectedUser] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventGroups, setEventGroups] = useState({
    active: [],
    past: [],
    cancelled: []
  });
  const [expandedSections, setExpandedSections] = useState({
    active: true,
    past: false,
    cancelled: false
  });
  const [organizerEvents, setOrganizerEvents] = useState({});  // To store event counts for each organizer

  useEffect(() => {
    fetchPending();
    fetchUsers();
    fetchEvents();
  }, []);

  useEffect(() => {
    // Group events by status
    if (events.length > 0) {
      // Sort events by date (most recent first) within each category
      const sortEvents = (eventList) => {
        return [...eventList].sort((a, b) => new Date(b.date) - new Date(a.date));
      };
      
      const grouped = {
        active: sortEvents(events.filter(e => e.status === 'active')),
        past: sortEvents(events.filter(e => e.status === 'past')),
        cancelled: sortEvents(events.filter(e => e.status === 'cancelled'))
      };
      setEventGroups(grouped);
    }
  }, [events]);

  const fetchPending = async () => {
    try {
      const res = await API.get('/admin/pending-organizers');
      setPending(res.data);
    } catch (err) {
      console.error('Error fetching pending organizers', err);
      alert('Failed to load pending organizer requests');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      const users = res.data;
      const organizersList = users.filter(u => u.role === 'organizer');
      setOrganizers(organizersList);
      setAttendees(users.filter(u => ['attendee', 'organizer', 'admin'].includes(u.role)));
      
      // Fetch event counts for each organizer
      fetchOrganizerEventCounts(organizersList);
    } catch (err) {
      console.error('Error fetching users', err);
      alert('Failed to load users');
    }
  };
  
  // Fetch event counts for all organizers
  const fetchOrganizerEventCounts = async (organizersList) => {
    try {
      const eventCountsObj = {};
      
      // Using Promise.all to fetch all organizer event counts in parallel
      await Promise.all(organizersList.map(async (organizer) => {
        try {
          const res = await API.get(`/admin/organizer-events/${organizer._id}`);
          eventCountsObj[organizer._id] = res.data.length;
        } catch (error) {
          console.error(`Error fetching events for organizer ${organizer._id}:`, error);
          eventCountsObj[organizer._id] = 0;
        }
      }));
      
      setOrganizerEvents(eventCountsObj);
    } catch (err) {
      console.error('Error fetching organizer event counts:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await API.get('/admin/events');
      setEvents(res.data);
    } catch (err) {
      console.error('Error fetching events', err);
      alert('Failed to load events');
    }
  };

  const approve = async (id) => {
    try {
      await API.put(`/admin/approve-organizer/${id}`);
      fetchPending();
      fetchUsers();
    } catch (err) {
      console.error('Error approving organizer', err);
      alert('Failed to approve organizer request');
    }
  };

  const reject = async (id) => {
    try {
      await API.put(`/admin/reject-organizer/${id}`);
      fetchPending();
    } catch (err) {
      console.error('Error rejecting organizer', err);
      alert('Failed to reject organizer request');
    }
  };

  const removeOrganizerStatus = async (id) => {
    try {
      setLoading(true);
      await API.put(`/admin/remove-organizer/${id}`);
      alert('Organizer status removed successfully');
      fetchUsers();
      setSelectedUser(null); // Reset selected user to go back to the organizers list
      changeView('organizers');
    } catch (err) {
      console.error('Error removing organizer status', err);
      alert('Failed to remove organizer status');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEvents = async (userId) => {
    try {
      setLoading(true);
      const res = await API.get(`/admin/organizer-events/${userId}`);
      const eventsData = res.data;
      
      // Sort events by date (most recent first)
      const sortedEvents = [...eventsData].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      
      setUserEvents(sortedEvents);
      
      // Update the event count for this organizer
      setOrganizerEvents(prev => ({
        ...prev,
        [userId]: eventsData.length
      }));
    } catch (err) {
      console.error('Error fetching user events', err);
      alert('Failed to load user events');
      setUserEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const viewOrganizerDetails = (organizer) => {
    // If already in organizers view and viewing the same organizer, just refresh data
    if (activeView === 'organizers' && selectedUser && selectedUser._id === organizer._id) {
      fetchUserEvents(organizer._id);
      return;
    }
    setSelectedUser(organizer);
    fetchUserEvents(organizer._id);
    changeView('organizers');
  };

  const viewUserDetails = (user) => {
    // If already in users view and viewing the same user, just refresh data
    if (activeView === 'users' && selectedUser && selectedUser._id === user._id) {
      if (user.role === 'organizer') {
        fetchUserEvents(user._id);
      }
      return;
    }
    setSelectedUser(user);
    if (user.role === 'organizer') {
      fetchUserEvents(user._id);
    } else {
      setUserEvents([]);
    }
    changeView('users');
  };

  const toggleEventDetails = (eventId) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'active': 'status-badge status-active',
      'cancelled': 'status-badge status-cancelled',
      'past': 'status-badge status-past'
    };
    return statusClasses[status] || 'status-badge status-pending';
  };

  // Handle view changes and reset selected user when appropriate
  const changeView = (view) => {
    // If navigating to a different view, reset selected user
    if (view !== activeView) {
      setSelectedUser(null);
    }
    
    setActiveView(view);
  };

  // Renders the main dashboard view
  const renderDashboard = () => {
    // Calculate total events
    const totalEvents = events.length;
    
    return (
    <>
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2 className="section-title">Pending Organizer Requests</h2>
          {pending.length === 0 ? (
            <div className="empty-state">
              <h3>No pending requests</h3>
              <p>All organizer requests have been processed</p>
            </div>
          ) : (
            <div className="request-list">
              {pending.map(user => (
                <div key={user._id} className="card card-compact request-card">
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">{user.name}</h3>
                      <p className="card-subtitle">{user.email}</p>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button onClick={() => approve(user._id)} className="btn btn-success">
                      Approve
                    </button>
                    <button onClick={() => reject(user._id)} className="btn btn-danger">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h2 className="section-title">Quick Stats</h2>
          <div className="stats-grid">
            <div 
              className="card card-compact stats-card clickable"
              onClick={() => changeView('organizers')}
            >
              <div className="card-header">
                <div className="stats-icon organizer-icon">👥</div>
                <div>
                  <h3 className="card-title">{organizers.length}</h3>
                  <p className="card-subtitle">Active Organizers</p>
                </div>
              </div>
            </div>
            <div 
              className="card card-compact stats-card clickable"
              onClick={() => changeView('users')}
            >
              <div className="card-header">
                <div className="stats-icon user-icon">👤</div>
                <div>
                  <h3 className="card-title">{attendees.length}</h3>
                  <p className="card-subtitle">Total Users</p>
                </div>
              </div>
            </div>
            <div className="card card-compact stats-card">
              <div className="card-header">
                <div className="stats-icon event-icon">🎫</div>
                <div>
                  <h3 className="card-title">{events.length}</h3>
                  <p className="card-subtitle">Total Events</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-section events-section">
        <h2 className="section-title">Events</h2>
        
        {/* Active Events */}
        <div className="collapsible-section">
          <div 
            className="collapsible-header"
            onClick={() => toggleSection('active')}
          >
            <div className="header-content">
              <span className="status-indicator active"></span>
              <h3>Active Events ({eventGroups.active.length})</h3>
            </div>
            <span className="expand-icon">{expandedSections.active ? '▼' : '►'}</span>
          </div>
          
          {expandedSections.active && (
            <div className="collapsible-content">
              {eventGroups.active.length === 0 ? (
                <div className="empty-state">
                  <p>No active events found</p>
                </div>
              ) : (
                <div className="events-grid">
                  {eventGroups.active.map(e => renderEventCard(e))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Past Events */}
        <div className="collapsible-section">
          <div 
            className="collapsible-header"
            onClick={() => toggleSection('past')}
          >
            <div className="header-content">
              <span className="status-indicator past"></span>
              <h3>Past Events ({eventGroups.past.length})</h3>
            </div>
            <span className="expand-icon">{expandedSections.past ? '▼' : '►'}</span>
          </div>
          
          {expandedSections.past && (
            <div className="collapsible-content">
              {eventGroups.past.length === 0 ? (
                <div className="empty-state">
                  <p>No past events found</p>
                </div>
              ) : (
                <div className="events-grid">
                  {eventGroups.past.map(e => renderEventCard(e))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Cancelled Events */}
        <div className="collapsible-section">
          <div 
            className="collapsible-header"
            onClick={() => toggleSection('cancelled')}
          >
            <div className="header-content">
              <span className="status-indicator cancelled"></span>
              <h3>Cancelled Events ({eventGroups.cancelled.length})</h3>
            </div>
            <span className="expand-icon">{expandedSections.cancelled ? '▼' : '►'}</span>
          </div>
          
          {expandedSections.cancelled && (
            <div className="collapsible-content">
              {eventGroups.cancelled.length === 0 ? (
                <div className="empty-state">
                  <p>No cancelled events found</p>
                </div>
              ) : (
                <div className="events-grid">
                  {eventGroups.cancelled.map(e => renderEventCard(e))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

  // Renders the organizers list view
  const renderOrganizersView = () => (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="section-title">Active Organizers ({organizers.length})</h2>
        <button onClick={() => changeView('dashboard')} className="btn btn-secondary">
          Back to Dashboard
        </button>
      </div>

      {selectedUser ? (
        <div className="user-details">
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">{selectedUser.name}</h3>
                <p className="card-subtitle">{selectedUser.email}</p>
              </div>
              <span className="status-badge status-active">Organizer</span>
            </div>
            <div className="card-content">
              <p><strong>User ID:</strong> {selectedUser._id}</p>
              
              <div style={{ marginTop: '20px' }}>
                <h4>Events Organized</h4>
                {loading ? (
                  <p>Loading events...</p>
                ) : userEvents.length > 0 ? (
                  <div className="grid">
                    {userEvents.map(e => renderEventCard(e))}
                    <div className="events-timestamp">
                      <small>* Events are sorted with most recent first</small>
                    </div>
                  </div>
                ) : (
                  <p>No events organized yet</p>
                )}
              </div>
            </div>
            <div className="card-actions">
              <button 
                onClick={() => removeOrganizerStatus(selectedUser._id)}
                className="btn btn-danger"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Remove Organizer Status'}
              </button>
              <button 
                onClick={() => setSelectedUser(null)}
                className="btn btn-secondary"
              >
                View All Organizers
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid">
          {organizers.map(organizer => (
            <div key={organizer._id} className="card card-compact clickable" onClick={() => viewOrganizerDetails(organizer)}>
              <div className="card-header">
                <div>
                  <h3 className="card-title">{organizer.name}</h3>
                  <p className="card-subtitle">{organizer.email}</p>
                </div>
                <span className="status-badge status-active">Organizer</span>
              </div>
              <div className="card-content">
                <div className="user-stats">
                  <div className="stat-item">
                    <span className="stat-value">{organizerEvents[organizer._id] || 0}</span>
                    <span className="stat-label">Events Organized</span>
                  </div>
                </div>
              </div>
              <div className="card-actions">
                <button className="btn btn-primary">View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Renders the users list view
  const renderUsersView = () => (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="section-title">All Users ({attendees.length})</h2>
        <button onClick={() => changeView('dashboard')} className="btn btn-secondary">
          Back to Dashboard
        </button>
      </div>

      {selectedUser ? (
        <div className="user-details">
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">{selectedUser.name}</h3>
                <p className="card-subtitle">{selectedUser.email}</p>
              </div>
              <span className={`status-badge ${selectedUser.role === 'organizer' ? 'status-active' : 'status-pending'}`}>
                {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
              </span>
            </div>
            <div className="card-content">
              <p><strong>User ID:</strong> {selectedUser._id}</p>
              
              {selectedUser.role === 'organizer' && (
                <div style={{ marginTop: '20px' }}>
                  <h4>Events Organized</h4>
                  {loading ? (
                    <p>Loading events...</p>
                  ) : userEvents.length > 0 ? (
                    <div className="grid">
                      {userEvents.map(e => renderEventCard(e))}
                      <div className="events-timestamp">
                        <small>* Events are sorted with most recent first</small>
                      </div>
                    </div>
                  ) : (
                    <p>No events organized yet</p>
                  )}
                </div>
              )}
            </div>
            <div className="card-actions">
              {selectedUser.role === 'organizer' && (
                <button 
                  onClick={() => removeOrganizerStatus(selectedUser._id)}
                  className="btn btn-danger"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Remove Organizer Status'}
                </button>
              )}
              <button 
                onClick={() => setSelectedUser(null)}
                className="btn btn-secondary"
              >
                View All Users
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid">
          {attendees.map(user => (
            <div key={user._id} className="card card-compact clickable" onClick={() => viewUserDetails(user)}>
              <div className="card-header">
                <div>
                  <h3 className="card-title">{user.name}</h3>
                  <p className="card-subtitle">{user.email}</p>
                </div>
                <span className={`status-badge ${user.role === 'organizer' ? 'status-active' : user.role === 'admin' ? 'status-admin' : 'status-pending'}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
              <div className="card-content">
                <div className="user-stats">
                  <div className="stat-item">
                    <span className="stat-value">{user.role === 'organizer' ? '🎫' : '👤'}</span>
                    <span className="stat-label">{user.role === 'organizer' ? 'Event Organizer' : 'Attendee'}</span>
                  </div>
                </div>
              </div>
              <div className="card-actions">
                <button className="btn btn-primary">View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Helper function to render event cards
  const renderEventCard = (e) => (
    <div key={e._id} className="card event-card">
      <div className="card-header">
        <div>
          <h3 className="card-title">{e.title || 'Untitled Event'}</h3>
          <p className="card-subtitle">
            <span className="organizer-name">{e.organizerName}</span> • <span className="event-date">{new Date(e.date).toLocaleDateString()}</span>
          </p>
        </div>
        <span className={getStatusBadge(e.status)}>{e.status || 'unknown'}</span>
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
          <span className="meta-item">
            <span className="meta-icon">⏰</span>
            <span>Deadline: {e.registrationDeadline ? new Date(e.registrationDeadline).toLocaleDateString() : 'None'}</span>
          </span>
        </div>
        
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
                  <span>{e.pendingApprovals?.length || 0}</span>
                </p>
                <p className="details-item">
                  <span className="details-label">Waitlist:</span>
                  <span>{e.waitlist?.length || 0}</span>
                </p>
                <p className="details-item">
                  <span className="details-label">Requires Approval:</span>
                  <span>{e.requireApproval ? 'Yes' : 'No'}</span>
                </p>
              </div>
            </div>

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

            {e.pendingApprovals?.length > 0 && (
              <div className="pending-section">
                <h4 className="details-title">Pending Approvals ({e.pendingApprovals.length})</h4>
                <ul className="pending-list">
                  {e.pendingApprovals.map((u, i) => (
                    <li key={u._id || i} className="pending-item">
                      {u.name} ({u.email})
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1 
            className="page-title" 
            onClick={() => changeView('dashboard')} 
            style={{ cursor: 'pointer' }}
          >
            Admin Dashboard
          </h1>
          <p className="page-subtitle">Manage users, events, and organizer requests</p>
        </div>

        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'organizers' && renderOrganizersView()}
        {activeView === 'users' && renderUsersView()}
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useEffect, useState } from 'react';
import API from '../api/axios';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [eventHistory, setEventHistory] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchStats();
      fetchEventHistory();
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/user/profile');
      setProfile(res.data);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch user's registered events to calculate attendee stats
      const registeredRes = await API.get('/user/registrations');
      const registeredEvents = registeredRes.data || [];
      
      // Calculate attendee statistics
      const now = new Date();
      const upcomingRegistered = registeredEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate > now && event.status !== 'cancelled';
      });
      const pastRegistered = registeredEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate <= now || event.status === 'past';
      });
      
      let organizerStats = {
        totalOrganized: 0,
        activeEvents: 0,
        pastEvents: 0,
        cancelledEvents: 0,
        totalAttendees: 0,
        averageAttendance: 0,
        isOrganizer: false
      };
      
      // Check if user has organizer role AND can access organizer endpoints
      if (profile.role === 'organizer') {
        // Try to fetch organizer-specific stats (this will fail if user is not an organizer)
        try {
          const organizedRes = await API.get('/events/my-events');
          const organizedEvents = organizedRes.data || [];
          
          // Calculate organizer statistics
          const activeEvents = organizedEvents.filter(event => event.status === 'active');
          const pastEvents = organizedEvents.filter(event => event.status === 'past');
          const cancelledEvents = organizedEvents.filter(event => event.status === 'cancelled');
          
          // Calculate total attendees across all events
          const totalAttendees = organizedEvents.reduce((sum, event) => {
            // Use attendeesCount if available, otherwise fallback to attendees array length
            const attendeeCount = event.attendeesCount || (event.attendees ? event.attendees.length : 0);
            return sum + attendeeCount;
          }, 0);
          
          // Calculate average attendance per event
          const totalEvents = organizedEvents.length;
          const averageAttendance = totalEvents > 0 ? 
            Math.round(totalAttendees / totalEvents) : 0;
          
          organizerStats = {
            totalOrganized: organizedEvents.length,
            activeEvents: activeEvents.length,
            pastEvents: pastEvents.length,
            cancelledEvents: cancelledEvents.length,
            totalAttendees: totalAttendees,
            averageAttendance: averageAttendance,
            isOrganizer: true
          };
        } catch (err) {
          // Silently handle non-organizer users (403/404 errors are expected)
          if (err.response && (err.response.status === 403 || err.response.status === 404)) {
            // Expected error for non-organizers, don't log
            organizerStats.isOrganizer = false;
          } else {
            // Log unexpected errors
            console.error('Unexpected error fetching organizer stats:', err);
            organizerStats.isOrganizer = false;
          }
        }
      }
      
      setStats({
        // Common stats for all users
        totalRegistered: registeredEvents.length,
        upcomingEvents: upcomingRegistered.length,
        pastEvents: pastRegistered.length,
        // Organizer-specific stats
        ...organizerStats
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      // Set default stats if API fails
      setStats({
        totalRegistered: 0,
        upcomingEvents: 0,
        pastEvents: 0,
        totalOrganized: 0,
        activeEvents: 0,
        totalAttendees: 0,
        averageAttendance: 0,
        isOrganizer: false
      });
    }
  };

  const fetchEventHistory = async () => {
    try {
      // Fetch user's registered events
      const registeredRes = await API.get('/user/registrations');
      const registeredEvents = registeredRes.data || [];
      
      // Start with registered events
      let allEvents = registeredEvents.map(event => ({
        ...event,
        participationType: 'attendee',
        registrationStatus: 'registered'
      }));
      
      // Only try to fetch organized events if user has organizer role
      if (profile.role === 'organizer') {
        // Try to fetch organized events (this will fail if user is not an organizer)
        try {
          const organizedRes = await API.get('/events/my-events');
          const organizedEvents = organizedRes.data || [];
          
          // Add organized events to the list
          const organizedEventsWithInfo = organizedEvents.map(event => ({
            ...event,
            participationType: 'organizer',
            registrationStatus: 'organized'
          }));
          
          allEvents = [...allEvents, ...organizedEventsWithInfo];
        } catch (err) {
          // Silently handle non-organizer users (403/404 errors are expected)
          if (err.response && (err.response.status === 403 || err.response.status === 404)) {
            // Expected error for non-organizers, don't log
          } else {
            // Log unexpected errors
            console.error('Unexpected error fetching organized events:', err);
          }
        }
      }
      
      // Sort events by date (most recent first)
      allEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setEventHistory(allEvents);
    } catch (err) {
      console.error('Failed to fetch event history:', err);
      setEventHistory([]);
    }
  };

  // Utility function to determine event status for display
  const getEventDisplayStatus = (event) => {
    const eventDate = new Date(event.date);
    const now = new Date();
    
    if (event.status === 'cancelled') {
      return 'cancelled';
    }
    
    if (eventDate > now) {
      return 'upcoming';
    }
    
    return 'completed';
  };

  const renderOverview = () => (
    <div className="profile-overview">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-placeholder">
            {profile.name.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="profile-info">
          <h2>{profile.name}</h2>
          <p className="profile-email">{profile.email}</p>
          <div className="profile-badges">
            <span className={`badge badge-${profile.role}`}>
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
            </span>
            <span className="badge badge-member">
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </span>
            {stats.isOrganizer && (
              <span className="badge badge-organizer">
                Verified Organizer
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stats-grid">
          {/* Always show regular user statistics */}
          <div className="stat-card">
            <div className="stat-value">{stats.pastEvents || 0}</div>
            <div className="stat-label">Events Attended</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.upcomingEvents || 0}</div>
            <div className="stat-label">Upcoming Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalRegistered || 0}</div>
            <div className="stat-label">Total Registrations</div>
          </div>
          
          {/* Show organizer statistics if user has organizer access */}
          {stats.isOrganizer && (
            <>
              <div className="stat-card organizer-stat">
                <div className="stat-value">{stats.totalOrganized || 0}</div>
                <div className="stat-label">Events Organized</div>
              </div>
              <div className="stat-card organizer-stat">
                <div className="stat-value">{stats.activeEvents || 0}</div>
                <div className="stat-label">Active Events</div>
              </div>
              <div className="stat-card organizer-stat">
                <div className="stat-value">{stats.totalAttendees || 0}</div>
                <div className="stat-label">Total Attendees</div>
              </div>
              <div className="stat-card organizer-stat">
                <div className="stat-value">{stats.averageAttendance || 0}</div>
                <div className="stat-label">Avg. Attendance</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Show organizer-specific details if applicable */}
      {stats.isOrganizer && (
        <div className="organizer-details">
          <h3>Organizer Performance</h3>
          <div className="organizer-metrics">
            <div className="metric-item">
              <span className="metric-label">Completed Events:</span>
              <span className="metric-value">{stats.pastEvents || 0}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Cancelled Events:</span>
              <span className="metric-value">{stats.cancelledEvents || 0}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Success Rate:</span>
              <span className="metric-value">
                {stats.totalOrganized > 0 
                  ? Math.round(((stats.totalOrganized - stats.cancelledEvents) / stats.totalOrganized) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="personal-info">
      <div className="section-header">
        <h3>Personal Information</h3>
      </div>

      <div className="profile-details">
        <div className="detail-item">
          <strong>Name:</strong> {profile.name}
        </div>
        <div className="detail-item">
          <strong>Email:</strong> {profile.email}
        </div>
      </div>
    </div>
  );

  const renderEventHistory = () => (
    <div className="event-history">
      <h3>Event History</h3>
      {eventHistory.length === 0 ? (
        <div className="empty-state">
          <p>No event history yet</p>
        </div>
      ) : (
        <div className="history-list">
          {eventHistory.map(event => {
            const displayStatus = getEventDisplayStatus(event);
            
            return (
              <div key={event._id} className={`history-item ${event.participationType === 'organizer' ? 'organized-event' : 'registered-event'}`}>
                <div className="event-info">
                  <h4>{event.title}</h4>
                  <p className="event-date">
                    {new Date(event.date).toLocaleDateString()} at {event.startTime}
                  </p>
                  <p className="event-location">
                    {event.eventType === 'Online' ? 'Online Event' : 
                     event.eventType === 'In-person' ? `${event.venueName || 'Venue'}, ${event.city || 'Location'}` :
                     'Hybrid Event'}
                  </p>
                  <p className="event-description">{event.description}</p>
                  {event.participationType === 'organizer' && (
                    <p className="event-attendees">
                      <strong>Attendees:</strong> {event.attendees ? event.attendees.length : 0}
                    </p>
                  )}
                </div>
                <div className="event-status">
                  <span className={`status-badge status-${displayStatus}`}>
                    {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                  </span>
                  <span className="participation-type">
                    {event.participationType === 'organizer' ? 'Organized Event' : 'Registered Event'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="error-message">Failed to load profile</div>;
  }

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account information</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="profile-container">
          <div className="profile-sidebar">
            <div className="profile-tabs">
              <button
                className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                Personal Info
              </button>
              <button
                className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                Event History
              </button>
            </div>
          </div>

          <div className="profile-content">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'personal' && renderPersonalInfo()}
            {activeTab === 'history' && renderEventHistory()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { parseJwt, getToken } from '../utils';
import axios from 'axios';

const userId = parseJwt(getToken())?.id;

// For CRA:
const OPENWEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;

// For Vite (uncomment if using Vite):
// const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;


// --- EventWeather component ---
const EventWeather = ({ city, date }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!city || !date) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError('');
      setWeather(null);

      try {
        // 1. Geocode city name -> lat/lon
        const geoRes = await axios.get(
          'https://api.openweathermap.org/geo/1.0/direct',
          {
            params: { q: city, limit: 1, appid: OPENWEATHER_API_KEY },
          }
        );

        if (!geoRes.data.length) {
          setError('City not found');
          setLoading(false);
          return;
        }

        const { lat, lon } = geoRes.data[0];

        // 2. Fetch 5-day/3-hour forecast
        const forecastRes = await axios.get(
          'https://api.openweathermap.org/data/2.5/forecast',
          {
            params: { lat, lon, appid: OPENWEATHER_API_KEY, units: 'metric' },
          }
        );

        const forecasts = forecastRes.data.list;

        // Target date string (yyyy-mm-dd)
        const targetDateStr = new Date(date).toISOString().slice(0, 10);

        // Filter forecasts for the exact event date
        const forecastsForDate = forecasts.filter((f) =>
          f.dt_txt.startsWith(targetDateStr)
        );

        let chosenForecast;

        if (forecastsForDate.length > 0) {
          // If forecasts exist on event date, pick the one closest to midday (12:00)
          // or simply the first forecast on that day.
          chosenForecast = forecastsForDate[0];
        } else {
          // No forecasts on exact event date
          // Find closest forecast overall (min time diff)
          const eventTime = new Date(date).getTime();
          let minDiff = Infinity;
          for (const f of forecasts) {
            const forecastTime = new Date(f.dt_txt).getTime();
            const diff = Math.abs(forecastTime - eventTime);
            if (diff < minDiff) {
              minDiff = diff;
              chosenForecast = f;
            }
          }
        }

        setWeather(chosenForecast);
      } catch (err) {
        setError('Failed to fetch weather');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city, date]);

  if (loading) return <p style={{ fontStyle: 'italic' }}>Loading weather...</p>;
  if (error) return <p style={{ color: 'red' }}>Weather: {error}</p>;
  if (!weather) return null;

  return (
    <div style={{
      marginTop: '16px',
      padding: '16px',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      color: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
      fontSize: '14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px' }}>🌤️</span>
        <strong>Weather Forecast</strong>
      </div>
      <p style={{ fontSize: '0.875rem', opacity: '0.9', margin: '0 0 8px 0' }}>
        {weather.dt_txt}
      </p>
      <p style={{ fontSize: '32px', margin: '8px 0', fontWeight: '700' }}>
        {Math.round(weather.main.temp)}°C
      </p>
      <p style={{ 
        fontStyle: 'italic', 
        textTransform: 'capitalize', 
        marginBottom: '12px',
        opacity: '0.9'
      }}>
        {weather.weather[0].description}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
        <div><strong>Humidity:</strong> {weather.main.humidity}%</div>
        <div><strong>Wind:</strong> {weather.wind.speed} m/s</div>
      </div>
    </div>
  );
};

// --- Main EventsPage component ---
const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const [registrationStatus, setRegistrationStatus] = useState({});
  const [fullEvents, setFullEvents] = useState(new Set()); // Track events full on register attempt
  const [expandedEvents, setExpandedEvents] = useState(new Set()); // Track expanded event details

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, registrationsRes] = await Promise.all([
        API.get('/events'),
        API.get('/user/registrations'),
      ]);
      
      // Initialize registrationStatus based on backend data
      const initialStatus = {};
      registrationsRes.data.forEach((registeredEvent) => {
        initialStatus[registeredEvent._id] = registeredEvent.registrationStatus || 'registered';
      });
      
      setRegistrationStatus(initialStatus);
      setEvents(eventsRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to load events.');
    }
  };

  const handleRegister = async (eventId) => {
    if (loadingIds.includes(eventId)) return;
    setLoadingIds((prev) => [...prev, eventId]);
    
    try {
      const res = await API.post(`/events/register/${eventId}`);

      // Backend returns registrationStatus: 'registered' | 'pending' | 'waitlist'
      const statusFromBackend = res.data.registrationStatus || 'registered';

      setRegistrationStatus((prev) => ({
        ...prev,
        [eventId]: statusFromBackend,
      }));

      // Remove from fullEvents if previously marked full
      setFullEvents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });

      // Increase attendeesCount only if registered (not pending/waitlist)
      if (statusFromBackend === 'registered') {
        setEvents((prev) =>
          prev.map((event) =>
            event._id === eventId
              ? {
                  ...event,
                  attendeesCount: (event.attendeesCount || 0) + 1,
                }
              : event
          )
        );
      }

      // Show success message based on status - only for new registrations
      if (statusFromBackend === 'registered' && res.data.message !== 'Already registered') {
        alert('Successfully registered for the event!');
      } else if (statusFromBackend === 'pending' && res.data.message !== 'Registration pending approval') {
        alert('Registration submitted! Waiting for organizer approval.');
      } else if (statusFromBackend === 'waitlist' && res.data.message !== 'Already on waitlist') {
        alert('Added to waitlist. You will be notified if a spot opens up.');
      }

    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to register for event.';

      if (errorMsg === 'Event is full') {
        // Mark event as full to show "Waiting for Vacancy"
        setFullEvents((prev) => new Set(prev).add(eventId));
        alert('Event is full. You have been added to the waitlist.');
      } else {
        alert(errorMsg);
      }
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== eventId));
    }
  };

  const handleDeregister = async (eventId) => {
    if (loadingIds.includes(eventId)) return;
    setLoadingIds((prev) => [...prev, eventId]);
    try {
      await API.delete(`/events/deregister/${eventId}`);

      setRegistrationStatus((prev) => ({
        ...prev,
        [eventId]: null,
      }));

      // Remove from fullEvents if present
      setFullEvents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });

      setEvents((prev) =>
        prev.map((event) =>
          event._id === eventId
            ? {
                ...event,
                attendeesCount:
                  event.attendeesCount && event.attendeesCount > 0
                    ? event.attendeesCount - 1
                    : 0,
              }
            : event
        )
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to deregister from event.');
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== eventId));
    }
  };

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

  const activeEvents = events.filter((event) => event.status === 'active');

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Discover Events</h1>
          <p className="page-subtitle">Find exciting events happening around you</p>
        </div>
        
        {activeEvents.length === 0 ? (
          <div className="empty-state">
            <h3>No active events found</h3>
            <p>Check back later for new events</p>
          </div>
        ) : (
          <div className="grid">
            {activeEvents.map((event) => {
              const status = registrationStatus[event._id] || null;
              const isFull = fullEvents.has(event._id);

              return (
                <div key={event._id} className="card event-card">
                  {event.posterImage && (
                    <div className="event-poster">
                      <img 
                        src={event.posterImage} 
                        alt="Event Poster"
                        className="poster-image"
                      />
                    </div>
                  )}
                  
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">{event.title || 'Untitled Event'}</h3>
                      <p className="card-subtitle">
                        <span className="organizer-name">{event.organizerName || 'Unknown'}</span> • 
                        <span className="event-date">{new Date(event.date).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <span className="status-badge status-active">{event.eventType}</span>
                  </div>
                  
                  <div className="card-content">
                    <p className="event-description">{event.description || 'No description available.'}</p>
                    
                    <div className="event-meta">
                      <span className="meta-item">
                        <span className="meta-icon">🏷️</span>
                        <span>{event.category || 'Other'}</span>
                      </span>
                      <span className="meta-item">
                        <span className="meta-icon">📍</span>
                        <span>{event.city || event.venueName || 'Location TBD'}</span>
                      </span>
                      <span className="meta-item">
                        <span className="meta-icon">👥</span>
                        <span>{event.attendeesCount || 0}{event.maxAttendees ? `/${event.maxAttendees}` : ''}</span>
                      </span>
                      <span className="meta-item">
                        <span className="meta-icon">⏰</span>
                        <span>{event.startTime} – {event.endTime}</span>
                      </span>
                      {event.requireApproval && (
                        <span className="meta-item approval-required">
                          <span className="meta-icon">✅</span>
                          <span>Organizer Approval Required</span>
                        </span>
                      )}
                      {event.registrationDeadline && (
                        <span className="meta-item deadline-item">
                          <span className="meta-icon">📅</span>
                          <span>
                            Registration Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
                            {new Date(event.registrationDeadline) < new Date() && (
                              <span className="deadline-expired"> (Expired)</span>
                            )}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Weather component: show weather for city + event date */}
                    {event.city && event.date && <EventWeather city={event.city} date={event.date} />}

                    {/* Registration status information */}
                    {status && (
                      <div className="registration-status">
                        {status === 'registered' && (
                          <div className="status-message success-message">
                            <span className="status-icon">✅</span>
                            <span>
                              <strong>Registration Confirmed!</strong> You are successfully registered for this event.
                              {event.requireApproval && ' Your registration has been approved by the organizer.'}
                            </span>
                          </div>
                        )}
                        {status === 'pending' && (
                          <div className="status-message pending-message">
                            <span className="status-icon">⏳</span>
                            <span>
                              <strong>Registration Submitted!</strong> Your registration is awaiting organizer approval.
                              <br />
                              <small>
                                This event requires manual approval from <strong>{event.organizerName}</strong>. 
                                You will receive an email notification once your registration is reviewed.
                              </small>
                            </span>
                          </div>
                        )}
                        {status === 'waitlist' && (
                          <div className="status-message waitlist-message">
                            <span className="status-icon">⏰</span>
                            <span>
                              <strong>You're on the Waitlist!</strong> You'll be automatically notified via email if a spot opens up.
                              <br />
                              <small>
                                Current position: You will be moved to the main attendee list when someone cancels their registration.
                              </small>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Loading state indicator */}
                    {loadingIds.includes(event._id) && (
                      <div className="registration-status">
                        <div className="status-message loading-message">
                          <span className="status-icon">🔄</span>
                          <span>
                            <strong>Processing...</strong>
                            <br />
                            <small>
                              {event.requireApproval 
                                ? `Submitting your registration request to ${event.organizerName}. This may take a moment.`
                                : 'Registering you for this event. Please wait.'}
                            </small>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Show additional info when approval is required */}
                    {!status && !loadingIds.includes(event._id) && event.requireApproval && (
                      <div className="registration-status">
                        <div className="status-message info-message">
                          <span className="status-icon">ℹ️</span>
                          <span>
                            <strong>Approval Required:</strong> This event requires approval from the organizer ({event.organizerName}).
                            <br />
                            <small>
                              After clicking "Request to Join", your registration will be reviewed and you'll receive an email notification with the decision.
                            </small>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Expandable details section */}
                    {expandedEvents.has(event._id) && (
                      <div className="event-details">
                        <div className="details-grid">
                          <div>
                            <h4 className="details-title">Event Information</h4>
                            <div className="details-item">
                              <span className="details-label">Event Type:</span>
                              <span>{event.eventType}</span>
                            </div>
                            {event.venueName && (
                              <div className="details-item">
                                <span className="details-label">Venue:</span>
                                <span>{event.venueName}</span>
                              </div>
                            )}
                            {event.address && (
                              <div className="details-item">
                                <span className="details-label">Address:</span>
                                <span>{event.address}</span>
                              </div>
                            )}
                            <div className="details-item">
                              <span className="details-label">Max Attendees:</span>
                              <span>{event.maxAttendees || 'Unlimited'}</span>
                            </div>
                            <div className="details-item">
                              <span className="details-label">Current Attendees:</span>
                              <span>{event.attendeesCount || 0}</span>
                            </div>
                            <div className="details-item">
                              <span className="details-label">Waitlist:</span>
                              <span>{event.enableWaitlist ? 'Enabled' : 'Disabled'}</span>
                            </div>
                            <div className="details-item">
                              <span className="details-label">Registration Process:</span>
                              <span>{event.requireApproval ? 'Manual approval required' : 'Instant registration'}</span>
                            </div>
                            {event.requireApproval && (
                              <div className="details-item">
                                <span className="details-label">Organizer Contact:</span>
                                <span>{event.organizerName}</span>
                              </div>
                            )}
                            {event.registrationDeadline && (
                              <div className="details-item">
                                <span className="details-label">Registration Deadline:</span>
                                <span>{new Date(event.registrationDeadline).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="details-title">Links & Resources</h4>
                            {event.onlineLink && (
                              <div className="details-item">
                                <span className="details-label">Online Event:</span>
                                <a href={event.onlineLink} target="_blank" rel="noopener noreferrer" 
                                   className="event-link">
                                  🔗 Join Event
                                </a>
                              </div>
                            )}
                            {event.mapLink && (
                              <div className="details-item">
                                <span className="details-label">Location Map:</span>
                                <a href={event.mapLink} target="_blank" rel="noopener noreferrer"
                                   className="event-link">
                                  🗺️ View Map
                                </a>
                              </div>
                            )}
                            {event.tags?.length > 0 && (
                              <div className="details-item">
                                <span className="details-label">Tags:</span>
                                <div className="event-tags">
                                  {event.tags.map((tag, index) => (
                                    <span key={index} className="event-tag">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-actions">
                    <button
                      onClick={() => toggleEventDetails(event._id)}
                      className="btn btn-secondary details-toggle"
                    >
                      {expandedEvents.has(event._id) ? 'Hide Details' : 'More Details'}
                    </button>
                    
                    {status === 'registered' ? (
                      <button
                        onClick={() => handleDeregister(event._id)}
                        disabled={loadingIds.includes(event._id)}
                        className="btn btn-danger"
                      >
                        {loadingIds.includes(event._id) ? 'Processing...' : 'Deregister'}
                      </button>
                    ) : status === 'pending' ? (
                      <button disabled className="btn btn-warning">
                        Waiting for Approval
                      </button>
                    ) : status === 'waitlist' ? (
                      <button disabled className="btn btn-secondary">
                        In Waitlist
                      </button>
                    ) : isFull ? (
                      <button disabled className="btn btn-secondary">
                        Waiting for Vacancy
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegister(event._id)}
                        disabled={loadingIds.includes(event._id)}
                        className="btn btn-success"
                      >
                        {loadingIds.includes(event._id) ? 'Processing...' : 'Register'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;

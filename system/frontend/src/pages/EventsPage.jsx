
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
    <div style={weatherStyles.widget}>
      <strong>Weather forecast:</strong>
      <p>{weather.dt_txt}</p>
      <p style={weatherStyles.temp}>{Math.round(weather.main.temp)}°C</p>
      <p style={weatherStyles.description}>{weather.weather[0].description}</p>
      <div style={weatherStyles.details}>
        <div><strong>Humidity:</strong> {weather.main.humidity}%</div>
        <div><strong>Wind:</strong> {weather.wind.speed} m/s</div>
      </div>
    </div>
  );
};

const weatherStyles = {
  widget: {
    marginTop: 12,
    padding: '10px',
    backgroundColor: '#034daa',
    color: 'white',
    borderRadius: 8,
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    fontSize: '14px',
  },
  temp: {
    fontSize: 28,
    margin: '5px 0',
    fontWeight: '700',
  },
  description: {
    fontStyle: 'italic',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  details: {
    display: 'flex',
    justifyContent: 'space-between',
  },
};

// --- Main EventsPage component ---
const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const [registrationStatus, setRegistrationStatus] = useState({});
  const [fullEvents, setFullEvents] = useState(new Set()); // Track events full on register attempt

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, registrationsRes] = await Promise.all([
        API.get('/event'),
        API.get('/user/registrations'),
      ]);
      const registeredEventIds = registrationsRes.data.map((e) => e._id);

      // Initialize registrationStatus for registered events as 'registered'
      const initialStatus = {};
      registeredEventIds.forEach((id) => {
        initialStatus[id] = 'registered';
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
      const res = await API.post(`/event/register/${eventId}`);

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
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to register for event.';

      if (errorMsg === 'Event is full') {
        // Mark event as full to show "Waiting for Vacancy"
        setFullEvents((prev) => new Set(prev).add(eventId));
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
      await API.delete(`/event/deregister/${eventId}`);

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

  const activeEvents = events.filter((event) => event.status === 'active');

  return (
    <div style={styles.page}>
      <h2>All Active Events</h2>
      {activeEvents.length === 0 ? (
        <p>No active events found.</p>
      ) : (
        activeEvents.map((event) => {
          const status = registrationStatus[event._id] || null;
          const isFull = fullEvents.has(event._id);

          return (
            <div key={event._id} style={styles.card}>
              {event.posterImage && (
                <img src={event.posterImage} alt="Poster" style={styles.poster} />
              )}
              <div style={styles.content}>
                <h3>{event.title || 'Untitled Event'}</h3>
                <p>{event.description || 'No description available.'}</p>
                <p>
                  <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Time:</strong> {event.startTime} – {event.endTime}
                </p>
                <p>
                  <strong>Category:</strong> {event.category}
                </p>
                <p>
                  <strong>Event Type:</strong> {event.eventType}
                </p>

                {event.city && (
                  <p>
                    <strong>City:</strong> {event.city}
                  </p>
                )}
                {event.eventType !== 'Online' && event.venueName && (
                  <p>
                    <strong>Venue:</strong> {event.venueName}
                  </p>
                )}
                {event.onlineLink && (
                  <p>
                    <strong>Online Link:</strong>{' '}
                    <a href={event.onlineLink} target="_blank" rel="noopener noreferrer">
                      Join Event
                    </a>
                  </p>
                )}
                {event.mapLink && (
                  <p>
                    <strong>Map:</strong>{' '}
                    <a href={event.mapLink} target="_blank" rel="noopener noreferrer">
                      View Map
                    </a>
                  </p>
                )}

                <p>
                  <strong>Tags:</strong>{' '}
                  {event.tags?.length > 0 ? event.tags.join(', ') : 'None'}
                </p>

                {event.registrationDeadline && (
                  <p>
                    <strong>Registration Deadline:</strong>{' '}
                    {new Date(event.registrationDeadline).toLocaleDateString()}
                  </p>
                )}

                <p>
                  <strong>Max Attendees:</strong> {event.maxAttendees || 'Unlimited'}
                </p>

                <p>
                  <strong>Current Attendees:</strong> {event.attendeesCount || 0}
                </p>

                <p>
                  <strong>Waitlist:</strong> {event.enableWaitlist ? 'Enabled' : 'Disabled'}
                </p>
                <p>
                  <strong>Organizer Approval:</strong>{' '}
                  {event.requireApproval ? 'Enabled' : 'Disabled'}
                </p>

                <p>
                  <strong>Organizer:</strong> {event.organizerName || 'Unknown'}
                </p>

                {/* Weather component: show weather for city + event date */}
                {event.city && event.date && <EventWeather city={event.city} date={event.date} />}

                {status === 'registered' ? (
                  <button
                    onClick={() => handleDeregister(event._id)}
                    disabled={loadingIds.includes(event._id)}
                    style={{ ...styles.button, backgroundColor: '#e53935' }}
                  >
                    {loadingIds.includes(event._id) ? 'Processing...' : 'Deregister'}
                  </button>
                ) : status === 'pending' ? (
                  <button disabled style={{ ...styles.button, backgroundColor: '#fbc02d' }}>
                    Waiting for Approval
                  </button>
                ) : status === 'waitlist' ? (
                  <button disabled style={{ ...styles.button, backgroundColor: '#9e9e9e' }}>
                    In Waitlist
                  </button>
                ) : isFull ? (
                  <button disabled style={{ ...styles.button, backgroundColor: '#9e9e9e' }}>
                    Waiting for Vacancy
                  </button>
                ) : (
                  <button
                    onClick={() => handleRegister(event._id)}
                    disabled={loadingIds.includes(event._id)}
                    style={{ ...styles.button, backgroundColor: '#4CAF50' }}
                  >
                    {loadingIds.includes(event._id) ? 'Processing...' : 'Register'}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

const styles = {
  page: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: 20,
  },
  card: {
    display: 'flex',
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    gap: 16,
  },
  poster: {
    width: 160,
    height: 160,
    objectFit: 'cover',
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  button: {
    padding: '8px 16px',
    color: 'white',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer',
    marginTop: 10,
  },
};

export default EventsPage;

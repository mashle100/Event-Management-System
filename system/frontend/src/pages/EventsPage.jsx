import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { parseJwt, getToken } from '../utils';
import axios from 'axios';

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
const EventsPage = ({ user }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const [registrationStatus, setRegistrationStatus] = useState({});
  const [fullEvents, setFullEvents] = useState(new Set()); // Track events full on register attempt
  const [expandedEvents, setExpandedEvents] = useState(new Set()); // Track expanded event details
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [showFilters, setShowFilters] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [registrationFilter, setRegistrationFilter] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isLoggedIn = !!getToken();
  const currentUserId = parseJwt(getToken())?.id;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Generate search suggestions
  useEffect(() => {
    if (searchTerm.length > 0) {
      const suggestions = [];
      const searchLower = searchTerm.toLowerCase();
      
      // Add event title suggestions
      events.forEach(event => {
        if (event.title?.toLowerCase().includes(searchLower) && !suggestions.includes(event.title)) {
          suggestions.push(event.title);
        }
      });
      
      // Add organizer suggestions
      events.forEach(event => {
        if (event.organizerName?.toLowerCase().includes(searchLower) && !suggestions.includes(event.organizerName)) {
          suggestions.push(event.organizerName);
        }
      });
      
      // Add city suggestions
      events.forEach(event => {
        if (event.city?.toLowerCase().includes(searchLower) && !suggestions.includes(event.city)) {
          suggestions.push(event.city);
        }
      });
      
      // Add tag suggestions
      events.forEach(event => {
        event.tags?.forEach(tag => {
          if (tag.toLowerCase().includes(searchLower) && !suggestions.includes(tag)) {
            suggestions.push(tag);
          }
        });
      });
      
      setSearchSuggestions(suggestions.slice(0, 5));
    } else {
      setSearchSuggestions([]);
    }
  }, [searchTerm, events]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const eventsRes = await API.get('/events');
      
      // Only fetch registrations if user is logged in
      if (isLoggedIn) {
        const registrationsRes = await API.get('/user/registrations');
        
        // Initialize registrationStatus based on backend data
        const initialStatus = {};
        registrationsRes.data.forEach((registeredEvent) => {
          initialStatus[registeredEvent._id] = registeredEvent.registrationStatus || 'registered';
        });
        
        setRegistrationStatus(initialStatus);
      }
      
      setEvents(eventsRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to load events.');
    }
  };

  const handleLoginToRegister = () => {
    navigate('/login');
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

  // Search and filter functions
  const getUniqueValues = useCallback((key) => {
    const values = events.map(event => event[key]).filter(Boolean);
    return [...new Set(values)].sort();
  }, [events]);

  const filterEvents = useCallback((events) => {
    return events.filter(event => {
      // Text search with debounced term
      const searchLower = debouncedSearchTerm.toLowerCase();
      const matchesSearch = !debouncedSearchTerm || 
        event.title?.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.organizerName?.toLowerCase().includes(searchLower) ||
        event.city?.toLowerCase().includes(searchLower) ||
        event.venueName?.toLowerCase().includes(searchLower) ||
        event.address?.toLowerCase().includes(searchLower) ||
        event.tags?.some(tag => tag.toLowerCase().includes(searchLower));

      // Category filter
      const matchesCategory = !selectedCategory || event.category === selectedCategory;

      // Event type filter
      const matchesEventType = !selectedEventType || event.eventType === selectedEventType;

      // City filter
      const matchesCity = !selectedCity || event.city === selectedCity;

      // Date filter
      const matchesDate = !dateFilter || (() => {
        const eventDate = new Date(event.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        const thisWeek = new Date(today);
        thisWeek.setDate(today.getDate() + 7);
        
        const thisMonth = new Date(today);
        thisMonth.setMonth(today.getMonth() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 14);

        switch (dateFilter) {
          case 'today':
            return eventDate.toDateString() === today.toDateString();
          case 'tomorrow':
            return eventDate.toDateString() === tomorrow.toDateString();
          case 'thisWeek':
            return eventDate >= today && eventDate <= thisWeek;
          case 'nextWeek':
            return eventDate > thisWeek && eventDate <= nextWeek;
          case 'thisMonth':
            return eventDate >= today && eventDate <= thisMonth;
          case 'past':
            return eventDate < today;
          default:
            return true;
        }
      })();

      // Availability filter
      const matchesAvailability = !availabilityFilter || (() => {
        const currentAttendees = event.attendeesCount || 0;
        const maxAttendees = event.maxAttendees;
        const isRegistered = registrationStatus[event._id];
        
        switch (availabilityFilter) {
          case 'available':
            return !maxAttendees || currentAttendees < maxAttendees;
          case 'almostFull':
            return maxAttendees && currentAttendees >= maxAttendees * 0.8;
          case 'full':
            return maxAttendees && currentAttendees >= maxAttendees;
          case 'waitlist':
            return event.enableWaitlist && maxAttendees && currentAttendees >= maxAttendees;
          default:
            return true;
        }
      })();

      // Registration filter
      const matchesRegistration = !registrationFilter || (() => {
        const status = registrationStatus[event._id];
        const hasDeadline = event.registrationDeadline;
        const isDeadlinePassed = hasDeadline && new Date(event.registrationDeadline) < new Date();
        
        switch (registrationFilter) {
          case 'registered':
            return status === 'registered';
          case 'pending':
            return status === 'pending';
          case 'waitlist':
            return status === 'waitlist';
          case 'notRegistered':
            return !status;
          case 'approvalRequired':
            return event.requireApproval;
          case 'instantRegistration':
            return !event.requireApproval;
          case 'openRegistration':
            return !isDeadlinePassed;
          case 'closedRegistration':
            return isDeadlinePassed;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesCategory && matchesEventType && matchesCity && matchesDate && matchesAvailability && matchesRegistration;
    });
  }, [debouncedSearchTerm, selectedCategory, selectedEventType, selectedCity, dateFilter, availabilityFilter, registrationFilter, registrationStatus]);

  const sortEvents = useCallback((events) => {
    return [...events].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date) - new Date(b.date);
        case 'dateDesc':
          return new Date(b.date) - new Date(a.date);
        case 'title':
          return a.title?.localeCompare(b.title) || 0;
        case 'category':
          return a.category?.localeCompare(b.category) || 0;
        case 'attendees':
          return (b.attendeesCount || 0) - (a.attendeesCount || 0);
        case 'organizer':
          return a.organizerName?.localeCompare(b.organizerName) || 0;
        case 'availability':
          const getAvailabilityScore = (event) => {
            if (!event.maxAttendees) return 100;
            return ((event.maxAttendees - (event.attendeesCount || 0)) / event.maxAttendees) * 100;
          };
          return getAvailabilityScore(b) - getAvailabilityScore(a);
        case 'registrationDeadline':
          const getDeadlineScore = (event) => {
            if (!event.registrationDeadline) return 0;
            return new Date(event.registrationDeadline).getTime();
          };
          return getDeadlineScore(a) - getDeadlineScore(b);
        default:
          return 0;
      }
    });
  }, [sortBy]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedCategory('');
    setSelectedEventType('');
    setSelectedCity('');
    setDateFilter('');
    setAvailabilityFilter('');
    setRegistrationFilter('');
    setSortBy('date');
    setShowSuggestions(false);
  }, []);

  const handleSearchSuggestionClick = useCallback((suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  }, []);

  const handleSearchInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
  }, []);

  const handleSearchInputBlur = useCallback(() => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  const handleSearchInputKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setShowSuggestions(false);
      e.target.blur();
    }
    if (e.key === 'Enter' && showSuggestions && searchSuggestions.length > 0) {
      handleSearchSuggestionClick(searchSuggestions[0]);
    }
  }, [showSuggestions, searchSuggestions, handleSearchSuggestionClick]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.search-input')?.focus();
      }
      // Escape to clear search and filters
      if (e.key === 'Escape' && !e.target.closest('.search-input')) {
        if (searchTerm || selectedCategory || selectedEventType || selectedCity || dateFilter || availabilityFilter || registrationFilter) {
          clearFilters();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, selectedCategory, selectedEventType, selectedCity, dateFilter, availabilityFilter, registrationFilter, clearFilters]);

  const activeEvents = events.filter((event) => event.status === 'active');
  const filteredEvents = useMemo(() => filterEvents(activeEvents), [activeEvents, filterEvents]);
  const sortedEvents = useMemo(() => sortEvents(filteredEvents), [filteredEvents, sortEvents]);

  // Get unique values for filter options
  const categories = useMemo(() => getUniqueValues('category'), [getUniqueValues]);
  const eventTypes = useMemo(() => getUniqueValues('eventType'), [getUniqueValues]);
  const cities = useMemo(() => getUniqueValues('city'), [getUniqueValues]);

  // Filter statistics
  const filterStats = useMemo(() => {
    const totalEvents = activeEvents.length;
    const filteredCount = filteredEvents.length;
    const availableEvents = filteredEvents.filter(event => !event.maxAttendees || (event.attendeesCount || 0) < event.maxAttendees).length;
    const registeredEvents = filteredEvents.filter(event => registrationStatus[event._id] === 'registered').length;
    
    return {
      total: totalEvents,
      filtered: filteredCount,
      available: availableEvents,
      registered: registeredEvents
    };
  }, [activeEvents, filteredEvents, registrationStatus]);

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Discover Events</h1>
          <p className="page-subtitle">Find exciting events happening around you</p>
        </div>
        
        {/* Search Bar */}
        <div className="search-section">
          <div className="search-bar">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search events by title, description, organizer, location, or tags... (Ctrl+K)"
                value={searchTerm}
                onChange={handleSearchInputChange}
                onFocus={() => setShowSuggestions(searchTerm.length > 0)}
                onBlur={handleSearchInputBlur}
                onKeyDown={handleSearchInputKeyDown}
                className={`search-input ${showSuggestions && searchSuggestions.length > 0 ? 'has-suggestions' : ''}`}
                aria-label="Search events"
                aria-expanded={showSuggestions}
                aria-autocomplete="list"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setDebouncedSearchTerm('');
                    setShowSuggestions(false);
                  }}
                  className="clear-search-btn"
                  aria-label="Clear search"
                  title="Clear search (Esc)"
                >
                  ✕
                </button>
              )}
              
              {/* Search Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="search-suggestions" role="listbox">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSearchSuggestionClick(suggestion)}
                      role="option"
                      aria-selected={false}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSearchSuggestionClick(suggestion);
                        }
                      }}
                    >
                      <div className="suggestion-text">{suggestion}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-secondary filter-toggle ${showFilters ? 'active' : ''}`}
            >
              <span className="filter-icon">🔍</span>
              Filters
              {(debouncedSearchTerm || selectedCategory || selectedEventType || selectedCity || dateFilter || availabilityFilter || registrationFilter) && (
                <span className="filter-count">
                  {[debouncedSearchTerm, selectedCategory, selectedEventType, selectedCity, dateFilter, availabilityFilter, registrationFilter].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filter Statistics */}
          <div className="filter-stats">
            <span className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{filterStats.total}</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">Filtered:</span>
              <span className="stat-value">{filterStats.filtered}</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">Available:</span>
              <span className="stat-value">{filterStats.available}</span>
            </span>
            {isLoggedIn && (
              <span className="stat-item">
                <span className="stat-label">Registered:</span>
                <span className="stat-value">{filterStats.registered}</span>
              </span>
            )}
            {(debouncedSearchTerm || selectedCategory || selectedEventType || selectedCity || dateFilter || availabilityFilter || registrationFilter) && (
              <span className="stat-item active-filters">
                <span className="stat-label">Active Filters:</span>
                <span className="stat-value">
                  {[debouncedSearchTerm, selectedCategory, selectedEventType, selectedCity, dateFilter, availabilityFilter, registrationFilter].filter(Boolean).length}
                </span>
              </span>
            )}
          </div>

          {/* Search hints */}
          {!debouncedSearchTerm && !selectedCategory && !selectedEventType && !selectedCity && !dateFilter && !availabilityFilter && !registrationFilter && (
            <div className="search-hints">
              <div className="hint-item">
                <span className="hint-icon">🔍</span>
                <span>Try searching for event titles, organizers, or locations</span>
              </div>
              <div className="hint-item">
                <span className="hint-icon">⌨️</span>
                <span>Use <kbd>Ctrl+K</kbd> to quickly focus the search bar</span>
              </div>
              <div className="hint-item">
                <span className="hint-icon">📊</span>
                <span>Use filters to narrow down your search results</span>
              </div>
            </div>
          )}

          {/* Filter Panel */}
          {showFilters && (
            <div className="filter-panel">
              <div className="filter-grid">
                <div className="filter-group">
                  <label className="filter-label">Category</label>
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Event Type</label>
                  <select 
                    value={selectedEventType} 
                    onChange={(e) => setSelectedEventType(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Types</option>
                    {eventTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">City</label>
                  <select 
                    value={selectedCity} 
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Cities</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Date</label>
                  <select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Dates</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="thisWeek">This Week</option>
                    <option value="nextWeek">Next Week</option>
                    <option value="thisMonth">This Month</option>
                    <option value="past">Past Events</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Availability</label>
                  <select 
                    value={availabilityFilter} 
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Events</option>
                    <option value="available">Available Spots</option>
                    <option value="almostFull">Almost Full (80%+)</option>
                    <option value="full">Full</option>
                    <option value="waitlist">Waitlist Available</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Registration</label>
                  <select 
                    value={registrationFilter} 
                    onChange={(e) => setRegistrationFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Registration Types</option>
                    {isLoggedIn && (
                      <>
                        <option value="registered">My Registered Events</option>
                        <option value="pending">Pending Approval</option>
                        <option value="waitlist">In Waitlist</option>
                        <option value="notRegistered">Not Registered</option>
                      </>
                    )}
                    <option value="approvalRequired">Approval Required</option>
                    <option value="instantRegistration">Instant Registration</option>
                    <option value="openRegistration">Open Registration</option>
                    <option value="closedRegistration">Closed Registration</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Sort By</label>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="filter-select"
                  >
                    <option value="date">Date (Earliest First)</option>
                    <option value="dateDesc">Date (Latest First)</option>
                    <option value="title">Title (A-Z)</option>
                    <option value="category">Category</option>
                    <option value="attendees">Most Popular</option>
                    <option value="organizer">Organizer</option>
                    <option value="availability">Most Available</option>
                    <option value="registrationDeadline">Registration Deadline</option>
                  </select>
                </div>
              </div>

              <div className="filter-actions">
                <button 
                  onClick={clearFilters}
                  className="btn btn-secondary"
                >
                  Clear All Filters
                </button>
                <span className="results-count">
                  Showing {sortedEvents.length} of {activeEvents.length} events
                </span>
              </div>
            </div>
          )}
        </div>
        
        {activeEvents.length === 0 ? (
          <div className="empty-state">
            <h3>No active events found</h3>
            <p>Check back later for new events</p>
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="empty-state">
            <h3>No events match your search</h3>
            <p>Try adjusting your search terms or filters</p>
            <button onClick={clearFilters} className="btn btn-primary">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid">
            {sortedEvents.map((event) => {
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
                    ) : !isLoggedIn ? (
                      <button
                        onClick={handleLoginToRegister}
                        className="btn btn-primary"
                      >
                        Login to Register
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

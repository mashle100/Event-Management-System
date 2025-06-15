
// // const API_KEY = '6642e6906f4324abd021bfb39d1f05c7'; // your OpenWeatherMap API key
// import React, { useState } from 'react';
// import axios from 'axios';

// const Weather = () => {
//   const [city, setCity] = useState('');
//   const [date, setDate] = useState('');
//   const [time, setTime] = useState('');
//   const [forecast, setForecast] = useState(null);
//   const [error, setError] = useState('');

//   const handleFetchForecast = async () => {
//     try {
//       const response = await axios.get(
//         `https://api.openweathermap.org/data/2.5/forecast`,
//         {
//           params: {
//             q: city,
//             appid: '6642e6906f4324abd021bfb39d1f05c7', // Replace with your own API key if needed
//             units: 'metric',
//           },
//         }
//       );

//       const forecasts = response.data.list;
//       const targetDateTime = new Date(`${date}T${time}:00`);

//       let closestForecast = null;
//       let minDiff = Infinity;

//       forecasts.forEach((forecast) => {
//         const forecastTime = new Date(forecast.dt_txt);
//         const diff = Math.abs(forecastTime - targetDateTime);
//         if (diff < minDiff) {
//           minDiff = diff;
//           closestForecast = forecast;
//         }
//       });

//       if (closestForecast) {
//         setForecast(closestForecast);
//         setError('');
//       } else {
//         setForecast(null);
//         setError('No forecast available near the selected time.');
//       }
//     } catch (err) {
//       console.error(err);
//       setError('Failed to fetch forecast. Please check the city name.');
//       setForecast(null);
//     }
//   };

//   return (
//     <div style={{ textAlign: 'center', padding: '20px' }}>
//       <h2>Weather Forecast</h2>
//       <input
//         type="text"
//         placeholder="Enter City"
//         value={city}
//         onChange={(e) => setCity(e.target.value)}
//       />
//       <br />
//       <input
//         type="date"
//         value={date}
//         onChange={(e) => setDate(e.target.value)}
//         style={{ marginTop: '10px' }}
//       />
//       <br />
//       <input
//         type="time"
//         value={time}
//         onChange={(e) => setTime(e.target.value)}
//         style={{ marginTop: '10px' }}
//       />
//       <br />
//       <button
//         onClick={handleFetchForecast}
//         style={{ marginTop: '15px', padding: '8px 16px' }}
//       >
//         Get Forecast
//       </button>

//       {error && <p style={{ color: 'red' }}>{error}</p>}

//       {forecast && (
//         <div style={{ marginTop: '20px' }}>
//           <h3>Forecast for: {forecast.dt_txt}</h3>
//           <p>Temperature: {forecast.main.temp} °C</p>
//           <p>Weather: {forecast.weather[0].description}</p>
//           <p>Humidity: {forecast.main.humidity}%</p>
//           <p>Wind Speed: {forecast.wind.speed} m/s</p>
//         </div>
//       )}
//     </div>
//   );
// };


// export default Weather;
import React, { useState } from 'react';
import axios from 'axios';

const Weather = () => {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState('');

  const API_KEY = '6642e6906f4324abd021bfb39d1f05c7';

  const handleFetchForecast = async () => {
    try {
      const geoRes = await axios.get(
        `https://api.openweathermap.org/geo/1.0/direct`,
        {
          params: {
            q: location,
            limit: 1,
            appid: API_KEY,
          },
        }
      );

      if (!geoRes.data.length) {
        setError('Location not found. Please enter a valid city or place name.');
        setForecast(null);
        return;
      }

      const { lat, lon } = geoRes.data[0];

      const weatherRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast`,
        {
          params: {
            lat,
            lon,
            appid: API_KEY,
            units: 'metric',
          },
        }
      );

      const forecasts = weatherRes.data.list;
      const targetDateTime = new Date(`${date}T${time}:00`);

      let closestForecast = null;
      let minDiff = Infinity;

      forecasts.forEach((f) => {
        const forecastTime = new Date(f.dt_txt);
        const diff = Math.abs(forecastTime - targetDateTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestForecast = f;
        }
      });

      if (closestForecast) {
        setForecast(closestForecast);
        setError('');
      } else {
        setForecast(null);
        setError('No forecast available near the selected time.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch forecast. Please check the location name.');
      setForecast(null);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Weather Forecast</h2>

      <input
        type="text"
        placeholder="Enter Location (e.g., NGIT, Hyderabad)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        style={styles.input}
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={styles.input}
      />
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        style={styles.input}
      />

      <button onClick={handleFetchForecast} style={styles.button}>
        Get Forecast
      </button>

      {error && <p style={styles.error}>{error}</p>}

      {forecast && (
  <div style={styles.widget}>
    <h3 style={styles.forecastTitle}>Forecast for: {location}</h3>
    <p style={{ marginBottom: '6px', fontWeight: '600', fontSize: '16px' }}>
      Date & Time: {forecast.dt_txt}
    </p>
    <p style={styles.temp}>{Math.round(forecast.main.temp)}°C</p>
    <p style={styles.description}>{forecast.weather[0].description}</p>
    <div style={styles.details}>
      <div><strong>Humidity:</strong> {forecast.main.humidity}%</div>
      <div><strong>Wind:</strong> {forecast.wind.speed} m/s</div>
    </div>
  </div>
)}

    </div>
  );
};

const styles = {
  container: {
    maxWidth: '320px',
    margin: '20px auto',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#004daa',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  title: {
    marginBottom: '15px',
    color: '#00796b',
  },
  input: {
    width: '90%',
    padding: '8px',
    margin: '10px 0',
    borderRadius: '6px',
    border: '1px solid #00796b',
    fontSize: '14px',
  },
  button: {
    marginTop: '10px',
    padding: '10px 18px',
    backgroundColor: '#00796b',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer',
  },
  error: {
    marginTop: '15px',
    color: 'red',
    fontWeight: '600',
  },
  widget: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#034daa',
    color: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
  },
  forecastTitle: {
    marginBottom: '10px',
    fontWeight: '600',
  },
  temp: {
    fontSize: '48px',
    margin: '5px 0',
    fontWeight: '700',
  },
  description: {
    fontSize: '18px',
    fontStyle: 'italic',
    marginBottom: '15px',
    textTransform: 'capitalize',
  },
  details: {
    display: 'flex',
    justifyContent: 'space-around',
    fontSize: '14px',
  },
};

export default Weather;

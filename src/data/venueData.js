// Stadium metadata: altitude (m), typical June weather, capacity, indoor flag
// indoors = true means climate-controlled or retractable roof → weather signals suppressed

export const VENUES = {
  'Lincoln Financial Field': {
    city: 'Philadelphia, PA', country: 'USA',
    altitude: 8, capacity: 69176, indoors: false,
    tempC: 30, humidity: 68, rainProb: 0.28, noiseIdx: 72,
    lat: 39.9008, lng: -75.1675,
  },
  'MetLife Stadium': {
    city: 'East Rutherford, NJ', country: 'USA',
    altitude: 7, capacity: 82500, indoors: false,
    tempC: 28, humidity: 65, rainProb: 0.30, noiseIdx: 78,
    lat: 40.8135, lng: -74.0745,
  },
  "Levi's Stadium": {
    city: 'Santa Clara, CA', country: 'USA',
    altitude: 10, capacity: 68500, indoors: false,
    tempC: 24, humidity: 55, rainProb: 0.05, noiseIdx: 65,
    lat: 37.4032, lng: -121.9698,
  },
  'NRG Stadium': {
    city: 'Houston, TX', country: 'USA',
    altitude: 12, capacity: 72220, indoors: true,
    tempC: 35, humidity: 78, rainProb: 0.35, noiseIdx: 74,
    lat: 29.6847, lng: -95.4107,
  },
  'Gillette Stadium': {
    city: 'Foxborough, MA', country: 'USA',
    altitude: 20, capacity: 65878, indoors: false,
    tempC: 27, humidity: 66, rainProb: 0.32, noiseIdx: 76,
    lat: 42.0909, lng: -71.2643,
  },
  'BMO Field': {
    city: 'Toronto, CAN', country: 'CAN',
    altitude: 77, capacity: 45000, indoors: false,
    tempC: 26, humidity: 64, rainProb: 0.30, noiseIdx: 68,
    lat: 43.6333, lng: -79.4186,
  },
  'Estadio Akron': {
    city: 'Guadalajara, MEX', country: 'MEX',
    altitude: 1650, capacity: 49850, indoors: false,
    tempC: 26, humidity: 55, rainProb: 0.42, noiseIdx: 82,
    lat: 20.6868, lng: -103.4607,
  },
  'BC Place': {
    city: 'Vancouver, CAN', country: 'CAN',
    altitude: 5, capacity: 54500, indoors: true,
    tempC: 22, humidity: 62, rainProb: 0.15, noiseIdx: 70,
    lat: 49.2769, lng: -123.1118,
  },
  'Lumen Field': {
    city: 'Seattle, WA', country: 'USA',
    altitude: 5, capacity: 68740, indoors: false,
    tempC: 24, humidity: 60, rainProb: 0.12, noiseIdx: 85,
    lat: 47.5952, lng: -122.3316,
  },
  'Hard Rock Stadium': {
    city: 'Miami, FL', country: 'USA',
    altitude: 2, capacity: 65326, indoors: false,
    tempC: 34, humidity: 82, rainProb: 0.55, noiseIdx: 71,
    lat: 25.9580, lng: -80.2389,
  },
  'Mercedes-Benz Stadium': {
    city: 'Atlanta, GA', country: 'USA',
    altitude: 316, capacity: 71000, indoors: true,
    tempC: 32, humidity: 70, rainProb: 0.38, noiseIdx: 88,
    lat: 33.7554, lng: -84.4010,
  },
  'Estadio Azteca': {
    city: 'Mexico City, MEX', country: 'MEX',
    altitude: 2240, capacity: 87523, indoors: false,
    tempC: 18, humidity: 45, rainProb: 0.38, noiseIdx: 92,
    lat: 19.3029, lng: -99.1505,
  },
  'AT&T Stadium': {
    city: 'Arlington, TX', country: 'USA',
    altitude: 180, capacity: 80000, indoors: true,
    tempC: 34, humidity: 58, rainProb: 0.22, noiseIdx: 79,
    lat: 32.7473, lng: -97.0945,
  },
  'SoFi Stadium': {
    city: 'Los Angeles, CA', country: 'USA',
    altitude: 60, capacity: 70240, indoors: true,
    tempC: 27, humidity: 68, rainProb: 0.04, noiseIdx: 73,
    lat: 33.9535, lng: -118.3392,
  },
  'Rose Bowl': {
    city: 'Pasadena, CA', country: 'USA',
    altitude: 244, capacity: 92542, indoors: false,
    tempC: 30, humidity: 65, rainProb: 0.05, noiseIdx: 76,
    lat: 34.1614, lng: -118.1677,
  },
  'Arrowhead Stadium': {
    city: 'Kansas City, MO', country: 'USA',
    altitude: 311, capacity: 76416, indoors: false,
    tempC: 30, humidity: 62, rainProb: 0.35, noiseIdx: 82,
    lat: 39.0489, lng: -94.4839,
  },
  'Estadio BBVA': {
    city: 'Monterrey, MEX', country: 'MEX',
    altitude: 530, capacity: 51350, indoors: false,
    tempC: 36, humidity: 50, rainProb: 0.20, noiseIdx: 84,
    lat: 25.6693, lng: -100.2398,
  },
  'Allegiant Stadium': {
    city: 'Las Vegas, NV', country: 'USA',
    altitude: 610, capacity: 65000, indoors: true,
    tempC: 40, humidity: 15, rainProb: 0.03, noiseIdx: 77,
    lat: 36.0908, lng: -115.1839,
  },
};

export function getVenue(venueStr) {
  const name = venueStr?.split(' · ')[0];
  return VENUES[name] ?? null;
}

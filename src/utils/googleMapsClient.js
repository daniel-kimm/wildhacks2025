import axios from 'axios';

// Initialize with your Google Maps API key
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
const BASE_URL = 'https://maps.googleapis.com/maps/api';

export const findNearbyActivities = async (locations, radius = 5000, type = 'point_of_interest') => {
  try {
    // Calculate the center point from all locations
    const center = calculateCenterPoint(locations);
    
    // Make request to Google Places API
    const response = await axios.get(`${BASE_URL}/place/nearbysearch/json`, {
      params: {
        location: `${center.lat},${center.lng}`,
        radius: radius,
        type: type,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK') {
      // Sort results by distance from the center point
      const sortedResults = response.data.results.sort((a, b) => {
        const distA = calculateDistance(center, a.geometry.location);
        const distB = calculateDistance(center, b.geometry.location);
        return distA - distB;
      });

      return sortedResults.map(place => ({
        id: place.place_id,
        name: place.name,
        location: place.geometry.location,
        rating: place.rating,
        types: place.types,
        vicinity: place.vicinity,
        distanceFromCenter: calculateDistance(center, place.geometry.location)
      }));
    }

    return [];
  } catch (error) {
    console.error('Error finding nearby activities:', error);
    throw error;
  }
};

export const getPlaceDetails = async (placeId) => {
  try {
    const response = await axios.get(`${BASE_URL}/place/details/json`, {
      params: {
        place_id: placeId,
        key: GOOGLE_MAPS_API_KEY,
        fields: 'name,formatted_address,formatted_phone_number,opening_hours,website,rating,reviews,photos'
      }
    });

    if (response.data.status === 'OK') {
      return response.data.result;
    }

    return null;
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
};

// Helper function to calculate the center point of multiple locations
const calculateCenterPoint = (locations) => {
  const sum = locations.reduce((acc, loc) => ({
    lat: acc.lat + loc.latitude,
    lng: acc.lng + loc.longitude
  }), { lat: 0, lng: 0 });

  return {
    lat: sum.lat / locations.length,
    lng: sum.lng / locations.length
  };
};

// Helper function to calculate distance between two points using the Haversine formula
const calculateDistance = (point1, point2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = point1.lat * Math.PI/180;
  const φ2 = point2.lat * Math.PI/180;
  const Δφ = (point2.lat - point1.lat) * Math.PI/180;
  const Δλ = (point2.lng - point1.lng) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}; 
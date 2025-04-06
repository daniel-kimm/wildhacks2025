import mapboxgl from 'mapbox-gl';

// Set Mapbox API key
mapboxgl.accessToken = 'pk.eyJ1Ijoiem91ZHluYXN0eSIsImEiOiJjbTk0cnhqa3QwdzNsMnJweWQ4dmhxanVwIn0.cNqDoYHQZqoQvc16RejvsQ';

// Function to find nearby activities based on a center point and radius
export const findNearbyActivities = async (center, radius = 5000, categories = ['restaurant', 'cafe', 'park', 'museum', 'entertainment']) => {
  try {
    // Create a bounding box around the center point
    const bbox = [
      center.longitude - (radius / 111000), // Convert meters to degrees (approximate)
      center.latitude - (radius / 111000),
      center.longitude + (radius / 111000),
      center.latitude + (radius / 111000)
    ];
    
    // Use Mapbox Geocoding API to find places
    const results = [];
    
    for (const category of categories) {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${category}.json?bbox=${bbox.join(',')}&access_token=${mapboxgl.accessToken}&types=poi&limit=20`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${category} places: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        // Add category to each result
        const placesWithCategory = data.features.map(feature => ({
          ...feature,
          category
        }));
        
        results.push(...placesWithCategory);
      }
    }
    
    // Calculate distance from center for each result
    const resultsWithDistance = results.map(result => {
      const distance = calculateDistance(
        center.latitude,
        center.longitude,
        result.center[1],
        result.center[0]
      );
      
      return {
        ...result,
        distance
      };
    });
    
    // Sort by distance
    return resultsWithDistance.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error finding nearby activities:', error);
    throw error;
  }
};

// Function to find activities near a group of people
export const findActivitiesNearGroup = async (locations, radius = 5000, categories = ['restaurant', 'cafe', 'park', 'museum', 'entertainment']) => {
  try {
    // Calculate the center point of all locations
    const center = calculateCenterPoint(locations);
    
    // Find activities near the center point
    return await findNearbyActivities(center, radius, categories);
  } catch (error) {
    console.error('Error finding activities near group:', error);
    throw error;
  }
};

// Helper function to calculate the center point of multiple locations
const calculateCenterPoint = (locations) => {
  if (!locations || locations.length === 0) {
    throw new Error('No locations provided');
  }
  
  const sum = locations.reduce((acc, loc) => ({
    latitude: acc.latitude + loc.latitude,
    longitude: acc.longitude + loc.longitude
  }), { latitude: 0, longitude: 0 });
  
  return {
    latitude: sum.latitude / locations.length,
    longitude: sum.longitude / locations.length
  };
};

// Helper function to calculate distance between two points using the Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2 - lat1) * Math.PI/180;
  const Δλ = (lon2 - lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}; 
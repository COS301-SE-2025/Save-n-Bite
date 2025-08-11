// components/auth/StoreLocation.jsx - Replace your existing component

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Phone, Clock, ExternalLink } from 'lucide-react';

// Fix for default Leaflet markers in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon for businesses
const businessIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map center changes
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

const StoreLocation = ({ 
  address, 
  businessName, 
  phone, 
  hours, 
  coordinates,
  openstreetmapUrl
}) => {
  const [mapCoordinates, setMapCoordinates] = useState(coordinates || null);
  const [loading, setLoading] = useState(!coordinates);
  const [error, setError] = useState(null);

  // Default to Pretoria coordinates (perfect for UP!)
  const defaultCenter = [-25.7479, 28.2293]; // [lat, lng] format for Leaflet
  const mapCenter = mapCoordinates ? [mapCoordinates.lat, mapCoordinates.lng] : defaultCenter;

  // Free geocoding using Nominatim
  const geocodeAddress = async (address) => {
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: address,
          format: 'json',
          countrycodes: 'za',
          limit: 1,
          addressdetails: 1
        }),
        {
          headers: {
            'User-Agent': 'SaveNBite/1.0'
          }
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const coords = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
        
        setMapCoordinates(coords);
        setError(null);
      } else {
        setError('Location not found on map');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Could not load map location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!coordinates && address) {
      geocodeAddress(address);
    } else if (!coordinates) {
      setLoading(false);
    }
  }, [address, coordinates]);

  // Handle directions
  const handleGetDirections = () => {
    if (openstreetmapUrl) {
      window.open(openstreetmapUrl, '_blank');
    } else if (mapCoordinates) {
      const url = `https://www.openstreetmap.org/directions?from=&to=${mapCoordinates.lat},${mapCoordinates.lng}`;
      window.open(url, '_blank');
    } else if (address) {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://www.openstreetmap.org/search?query=${encodedAddress}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <MapPin className="mr-2 h-5 w-5 text-emerald-600" />
          Store Location
        </h2>
        
        <button
          onClick={handleGetDirections}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors text-sm"
        >
          <Navigation className="mr-2 h-4 w-4" />
          Get Directions
        </button>
      </div>

      {/* Address Display */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-700 dark:text-gray-200 font-medium">{businessName || 'Store'}</p>
        <p className="text-gray-600 dark:text-gray-300 text-sm">{address}</p>
        
        {/* Business info */}
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
          {phone && (
            <div className="flex items-center">
              <Phone className="mr-1 h-4 w-4" />
              <span>{phone}</span>
            </div>
          )}
          {hours && (
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              <span>{hours}</span>
            </div>
          )}
        </div>
      </div>

      {/* Leaflet Map */}
      <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="w-full h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Loading map...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={mapCoordinates ? 15 : 11}
            style={{ height: '300px', width: '100%' }}
            scrollWheelZoom={true}
          >
            {/* Free OpenStreetMap tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Update map center when coordinates change */}
            <MapController center={mapCenter} zoom={mapCoordinates ? 15 : 11} />
            
            {/* Business marker */}
            {mapCoordinates && (
              <Marker 
                position={[mapCoordinates.lat, mapCoordinates.lng]}
                icon={businessIcon}
              >
                <Popup>
                  <div className="p-2 max-w-xs">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{businessName || 'Store'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{address}</p>
                    {phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        <Phone className="inline h-3 w-3 mr-1" />
                        {phone}
                      </p>
                    )}
                    {hours && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {hours}
                      </p>
                    )}
                    <button
                      onClick={handleGetDirections}
                      className="mt-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 text-sm font-medium"
                    >
                      Get Directions →
                    </button>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        )}
      </div>

      {/* Error handling */}
      {error && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>Map Notice:</strong> {error}
          </p>
          <button
            onClick={handleGetDirections}
            className="mt-2 text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-200 text-sm underline"
          >
            Open in OpenStreetMap
          </button>
        </div>
      )}
    </div>
  );
};

export default StoreLocation;
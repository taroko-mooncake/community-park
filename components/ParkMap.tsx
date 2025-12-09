
import React, { useEffect, useRef } from 'react';
import { Park } from '../types';

declare const L: any;

interface ParkMapProps {
  parks: Park[];
  onParkClick: (id: string) => void;
  center?: { lat: number; lng: number };
}

export const ParkMap: React.FC<ParkMapProps> = ({ parks, onParkClick, center }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already initialized
    if (!mapRef.current) {
      // Default to US center or user location
      const initialLat = center ? center.lat : 39.8283;
      const initialLng = center ? center.lng : -98.5795;
      const initialZoom = center ? 12 : 4;

      mapRef.current = L.map(mapContainerRef.current).setView([initialLat, initialLng], initialZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }
  }, []);

  // Update map view when center changes
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setView([center.lat, center.lng], 12);
    }
  }, [center]);

  // Update markers when parks change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => mapRef.current.removeLayer(marker));
    markersRef.current = [];

    const bounds = L.latLngBounds([]);
    let hasValidMarkers = false;

    parks.forEach(park => {
      if (park.lat && park.lng) {
        const marker = L.marker([park.lat, park.lng])
          .addTo(mapRef.current)
          .bindPopup(`
            <div class="text-center p-2">
              <h3 class="font-bold text-sm mb-1">${park.name}</h3>
              <p class="text-xs text-stone-600 mb-2">${park.location}</p>
              <button class="bg-emerald-600 text-white text-xs px-3 py-1 rounded hover:bg-emerald-700" 
                onclick="window.dispatchEvent(new CustomEvent('park-select', { detail: '${park.id}' }))">
                View Details
              </button>
            </div>
          `);
        
        markersRef.current.push(marker);
        bounds.extend([park.lat, park.lng]);
        hasValidMarkers = true;
      }
    });

    if (hasValidMarkers && !center) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [parks, center]);

  // Listen for custom event from popup button
  useEffect(() => {
    const handleParkSelect = (e: any) => {
      onParkClick(e.detail);
    };
    window.addEventListener('park-select', handleParkSelect);
    return () => window.removeEventListener('park-select', handleParkSelect);
  }, [onParkClick]);

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden shadow-sm border border-stone-200">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};

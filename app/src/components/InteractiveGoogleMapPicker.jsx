import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Layers, Crosshair, Plus, Minus, MapPin } from 'lucide-react';

const InteractiveGoogleMapPicker = ({
  latitude,
  longitude,
  address,
  location,
  onChange,
  onConfirmPin
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const isInternalMoveRef = useRef(false);

  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [pinnedFeedback, setPinnedFeedback] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({
    lat: parseFloat(latitude) || 13.0475,
    lng: parseFloat(longitude) || 80.0911
  });

  // Google Maps Tile URL Generator (Roadmap vs Satellite Hybrid)
  const getGoogleTileUrl = (type) => {
    // lyrs=m : Standard Google Maps Roadmap
    // lyrs=y : Google Maps Hybrid (Satellite Imagery + Street Labels)
    const layer = type === 'satellite' ? 'y' : 'm';
    return `https://mt{s}.google.com/vt/lyrs=${layer}&x={x}&y={y}&z={z}`;
  };

  // Initialize interactive Leaflet map using Google Maps tile layer with Fixed Center Pin
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = parseFloat(latitude) || 13.0475;
    const initialLng = parseFloat(longitude) || 80.0911;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 16,
        minZoom: 3,
        maxZoom: 20,
        zoomControl: false,
        attributionControl: false
      });

      // Google Maps Tile Layer
      const tileLayer = L.tileLayer(getGoogleTileUrl(mapType), {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Handle map movement for exact Amazon/Flipkart center-pinning
      map.on('movestart', () => {
        setIsDragging(true);
      });

      const handleMapMove = () => {
        const center = map.getCenter();
        const latStr = center.lat.toFixed(6);
        const lngStr = center.lng.toFixed(6);
        setCurrentCoords({ lat: center.lat, lng: center.lng });
        isInternalMoveRef.current = true;
        if (onChange) {
          onChange(latStr, lngStr);
        }
      };

      map.on('move', handleMapMove);
      map.on('moveend', () => {
        setIsDragging(false);
        handleMapMove();
      });

      // Tap / Click anywhere on map to pan that location directly under the center pin
      map.on('click', (e) => {
        map.panTo(e.latlng, { animate: true, duration: 0.4 });
      });

      mapInstanceRef.current = map;

      // Ensure proper sizing after modal transition
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Update tile layer when user switches between Roadmap and Satellite
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      tileLayerRef.current.setUrl(getGoogleTileUrl(mapType));
    }
  }, [mapType]);

  // Synchronize map center when external coordinates change
  useEffect(() => {
    if (isInternalMoveRef.current) {
      isInternalMoveRef.current = false;
      return;
    }
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (!isNaN(latNum) && !isNaN(lngNum) && mapInstanceRef.current) {
      const center = mapInstanceRef.current.getCenter();
      if (Math.abs(center.lat - latNum) > 0.00005 || Math.abs(center.lng - lngNum) > 0.00005) {
        mapInstanceRef.current.panTo([latNum, lngNum], { animate: true });
        setCurrentCoords({ lat: latNum, lng: lngNum });
      }
    }
  }, [latitude, longitude]);

  const handleSearchLocation = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');
    try {
      const query = searchQuery.includes('Chennai') || searchQuery.includes('Tamil Nadu')
        ? searchQuery
        : `${searchQuery}, Chennai, Tamil Nadu, India`;

      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const foundLat = parseFloat(data[0].lat);
        const foundLng = parseFloat(data[0].lon);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([foundLat, foundLng], 17, { duration: 1 });
        }
      } else {
        setSearchError('Location not found. Try entering a nearby area or street.');
      }
    } catch (err) {
      setSearchError('Search failed. Please drag map directly.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleRecenter = () => {
    const latNum = parseFloat(latitude) || 13.0475;
    const lngNum = parseFloat(longitude) || 80.0911;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([latNum, lngNum], 17, { duration: 0.6 });
    }
  };

  return (
    <div className="space-y-2">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchLocation} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search area or street in Chennai (e.g. Poonamallee, Porur)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#09090b] border border-zinc-800 text-white text-xs rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:border-amber-500 font-medium placeholder:text-zinc-600"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-zinc-700 transition-all flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {searchError && (
        <div className="text-[10px] text-red-400 font-medium px-2">{searchError}</div>
      )}

      {/* Interactive Map Viewport with 100% Mathematically Exact Center Pin (Amazon / Flipkart Style) */}
      <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-zinc-800 shadow-inner bg-zinc-950 select-none">
        <div ref={mapContainerRef} className="w-full h-full z-0 cursor-grab active:cursor-grabbing" />

        {/* 100% EXACT ZERO-DRIFT CENTER PIN MARKER */}
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
          <div className="relative flex flex-col items-center justify-center">
            {/* Animated Pin Head */}
            <div
              className={`transition-all duration-200 ease-out flex flex-col items-center ${
                isDragging ? '-translate-y-3 scale-110' : 'translate-y-0 scale-100'
              }`}
              style={{ transformOrigin: 'bottom center' }}
            >
              <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="goldPinGrad" x1="0" y1="0" x2="34" y2="42" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="60%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
                  </filter>
                </defs>
                {/* Pin Body */}
                <path
                  d="M17 0C7.61116 0 0 7.61116 0 17C0 26.5 14.5 40.5 16.2 41.6C16.65 41.9 17.35 41.9 17.8 41.6C19.5 40.5 34 26.5 34 17C34 7.61116 26.3888 0 17 0Z"
                  fill="url(#goldPinGrad)"
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="url(#pinShadow)"
                />
                {/* Center Core */}
                <circle cx="17" cy="16" r="6" fill="#09090b" />
                <circle cx="17" cy="16" r="2.5" fill="#f59e0b" />
              </svg>
            </div>

            {/* Ground Contact Target Dot - Mathematically placed right at the needle tip */}
            <div className="relative -mt-1 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-black shadow-md" />
              <div className="absolute w-6 h-6 rounded-full border border-amber-400/60 animate-ping pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Floating Map Controls */}
        <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5 bg-black/75 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xl">
          {/* Map / Satellite Toggle */}
          <button
            type="button"
            onClick={() => setMapType(prev => prev === 'roadmap' ? 'satellite' : 'roadmap')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              mapType === 'satellite'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
            title="Toggle Google Maps Satellite View"
          >
            <Layers size={11} />
            <span>{mapType === 'satellite' ? 'Satellite' : 'Map'}</span>
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer"
            title="Zoom In"
          >
            <Plus size={14} />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer"
            title="Zoom Out"
          >
            <Minus size={14} />
          </button>

          {/* Recenter */}
          <button
            type="button"
            onClick={handleRecenter}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 flex items-center justify-center transition-all cursor-pointer"
            title="Recenter Map"
          >
            <Crosshair size={14} />
          </button>
        </div>

        {/* Helpful Touch Instruction Overlay */}
        <div className="absolute bottom-2 left-2 right-2 z-20 pointer-events-none">
          <div className="bg-black/85 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 text-center shadow-lg">
            <p className="text-[10.5px] font-bold text-amber-300 flex items-center justify-center gap-1.5">
              <MapPin size={12} className="text-amber-400 shrink-0" />
              <span>Drag map or tap to place pin at exact building / plot</span>
            </p>
          </div>
        </div>
      </div>

      {/* Selected Coordinates Status Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#09090b] border border-zinc-800/80 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-400 font-medium">Google Map Pin:</span>
          <span className="text-white font-mono font-bold">
            {Number(currentCoords.lat).toFixed(6)}, {Number(currentCoords.lng).toFixed(6)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            const latStr = Number(currentCoords.lat).toFixed(6);
            const lngStr = Number(currentCoords.lng).toFixed(6);
            setPinnedFeedback(true);
            setTimeout(() => setPinnedFeedback(false), 2000);
            if (onConfirmPin) {
              onConfirmPin(latStr, lngStr);
            }
          }}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          title="Confirm pin position and auto-fill URL"
        >
          <MapPin size={13} className="text-black fill-black" />
          <span>{pinnedFeedback ? '✓ Pinned!' : 'Pin'}</span>
        </button>
      </div>
    </div>
  );
};

export default InteractiveGoogleMapPicker;

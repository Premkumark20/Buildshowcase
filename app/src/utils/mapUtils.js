export const hasMapInput = (mapsUrl, latitude, longitude) => {
  if (latitude && longitude) return true;
  if (mapsUrl && typeof mapsUrl === 'string' && mapsUrl.trim().length > 0) return true;
  return false;
};

export const parseCoordinates = (mapsUrl) => {
  if (!mapsUrl || typeof mapsUrl !== 'string') return null;
  const trimmed = mapsUrl.trim();
  const directCoord = trimmed.match(/^([0-9.-]+)\s*,\s*([0-9.-]+)$/);
  if (directCoord) {
    return {
      latitude: parseFloat(directCoord[1]),
      longitude: parseFloat(directCoord[2])
    };
  }
  const searchMatch = trimmed.match(/\/search\/([0-9.-]+),\s*\+?([0-9.-]+)/);
  if (searchMatch) {
    return {
      latitude: parseFloat(searchMatch[1]),
      longitude: parseFloat(searchMatch[2])
    };
  }
  const coordMatch = trimmed.match(/(?:@|q=|\?q=|ll=)([0-9.-]+),([0-9.-]+)/);
  if (coordMatch) {
    return {
      latitude: parseFloat(coordMatch[1]),
      longitude: parseFloat(coordMatch[2])
    };
  }
  return null;
};

export const resolveShortGoogleMapsUrl = async (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (trimmed.includes('maps.app.goo.gl') || trimmed.includes('goo.gl/maps') || trimmed.includes('bit.ly')) {
    try {
      const res = await fetch(`/api/resolve-map-url?url=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.warn('Could not resolve short map URL:', e);
    }
  }
  return null;
};

export const getGoogleMapsEmbedUrl = (mapsUrl, address, location, latitude, longitude) => {
  // If neither coordinates nor mapsUrl is given, do not show map (hide it)
  if (!hasMapInput(mapsUrl, latitude, longitude)) {
    return null;
  }

  // 1. Direct coordinates passed in - ONLY Google Maps
  if (latitude && longitude) {
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      return `https://maps.google.com/maps?q=${latNum.toFixed(6)},${lngNum.toFixed(6)}&hl=en&z=16&output=embed&iwloc=`;
    }
  }

  // 2. If mapsUrl is provided, extract coordinates, query or place - ONLY Google Maps
  if (mapsUrl && typeof mapsUrl === 'string') {
    const trimmed = mapsUrl.trim();

    // Direct lat,lng string
    const directCoord = trimmed.match(/^([0-9.-]+)\s*,\s*([0-9.-]+)$/);
    if (directCoord) {
      return `https://maps.google.com/maps?q=${directCoord[1]},${directCoord[2]}&hl=en&z=16&output=embed&iwloc=`;
    }
    
    // /search/13.052649,+80.098745
    const searchMatch = trimmed.match(/\/search\/([0-9.-]+),\s*\+?([0-9.-]+)/);
    if (searchMatch) {
      return `https://maps.google.com/maps?q=${searchMatch[1]},${searchMatch[2]}&hl=en&z=16&output=embed&iwloc=`;
    }

    // Coordinates (@13.0475,80.0911 or q=13.0475,80.0911)
    const coordMatch = trimmed.match(/(?:@|q=|\?q=)([0-9.-]+),([0-9.-]+)/);
    if (coordMatch) {
      return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&hl=en&z=16&output=embed&iwloc=`;
    }

    // Query param (?q=... or &q=...)
    const qMatch = trimmed.match(/[?&]q=([^&]+)/);
    if (qMatch) {
      try {
        const decoded = decodeURIComponent(qMatch[1]);
        const innerCoord = decoded.match(/^([0-9.-]+)\s*,\s*([0-9.-]+)$/);
        if (innerCoord) {
          return `https://maps.google.com/maps?q=${innerCoord[1]},${innerCoord[2]}&hl=en&z=16&output=embed&iwloc=`;
        }
        if (!decoded.startsWith('http://') && !decoded.startsWith('https://')) {
          return `https://maps.google.com/maps?q=${encodeURIComponent(decoded)}&hl=en&z=16&output=embed&iwloc=`;
        }
      } catch (e) {}
    }

    // /place/Place+Name/...
    const placeMatch = trimmed.match(/\/place\/([^/@?]+)/);
    if (placeMatch) {
      try {
        const cleanPlace = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ');
        return `https://maps.google.com/maps?q=${encodeURIComponent(cleanPlace)}&hl=en&z=16&output=embed&iwloc=`;
      } catch (e) {}
    }

    // If trimmed is an unresolvable URL (e.g. maps.app.goo.gl), NEVER pass the URL as q param to Google Maps (it causes world map error)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const fallbackQuery = [address, location, 'Chennai'].filter(Boolean).join(', ') || 'Poonamallee, Chennai';
      return `https://maps.google.com/maps?q=${encodeURIComponent(fallbackQuery)}&hl=en&z=16&output=embed&iwloc=`;
    }

    // Non-URL address / query string
    return `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&hl=en&z=16&output=embed&iwloc=`;
  }

  // Fallback to location/address if provided
  const query = [address, location, 'Chennai'].filter(Boolean).join(', ') || 'Poonamallee, Chennai';
  if (query) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=en&z=16&output=embed&iwloc=`;
  }

  return null;
};

export const getGoogleMapsRedirectUrl = (mapsUrl, address, location, latitude, longitude) => {
  if (latitude && longitude) {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
  if (mapsUrl && typeof mapsUrl === 'string' && (mapsUrl.startsWith('http://') || mapsUrl.startsWith('https://'))) {
    return mapsUrl;
  }
  if (mapsUrl && typeof mapsUrl === 'string' && mapsUrl.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsUrl.trim())}`;
  }
  const query = [address, location, 'Chennai'].filter(Boolean).join(', ') || 'Poonamallee, Chennai';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

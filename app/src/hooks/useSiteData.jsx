import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { syncChannel } from '../utils/syncManager.js';

gsap.registerPlugin(ScrollTrigger);
if (typeof window !== 'undefined') {
  window.ScrollTrigger = ScrollTrigger;
}

const CACHE_KEY = 'site_session_data_v3';

const defaultSettings = {
  company_name: 'SK BUILDERS',
  company_subtitle: '& PROPERTY CONSULTANT',
  phone: '',
  email: '',
  location: '',
  service_areas: '',
  hero_tagline: 'BUILDING QUALITY HOMES.',
  hero_headline_find: 'Find',
  hero_headline_property: 'Right Property',
  hero_headline_confidence: 'Confidence',
  hero_subtitle: 'We build individual houses, offer residential land plots, execute contract house construction, and provide expert property consultation.',
  facebook_url: 'https://facebook.com',
  instagram_url: 'https://instagram.com',
  whatsapp_number: '',
  logo_url: '/logo/sk-builders-logo.png',
  site_title: 'SK Builders & Property Consultant',
  meta_description: 'Builder & Property Consultant in Poonamallee, Mangadu & Kundrathur. Houses for sale, residential land, contract construction, and property guidance.'
};

const defaultServices = [
  { id: 1, title: 'Houses for Sale', description: 'Ready-to-move individual houses built with quality and trust.', icon_name: 'Home', link_url: '#properties' },
  { id: 2, title: 'Lands for Sale', description: 'Residential plots in prime locations. DTCP approved plots available.', icon_name: 'MapPin', link_url: '#properties' },
  { id: 3, title: 'Contract House Construction', description: 'We build your dream home on your land with quality and on-time delivery.', icon_name: 'HardHat', link_url: '#contact' },
  { id: 4, title: 'Property Consultant', description: 'Expert help for buying or selling land and houses. End-to-end guidance.', icon_name: 'Users', link_url: '#contact' },
  { id: 5, title: 'Documentation Support', description: 'Assistance for all property related documents and legal process.', icon_name: 'FileText', link_url: '#contact' },
  { id: 6, title: 'Construction Consultation', description: 'Planning, estimation, site visit and expert construction advice.', icon_name: 'Compass', link_url: '#contact' }
];

const defaultStats = [
  { id: 1, icon_name: 'Home', value: '40+', label: 'Homes Built' },
  { id: 2, icon_name: 'MapPin', value: '75+', label: 'Plots Sold' },
  { id: 3, icon_name: 'Users', value: '150+', label: 'Property Deals' },
  { id: 4, icon_name: 'Users', value: '100+', label: 'Happy Families' }
];

const getCachedData = () => {
  try {
    // Purge legacy persistent localStorage caches so browser is clean
    localStorage.removeItem('site_data_cache');
    localStorage.removeItem('site_data_cache_v2');

    // Use browser sessionStorage - preserved across page reloads, automatically deleted when tab/site is closed
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) { }
  return null;
};

const saveCachedData = (dataToCache) => {
  try {
    const toSave = {
      settings: dataToCache.settings,
      admin: dataToCache.admin,
      services: dataToCache.services,
      stats: dataToCache.stats,
      properties: dataToCache.properties,
      land: dataToCache.land,
      projects: dataToCache.projects,
      gallery: dataToCache.gallery,
      testimonials: dataToCache.testimonials,
      heroVideo: dataToCache.heroVideo,
      cachedAt: Date.now()
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(toSave));
  } catch (e) { }
};

const SiteDataContext = createContext(null);

export const resolveAssetUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const base = import.meta.env.BASE_URL || '/';
  if (url.startsWith('/')) {
    return `${base.replace(/\/$/, '')}${url}`;
  }
  return `${base}${url}`;
};

export const getItemCardImage = (item) => {
  if (!item) return '';
  if (item.cover_image && item.cover_image !== '/house/completed-house.jpg' && !item.cover_image.includes('logo')) {
    return item.cover_image;
  }
  if (item.image && item.image !== '/house/completed-house.jpg' && !item.image.includes('logo')) {
    return item.image;
  }
  if (Array.isArray(item.images) && item.images.length > 0) {
    for (const img of item.images) {
      const u = typeof img === 'string' ? img : (img?.image_url || img?.url || '');
      if (u && u !== '/house/completed-house.jpg' && !u.includes('logo')) {
        return u;
      }
    }
  }
  return '';
};

export const updateDynamicWebAppIcon = (logoUrl, companyName, appType = null) => {
  if (typeof document === 'undefined' || !logoUrl) return;

  // 1. Update all Favicon and Touch Icon links in <head>
  const iconSelectors = [
    "link[rel='icon']",
    "link[rel='shortcut icon']",
    "link[rel='apple-touch-icon']",
    "link[rel='apple-touch-icon-precomposed']"
  ];

  iconSelectors.forEach(sel => {
    let link = document.querySelector(sel);
    if (link) {
      link.href = logoUrl;
    } else {
      link = document.createElement('link');
      link.rel = sel.includes('apple') ? 'apple-touch-icon' : 'icon';
      link.href = logoUrl;
      document.head.appendChild(link);
    }
  });

  // 2. Update OpenGraph & Twitter preview images
  const ogImg = document.querySelector("meta[property='og:image']");
  if (ogImg) ogImg.setAttribute('content', logoUrl);
  const twImg = document.querySelector("meta[name='twitter:image']");
  if (twImg) twImg.setAttribute('content', logoUrl);

  // Determine if currently on Admin or Main Site
  const isAdmin = appType === 'admin' || (typeof window !== 'undefined' && (window.location.pathname.includes('/admin') || window.location.hash.includes('admin')));

  // 3. Point to the proper valid HTTPS Web App Manifest (never use blob URLs which break PWA installability)
  const targetManifest = isAdmin ? '/manifest-admin.json' : '/manifest-main.json';
  let manifestLink = document.querySelector("link[rel='manifest']");
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    document.head.appendChild(manifestLink);
  }
  manifestLink.setAttribute('href', targetManifest);
};


export const SiteDataProvider = ({ children }) => {
  const cached = getCachedData();
  const hasCachedData = !!(
    cached && (
      (Array.isArray(cached.projects) && cached.projects.length > 0) ||
      (Array.isArray(cached.properties) && cached.properties.length > 0) ||
      (Array.isArray(cached.gallery) && cached.gallery.length > 0) ||
      (cached.settings && cached.settings.company_name)
    )
  );

  const [data, setData] = useState(() => {
    if (hasCachedData) {
      return {
        settings: cached.settings || defaultSettings,
        admin: cached.admin || { phone: '', email: 'info@skbuilders.com' },
        services: Array.isArray(cached.services) && cached.services.length > 0 ? cached.services : defaultServices,
        stats: Array.isArray(cached.stats) && cached.stats.length > 0 ? cached.stats : defaultStats,
        properties: Array.isArray(cached.properties) ? cached.properties : [],
        land: Array.isArray(cached.land) ? cached.land : [],
        projects: Array.isArray(cached.projects) ? cached.projects : [],
        gallery: Array.isArray(cached.gallery) ? cached.gallery : [],
        testimonials: Array.isArray(cached.testimonials) ? cached.testimonials : [],
        heroVideo: cached.heroVideo || null,
        loading: false,
        isInitialLoading: false
      };
    }

    return {
      settings: defaultSettings,
      admin: { phone: '', email: 'info@skbuilders.com' },
      services: defaultServices,
      stats: defaultStats,
      properties: [],
      land: [],
      projects: [],
      gallery: [],
      testimonials: [],
      heroVideo: null,
      loading: true,
      isInitialLoading: true
    };
  });

  const isFetchingRef = useRef(false);

  const resolveEndpoint = (endpoint) => {
    const base = import.meta.env.BASE_URL || '/';
    const clean = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const isGhPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    if (isGhPages) {
      return `${base.replace(/\/$/, '')}/${clean}.json`;
    }
    return `${base.replace(/\/$/, '')}/${clean}`;
  };

  const fetchWithTimeout = async (url, ms = 3500) => {
    const targetUrl = resolveEndpoint(url);
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(id);
      return res.ok ? await res.json() : null;
    } catch (e) {
      clearTimeout(id);
      return null;
    }
  };

  const refreshData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const [settingsRes, servicesRes, statsRes, propertiesRes, landRes, projectsRes, galleryRes, testimonialsRes, heroVideoRes] = await Promise.all([
        fetchWithTimeout('/api/settings'),
        fetchWithTimeout('/api/services'),
        fetchWithTimeout('/api/stats'),
        fetchWithTimeout('/api/properties'),
        fetchWithTimeout('/api/land'),
        fetchWithTimeout('/api/projects'),
        fetchWithTimeout('/api/gallery'),
        fetchWithTimeout('/api/testimonials'),
        fetchWithTimeout('/api/media/hero-video')
      ]);

      const propsList = Array.isArray(propertiesRes?.properties) ? propertiesRes.properties : (Array.isArray(propertiesRes) ? propertiesRes : null);
      const landList = Array.isArray(landRes?.land) ? landRes.land : (Array.isArray(landRes) ? landRes : null);
      const projList = Array.isArray(projectsRes?.projects) ? projectsRes.projects : (Array.isArray(projectsRes) ? projectsRes : null);

      setData(prev => {
        const nextState = {
          settings: settingsRes?.settings || prev.settings,
          admin: settingsRes?.admin || prev.admin,
          services: Array.isArray(servicesRes) && servicesRes.length > 0 ? servicesRes : prev.services,
          stats: Array.isArray(statsRes) && statsRes.length > 0 ? statsRes : prev.stats,
          properties: Array.isArray(propsList) ? propsList : prev.properties,
          land: Array.isArray(landList) ? landList : prev.land,
          projects: Array.isArray(projList) ? projList : prev.projects,
          gallery: Array.isArray(galleryRes) ? galleryRes : prev.gallery,
          testimonials: Array.isArray(testimonialsRes) ? testimonialsRes : prev.testimonials,
          heroVideo: heroVideoRes !== null ? heroVideoRes : prev.heroVideo,
          loading: false,
          isInitialLoading: false
        };

        saveCachedData(nextState);
        requestAnimationFrame(() => {
          ScrollTrigger.sort();
          ScrollTrigger.refresh();
        });
        return nextState;
      });
    } catch (err) {
      console.error('Error fetching site data:', err);
      setData(prev => ({ ...prev, loading: false, isInitialLoading: false }));
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const lastServerVersionRef = useRef(0);

  useEffect(() => {
    // If browser session already has cached site data, use it without re-requesting all endpoints on reload!
    if (!hasCachedData) {
      refreshData();
    } else {
      // Fast background version check to see if remote data changed
      fetch('/api/sync/version')
        .then(r => r.ok ? r.json() : null)
        .then(v => {
          if (v?.version) {
            lastServerVersionRef.current = v.version;
          }
        })
        .catch(() => {});
    }

    // 1. Storage event listener (cross-tab on same origin)
    const handleStorageChange = (e) => {
      if (['site_data_updated', 'data_updated', 'primary_video_updated', 'primary_video_updated'].includes(e.key)) {
        refreshData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 2. Custom window events (same tab/window)
    const handleCustomUpdate = () => {
      refreshData();
    };
    window.addEventListener('site_data_updated', handleCustomUpdate);
    window.addEventListener('data_updated', handleCustomUpdate);
    window.addEventListener('primary_video_updated', handleCustomUpdate);
    window.addEventListener('primary_video_updated', handleCustomUpdate);

    // 3. BroadcastChannel (instant 0ms cross-tab sync)
    const handleBroadcast = (event) => {
      if (event?.data?.type === 'DATA_UPDATED') {
        refreshData();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', handleBroadcast);
    }

    // 4. Remote polling for cross-device & mobile sync (polls lightweight /api/sync/version every 2500ms)
    const versionPollTimer = setInterval(async () => {
      try {
        const res = await fetch('/api/sync/version');
        if (res.ok) {
          const { version } = await res.json();
          if (version && lastServerVersionRef.current > 0 && version > lastServerVersionRef.current) {
            refreshData();
          }
          if (version) {
            lastServerVersionRef.current = version;
          }
        }
      } catch (e) {}
    }, 2500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('site_data_updated', handleCustomUpdate);
      window.removeEventListener('data_updated', handleCustomUpdate);
      window.removeEventListener('primary_video_updated', handleCustomUpdate);
      window.removeEventListener('primary_video_updated', handleCustomUpdate);
      if (syncChannel) {
        syncChannel.removeEventListener('message', handleBroadcast);
      }
      clearInterval(versionPollTimer);
    };
  }, [refreshData]);

  useEffect(() => {
    if (data.settings) {
      if (!window.location.hash.includes('admin') && !window.location.pathname.includes('admin')) {
        const companyStr = data.settings.company_name
          ? `${data.settings.company_name} ${data.settings.company_subtitle || ''}`.trim()
          : '';
        const title = companyStr || data.settings.site_title || 'SK BUILDERS & PROPERTY CONSULTANT';
        if (title) {
          document.title = title;
        }
      }
      if (data.settings.logo_url) {
        updateDynamicWebAppIcon(data.settings.logo_url, data.settings.company_name);
      }
      const metaDesc = data.settings.meta_description || data.settings.hero_subtitle;
      if (metaDesc) {
        let descTag = document.querySelector('meta[name="description"]');
        if (!descTag) {
          descTag = document.createElement('meta');
          descTag.name = 'description';
          document.head.appendChild(descTag);
        }
        descTag.setAttribute('content', metaDesc);
      }
    }
  }, [data.settings]);

  const value = { ...data, refreshData };

  return (
    <SiteDataContext.Provider value={value}>
      {children}
    </SiteDataContext.Provider>
  );
};

export const useSiteData = () => {
  const context = useContext(SiteDataContext);
  if (!context) {
    return {
      settings: defaultSettings,
      admin: { phone: '', email: 'info@skbuilders.com' },
      services: defaultServices,
      stats: defaultStats,
      properties: [],
      land: [],
      projects: [],
      gallery: [],
      testimonials: [],
      heroVideo: null,
      loading: false,
      isInitialLoading: false,
      refreshData: () => {}
    };
  }
  return context;
};

export default useSiteData;

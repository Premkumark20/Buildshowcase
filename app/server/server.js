import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import propertiesRouter from './routes/properties.js';
import landRouter from './routes/land.js';
import projectsRouter from './routes/projects.js';
import leadsRouter from './routes/leads.js';
import contactRouter from './routes/contact.js';
import siteSettingsRouter from './routes/siteSettings.js';
import servicesRouter from './routes/services.js';
import galleryRouter from './routes/gallery.js';
import testimonialsRouter from './routes/testimonials.js';
import feedbackRouter from './routes/feedback.js';
import mediaRouter from './routes/media.js';
import statsRouter from './routes/stats.js';
import db from './database/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static assets from public, project root, uploads, logo, and videos folders
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../../')));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/logo', express.static(path.join(__dirname, '../../logo')));
app.use('/logo', express.static(path.join(process.cwd(), 'logo')));
app.use('/videos', express.static(path.join(__dirname, '../public/videos'), { acceptRanges: true }));
app.use('/videos', express.static(path.join(__dirname, '../../videos'), { acceptRanges: true }));
app.use('/frames', express.static(path.join(__dirname, '../../frames')));
app.use('/frames', express.static(path.join(process.cwd(), 'frames')));

if (process.env.VERCEL) {
  app.use('/uploads', express.static('/tmp/uploads'));
  app.use('/logo', express.static('/tmp/logo'));
  app.use('/videos', express.static('/tmp/videos', { acceptRanges: true }));
}

// Fallback explicit static handler for /uploads/*
app.get('/uploads/*', (req, res, next) => {
  const subPath = req.params[0];
  const candidates = [
    path.join(__dirname, '../../uploads', subPath),
    path.join(process.cwd(), 'uploads', subPath),
    path.join('/tmp/uploads', subPath)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return res.sendFile(c);
    }
  }
  next();
});

// Global server data version tracker for instant live reload across devices
let serverDataVersion = Date.now();

app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.path.startsWith('/api')) {
    if (!req.path.includes('/login') && !req.path.includes('/auth-status')) {
      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          serverDataVersion = Date.now();
        }
      });
    }
  }
  next();
});

app.get('/api/sync/version', (req, res) => {
  res.json({ version: serverDataVersion });
});

// 1. Main Site Web App Manifest
app.get(['/manifest-main.json', '/api/manifest-main.json'], (req, res) => {
  db.get('SELECT company_name, company_subtitle, meta_description, logo_url FROM site_settings ORDER BY id ASC LIMIT 1', [], (err, row) => {
    const company = row?.company_name || 'SK BUILDERS';
    const subtitle = row?.company_subtitle || '& PROPERTY CONSULTANT';
    const fullName = `${company} ${subtitle}`.trim();
    const logo = row?.logo_url || '/logo/sk-builders-logo.png';

    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'no-cache');
    res.json({
      name: fullName,
      short_name: company,
      description: row?.meta_description || `${fullName} - Builder & Property Consultant Showcase`,
      start_url: '/',
      scope: '/',
      id: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      background_color: '#09090b',
      theme_color: '#09090b',
      icons: [
        {
          src: logo,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: logo,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ],
      shortcuts: [
        {
          name: 'Houses for Sale',
          short_name: 'Houses',
          url: '/all-properties',
          icons: [{ src: logo, sizes: '192x192' }]
        },
        {
          name: 'Residential Land',
          short_name: 'Land',
          url: '/all-properties',
          icons: [{ src: logo, sizes: '192x192' }]
        },
        {
          name: 'Submit Feedback',
          short_name: 'Feedback',
          url: '/feedback',
          icons: [{ src: logo, sizes: '192x192' }]
        }
      ]
    });
  });
});

// 2. Admin Site Web App Manifest (Direct entry to Admin Portal & Leads)
app.get(['/manifest-admin.json', '/api/manifest-admin.json'], (req, res) => {
  db.get('SELECT company_name, company_subtitle, meta_description, logo_url FROM site_settings ORDER BY id ASC LIMIT 1', [], (err, row) => {
    const company = row?.company_name || 'SK BUILDERS';
    const fullName = `${company} Admin Portal`;
    const logo = row?.logo_url || '/logo/sk-builders-logo.png';

    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'no-cache');
    res.json({
      name: fullName,
      short_name: 'Admin Portal',
      description: `${company} - Admin Management & Real-Time Lead Alerts`,
      start_url: '/admin',
      scope: '/admin',
      id: '/admin',
      display: 'standalone',
      orientation: 'portrait-primary',
      background_color: '#09090b',
      theme_color: '#09090b',
      icons: [
        {
          src: logo,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: logo,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ],
      shortcuts: [
        {
          name: 'Leads & Enquiries',
          short_name: 'Leads',
          url: '/admin#leads',
          icons: [{ src: logo, sizes: '192x192' }]
        },
        {
          name: 'Admin Settings',
          short_name: 'Settings',
          url: '/admin#settings',
          icons: [{ src: logo, sizes: '192x192' }]
        }
      ]
    });
  });
});

// 3. Fallback Dynamic Web App Manifest
app.get(['/manifest.json', '/api/manifest.json'], (req, res) => {
  const isAdminRequest = req.query.app === 'admin' || req.headers.referer?.includes('/admin');
  const targetPath = isAdminRequest ? '/api/manifest-admin.json' : '/api/manifest-main.json';
  res.redirect(307, targetPath);
});

// API Routes
app.use('/api/settings', siteSettingsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/land', landRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/testimonials', testimonialsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/media', mediaRouter);

// Resolve Google Maps Short URLs (e.g. maps.app.goo.gl) into clean coordinates
app.all('/api/resolve-map-url', async (req, res) => {
  const targetUrl = req.query.url || req.body?.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    let resolvedUrl = targetUrl;
    if (targetUrl.includes('goo.gl') || targetUrl.includes('maps.app.goo.gl') || targetUrl.includes('bit.ly')) {
      const response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      resolvedUrl = response.url || targetUrl;
    }

    let latitude = null;
    let longitude = null;

    // Pattern 1: /search/13.052649,+80.098745 or /search/13.052649,80.098745
    const searchMatch = resolvedUrl.match(/\/search\/([0-9.-]+),\s*\+?([0-9.-]+)/);
    if (searchMatch) {
      latitude = searchMatch[1];
      longitude = searchMatch[2];
    }

    // Pattern 2: @13.052649,80.098745
    if (!latitude) {
      const atMatch = resolvedUrl.match(/@([0-9.-]+),([0-9.-]+)/);
      if (atMatch) {
        latitude = atMatch[1];
        longitude = atMatch[2];
      }
    }

    // Pattern 3: q=13.052649,80.098745 or ?q=13.052649,80.098745
    if (!latitude) {
      const qMatch = resolvedUrl.match(/[?&]q=([0-9.-]+),([0-9.-]+)/);
      if (qMatch) {
        latitude = qMatch[1];
        longitude = qMatch[2];
      }
    }

    // Pattern 4: ll=13.052649,80.098745
    if (!latitude) {
      const llMatch = resolvedUrl.match(/[?&]ll=([0-9.-]+),([0-9.-]+)/);
      if (llMatch) {
        latitude = llMatch[1];
        longitude = llMatch[2];
      }
    }

    const cleanMapUrl = latitude && longitude ? `https://maps.google.com/?q=${latitude},${longitude}` : resolvedUrl;

    res.json({
      success: true,
      resolvedUrl,
      latitude,
      longitude,
      cleanMapUrl
    });
  } catch (err) {
    console.error('Error resolving map URL:', err.message);
    res.status(500).json({ error: 'Failed to resolve map URL', details: err.message });
  }
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SK Builders API', timestamp: new Date().toISOString() });
});

// Explicit 404 handler for missing static assets routed to Express
app.use(['/uploads', '/frames', '/videos', '/logo'], (req, res) => {
  res.status(404).json({ error: 'Asset not found' });
});

// Global Express error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Express Error]:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

if (!process.env.VERCEL) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Builders Express Backend Server listening on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[EADDRINUSE] Port ${PORT} is already in use by another running Node process.`);
      console.error(`If a previous backend instance is active, you can kill it or proceed with the existing server.`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

export default app;

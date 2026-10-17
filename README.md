# Buildshowcase - Modern Business Showcase & Construction Platform

A state-of-the-art, full-stack real estate and construction showcase web application built for **Builders & Property Consultant**, serving **Poonamallee, Mangadu, Kundrathur, and Greater Chennai**.

🌐 **Repository**: [https://github.com/Premkumark20/Buildshowcase](https://github.com/Premkumark20/Buildshowcase)  
🚀 **Live Website**: [https://buildshowcase.vercel.app/](https://buildshowcase.vercel.app/)

---

## 🏢 About the Platform

**Buildshowcase** is a high-performance web platform and Progressive Web Application (PWA) tailored for building contractors and property consultants. It combines cinematic visual storytelling with an enterprise-grade administrative dashboard, instant lead dispatch, and real-time mobile notifications.

* **Primary Service Locations**: Poonamallee, Mangadu, Kundrathur, Kanchipuram District & Greater Chennai, Tamil Nadu.
* **Core Values**: Uncompromising structural engineering, transparent pricing, quality certifications, and on-time key handover.

---

## 🛠️ Core Services

| Service | Description |
|---|---|
| 🏡 **Houses for Sale** | Ready-to-move & under-construction luxury homes, individual houses, and duplex villas with RCC column foundations and red brick masonry. |
| 🗺️ **Lands & Residential Plots** | DTCP & CMDA approved residential plots in prime locations with clear titles, road access, and high appreciation potential. |
| 🏗️ **Contract Construction** | End-to-end turnkey construction on customer plots—architectural 2D/3D plans, structural engineering, brickwork, roofing, and interior finishing. |
| 👥 **Property Consultation** | Transparent market valuation, site visits, legal document reviews, and investor guidance. |
| 📄 **Documentation Support** | Patta transfers, Encumbrance Certificates (EC), parent document verification, and registration assistance. |
| 📐 **Estimation & Structural Design** | Detailed cost estimation, soil analysis guidance, site supervision, and certified engineer approvals. |

---

## ✨ Key Features & Interactive Capabilities

### 1. 📱 Dual Web Applications (Main Site & Admin Site)
- **Main Site Web App (`/manifest-main.json`)**:
  - Installs as a standalone client-facing application directly on Android, iOS, Windows, and macOS home screens.
  - Launches into `/` showcasing ready-to-move houses, approved residential lands, 3D construction storyboard, and inquiry forms.
  - Includes App Shortcuts for rapid navigation to *Houses for Sale*, *Residential Land*, *Feedback*, and *Admin*.
- **Admin Site Web App (`/manifest-admin.json`)**:
  - Installs as a dedicated management application directly from the Admin Portal.
  - Launches straight into `/admin` with secure tab-scoped sessions (automatically logging out when the tab is closed for enhanced security).
  - Includes App Shortcuts for *Leads & Enquiries* and *Admin Settings*.

### 2. 🔔 Real-Time Mobile Lead Notifications & Direct Notification Bar Access
- **Instant Mobile Bar Alerts**: Whenever a potential buyer or client submits an enquiry on the main website, a push notification is dispatched instantly to the admin's device notification bar.
- **Direct Lead Access (No Login Required)**: Tapping the lead notification in the device notification bar or drawer automatically opens the Admin Portal directly into the **Leads section** without requiring credentials.
- **SSE Stream + Polling**: Instant sub-second lead notifications powered by Server-Sent Events (`/api/leads/events`) with automatic fallback polling (`/api/leads/latest`).
- **Notification Audio Chime & Vibration**: Includes audio chime via Web Audio API and custom haptic vibration patterns on supported Android devices.

### 3. ⚡ Direct Neon DB Lead Status Tracking (Zero Blob Overhead)
- **Database-Only Contact Complete Updates**: Marking a customer enquiry as "Contact Completed" updates **Neon DB (PostgreSQL)** directly via SQL transactions.
- **No Blob Storage Overhead**: Eliminates `lead_backup.json` writes for status changes, delivering instant, lightweight state updates without unnecessary file upload operations.

### 4. 🎬 Cinematic 3D Construction Storyboard
- **GSAP ScrollTrigger Canvas Scrubbing**: Smoothly renders 121 high-definition WebP frames as the user scrolls, visually transforming empty land into a finished luxury home.
- **5-Stage Construction Timeline**: Step-by-step interactive milestones (*Architectural Plan ➔ Column Foundation ➔ Red Brick Masonry ➔ Waterproof Concrete Roof ➔ Key Handover*).

### 5. 🔐 Comprehensive Admin Portal (`/admin`)
- **Customer Inquiries & Leads Section**: Structured card grid with direct one-click Call (`tel:`), WhatsApp (`wa.me`), and "Contact Completed" status tracking.
- **Client Feedbacks & Reviews Table**: Structured data table with sticky header, Y-axis vertical scrolling, Star rating badges, contact shortcuts, publish/hide toggles, and deletion.
- **Property & Land Management**: Full CRUD controls for houses, plots, and ongoing projects with batch image uploads, cover image selection, and drag-and-drop reordering.
- **Security & Database Backup**: One-click database reset and cloud backup synchronization via Vercel Blob Storage.
- **Video & Frame Management**: Live extraction progress tracking and background hero video management.

### 6. ⭐ Public Client Feedback & Reviews Portal (`/feedback`)
- **Direct Client Reviews**: Verified clients submit ratings (1–5 stars), service tags, locations, and testimonials.
- **Contextual Redirection**: Visitors can submit feedback directly for specific properties or projects from their respective detail pages.

---

## 💻 Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS v4, GSAP 3 (ScrollTrigger), Lenis Smooth Momentum Scroll, Lucide React, Service Worker API.
- **Backend**: Node.js, Express.js, PostgreSQL / Neon DB (`pg`), SQLite (`showcase.db`), Server-Sent Events (SSE), Multer.
- **Cloud Storage & Sync**: Vercel Blob Storage integration (`@vercel/blob`) for media storage.
- **Media Processing**: Python OpenCV automated frame extractor (`python/extract_frames.py`).

---

## 🚀 Getting Started & Local Development

### 1. Clone the Repository
```bash
git clone https://github.com/Premkumark20/Buildshowcase.git
cd Buildshowcase
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
This concurrently boots:
- **Frontend (Vite)**: `http://localhost:5173`
- **Backend (Express API & SQLite)**: `http://localhost:5000`

### 4. Access Admin Dashboard
Navigate to `http://localhost:5173/admin` to manage properties, land, projects, leads, and reviews.

### 5. Build for Production
```bash
npm run build
```

---

## 📁 Project Structure

```text
Buildshowcase/
├── app/
│   ├── public/              # Static public assets (manifest.json, sw.js, logo, icons)
│   ├── server/              # Express backend server
│   │   ├── database/        # SQLite database & SQL schemas
│   │   ├── routes/          # API routes (leads, siteSettings, properties, media, etc.)
│   │   └── utils/           # Blob storage & backup synchronizers
│   └── src/
│       ├── animations/      # GSAP & ScrollTrigger configurations
│       ├── components/      # React UI components (AdminDashboard, Detail pages, etc.)
│       ├── hooks/           # Data fetching & site state providers
│       └── utils/           # Sync managers and phone helpers
├── python/                  # Frame extraction scripts (OpenCV)
├── package.json
├── vite.config.js
└── README.md
```

---

## 📞 Business Contact

- **Company Name**: Builders & Property Consultant
- **Location**: Poonamallee, Mangadu, Kundrathur, Chennai, Tamil Nadu
- **Email**: info@builders.com
- **Services**: Construction, Land Sales, Individual Houses & Legal Documentation

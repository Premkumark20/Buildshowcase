import React, { useState, useEffect, useRef } from 'react';
import { Lock, LogOut, Plus, Trash2, ShieldCheck, Home, MapPin, Users, Settings, Image as ImageIcon, Video, CheckCircle, Upload, X, Save, AlertTriangle, Star, Building, Layers, Eye, EyeOff, FileText, Check, Map, Compass, Phone, User, Sparkles, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, GripVertical, Quote, UserPlus, Mail, ChevronDown, ChevronUp, Share2, HardHat, Edit3, BarChart2, Zap, RefreshCw, Navigation, ExternalLink, Bell, BellOff, Smartphone } from 'lucide-react';
import { triggerDataSync, syncChannel } from '../utils/syncManager.js';
import { compressImage, compressImages } from '../utils/imageCompressor.js';
import { getGoogleMapsEmbedUrl, getGoogleMapsRedirectUrl, parseCoordinates, resolveShortGoogleMapsUrl } from '../utils/mapUtils.js';
import InteractiveGoogleMapPicker from './InteractiveGoogleMapPicker.jsx';
import { updateDynamicWebAppIcon } from '../hooks/useSiteData.jsx';

const renderIconByName = (iconName, size = 18, className = 'text-amber-400') => {
  switch (iconName) {
    case 'Home': return <Home size={size} className={className} />;
    case 'MapPin': return <MapPin size={size} className={className} />;
    case 'HardHat': return <HardHat size={size} className={className} />;
    case 'Users': return <Users size={size} className={className} />;
    case 'FileText': return <FileText size={size} className={className} />;
    case 'Compass': return <Compass size={size} className={className} />;
    case 'Building': return <Building size={size} className={className} />;
    case 'ShieldCheck': return <ShieldCheck size={size} className={className} />;
    case 'Star': return <Star size={size} className={className} />;
    default: return <Home size={size} className={className} />;
  }
};

const getVideoSrcUrl = (filepath, filename) => {
  if (!filepath && !filename) return '';
  if (filepath && (filepath.startsWith('http://') || filepath.startsWith('https://'))) return filepath;
  if (filepath && filepath.startsWith('/')) return filepath;
  if (filepath && filepath.includes('app/public/videos/')) return `/videos/${filepath.split('app/public/videos/')[1]}`;
  if (filepath && filepath.includes('uploads/videos/')) return `/${filepath}`;
  if (filepath && filepath.includes('videos/')) return `/${filepath}`;
  return `/videos/${filename || ''}`;
};

const notifySiteDataUpdated = (section = 'all') => {
  triggerDataSync({ section });
};

const notifyPrimaryVideoUpdated = () => {
  triggerDataSync({ section: 'video' });
};

const formatLastUpdated = (dateStr) => {
  if (!dateStr) return 'Recently';
  let isoStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  if (!isoStr.endsWith('Z') && !isoStr.includes('+')) {
    isoStr += 'Z';
  }
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const getServiceAreaOptions = (serviceAreasStr, locationStr) => {
  const rawStr = serviceAreasStr || locationStr || '';
  const list = rawStr
    .split(/[,•|;/]/)
    .map(s => s.trim())
    .filter(Boolean);

  return [...new Set(list)];
};


/**
 * Sleek circular pie progress indicator for individual cards.
 * Displays exact upload percentage with animated filling stroke and status transitions.
 */
const CardPieProgress = ({
  pct = 0,
  size = 40,
  strokeWidth = 3.5,
  status = 'uploading',
  title = '',
  message = '',
  total = 0,
  current = 0,
  showLabel = true
}) => {
  const isCompleted = status === 'completed' || pct >= 100;
  const isError = status === 'error';
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePct = Math.max(0, Math.min(100, Math.round(pct)));
  const offset = circumference - (safePct / 100) * circumference;

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-amber-500/40 shadow-sm shrink-0">
      <div
        className="relative flex items-center justify-center shrink-0 rounded-full bg-black/60"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Pie / Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isError ? '#ef4444' : '#f59e0b'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={isCompleted ? 0 : offset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.35s ease, stroke 0.3s ease' }}
          />
        </svg>

        {/* Center Percentage Display - Matching Video & Frames Style */}
        <span className="absolute text-[10px] font-black text-amber-400 tracking-tighter">
          {safePct}%
        </span>
      </div>

      {showLabel && (
        <div className="text-left min-w-0">
          <div className="text-[11px] font-extrabold text-amber-400 flex items-center gap-1.5 leading-none">
            {isCompleted ? (
              <>
                <Check size={13} className="stroke-[3] text-amber-400 shrink-0" />
                <span>{title || 'Saved successfully!'}</span>
              </>
            ) : isError ? (
              <>
                <AlertTriangle size={13} className="text-red-400 shrink-0" />
                <span className="text-red-400">{title || 'Upload Failed'}</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block shrink-0" />
                <span>{title || (total > 1 ? `Saving ${current}/${total}` : `Saving (${safePct}%)`)}</span>
              </>
            )}
          </div>
          {!isCompleted && !isError && (
            <div className="text-[10px] text-zinc-400 font-medium truncate max-w-[160px] mt-1">
              {message || 'Saving in background...'}
            </div>
          )}
          {isError && (
            <div className="text-[10px] text-red-400 font-medium truncate max-w-[160px] mt-1">
              {message || 'Please try again'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminLoadingSkeleton = () => (
  <div className="space-y-3 py-4">
    {[1, 2, 3].map((n) => (
      <div key={n} className="bg-[#18181b]/70 p-4 rounded-2xl border border-zinc-800/80 animate-pulse flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-zinc-800/60 shrink-0" />
          <div className="space-y-2">
            <div className="w-36 h-3.5 bg-zinc-800/80 rounded" />
            <div className="w-48 h-3 bg-zinc-800/40 rounded" />
          </div>
        </div>
        <div className="w-16 h-8 bg-zinc-800/50 rounded-xl shrink-0" />
      </div>
    ))}
  </div>
);

const LoginBackgroundCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${p.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-70" />;
};

const generatePropertyDescription = (prop) => {
  if (!prop) return '';
  const sentences = [];

  // Title / Type & Location
  const titleText = String(prop.title || '').trim();
  const typeText = String(prop.type || 'Individual House');
  const locText = String(prop.location || prop.area || '');

  if (titleText) {
    sentences.push(`${titleText}${locText ? ` located in ${locText}` : ''}.`);
  } else {
    sentences.push(`Premium ${prop.bedrooms ? `${prop.bedrooms} ` : ''}${typeText}${locText ? ` in ${locText}` : ''}.`);
  }

  // Specifications
  const specs = [];
  if (prop.bedrooms) {
    const bedStr = String(prop.bedrooms).trim();
    const bed = bedStr.includes('BHK') ? bedStr : `${bedStr} BHK`;
    specs.push(bed);
  }
  if (prop.builtup_area) {
    const builtUnit = String(prop.builtup_area).match(/[a-zA-Z]/) ? '' : ` ${prop.builtup_area_unit || 'sq.ft'}`;
    specs.push(`${prop.builtup_area}${builtUnit} built-up area`);
  }
  if (prop.plot_area) {
    const plotUnit = String(prop.plot_area).match(/[a-zA-Z]/) ? '' : ` ${prop.plot_area_unit || 'sq.ft'}`;
    specs.push(`${prop.plot_area}${plotUnit} plot area`);
  }
  if (prop.facing) specs.push(`${prop.facing} facing`);
  if (prop.floors) specs.push(`${prop.floors} floor${Number(prop.floors) > 1 ? 's' : ''}`);
  if (specs.length > 0) {
    sentences.push(`Featuring ${specs.join(', ')}.`);
  }

  // Construction & Quality
  const constr = [];
  if (prop.construction_status) constr.push(`Status: ${prop.construction_status}`);
  if (prop.construction_type) constr.push(prop.construction_type);
  if (prop.roof_type) constr.push(prop.roof_type);
  if (prop.year_built) constr.push(`Built year: ${prop.year_built}`);
  if (constr.length > 0) {
    sentences.push(`High-quality construction with ${constr.join(', ')}.`);
  }

  // Amenities & Features
  const features = [];
  if (prop.compound_wall) features.push('Compound Wall');
  if (prop.gate) features.push('Dedicated Gate');
  if (prop.borewell) features.push('Borewell');
  if (prop.overhead_tank) features.push('Overhead Water Tank');
  if (prop.water_connection) features.push('Drinking Water Connection');
  if (prop.eb_connection) features.push('EB 3-Phase Connection');
  if (prop.sewer_connection) features.push('Drainage/Sewer Facility');
  if (prop.ground_water) features.push('Potable Ground Water');
  if (prop.road_access) features.push(`Direct Road Access${prop.road_width ? ` (${prop.road_width} ${prop.road_width_unit || 'ft'} ${prop.road_type || ''})` : ''}`);
  if (prop.parking_available === 'Yes') features.push('Vehicle Parking');
  if (features.length > 0) {
    sentences.push(`Key Features & Amenities: ${features.join(', ')}.`);
  }

  // Price & Negotiation
  if (prop.price) {
    sentences.push(`Offered at an attractive price of ${prop.price}${prop.negotiable === 'Yes' ? ' (Negotiable)' : ''}.`);
  }

  // Documentation / Legal
  const legal = [];
  if (prop.patta_status === 'Available') legal.push('Clear Patta');
  if (prop.ec_status === 'Available') legal.push('Verified EC');
  if (prop.approved_plan_status === 'Available') legal.push('Approved Building Plan');
  if (prop.sale_deed_status === 'Available') legal.push('Clear Sale Deed');
  if (legal.length > 0) {
    sentences.push(`Documentation: ${legal.join(', ')} available with 100% clear title.`);
  }

  if (prop.other_documents && String(prop.other_documents).trim()) {
    sentences.push(`Registration / Legal Notes: ${String(prop.other_documents).trim()}`);
  }

  return sentences.join('\n\n');
};

const landTitleOptions = [
  'DTCP Approved Residential Plot',
  'CMDA Approved Residential Plot',
  'Residential Land Plot for Sale',
  'Gated Community Villa Plot',
  'Corner Residential Plot for Sale',
  'Prime House Site for Sale',
  'Commercial Land / Plot',
  'Farm Land / Agriculture Plot'
];

const projectTitleOptions = [
  'Individual Villa Construction',
  'Residential House Construction',
  'Duplex Home Construction',
  'Independent House Project',
  'Commercial Building Construction',
  'Modern Villa Project',
  'Turnkey House Construction',
  'Home Renovation & Remodeling'
];

const generateLandDescription = (l) => {
  const parts = [];
  const titleStr = (l.title || '').trim() || (l.land_type || 'Residential Plot');
  const locStr = (l.location || l.area || '').trim();
  const approvalStr = (l.approval_status && l.approval_status !== 'Not Provided') ? l.approval_status : '';
  const areaStr = l.plot_area ? `${l.plot_area} ${l.plot_area_unit || 'sq.ft'}` : '';
  const lengthStr = l.length ? `${l.length} ft` : '';
  const widthStr = l.width ? `${l.width} ft` : '';
  const dimensionsStr = (lengthStr && widthStr) ? ` (${lengthStr} x ${widthStr})` : (l.frontage ? ` (${l.frontage})` : '');

  // Sentence 1: Intro (Approval + Title + Area + Location)
  let intro = '';
  if (approvalStr) {
    intro += `Prime ${approvalStr} `;
  } else {
    intro += 'Prime ';
  }
  intro += titleStr;
  if (areaStr) {
    intro += ` spanning ${areaStr}${dimensionsStr}`;
  }
  intro += ' for sale';
  if (locStr) {
    intro += ` in a prime, developing location of ${locStr}, Chennai`;
  }
  intro += '.';
  parts.push(intro);

  // Sentence 2: Facing, Road, Corner
  const facingStr = l.facing ? `${l.facing} facing` : '';
  const roadWidthStr = l.road_width ? `${l.road_width} ${l.road_width_unit || 'ft'}` : '';
  const roadTypeStr = l.road_type || '';
  const roadDetail = (roadWidthStr && roadTypeStr) ? `${roadWidthStr} ${roadTypeStr}` : (roadWidthStr || roadTypeStr);

  const featurePhrases = [];
  if (facingStr) featurePhrases.push(`is ${facingStr}`);
  if (roadDetail) featurePhrases.push(`has direct access to a ${roadDetail}`);
  if (l.corner_plot === 'Yes') featurePhrases.push('features premium corner plot frontage with dual road access');

  if (featurePhrases.length > 0) {
    parts.push(`The property ${featurePhrases.join(' and ')}.`);
  }

  // Sentence 3: Utilities & Infrastructure Checkboxes
  const facilities = [];
  if (l.eb_available) facilities.push('EB Electricity power line');
  if (l.water_available) facilities.push('Drinking water facility');
  if (l.drainage_available) facilities.push('Drainage / Sewerage system');
  if (l.borewell_available) facilities.push('Sweet ground water');
  if (l.gated_community) facilities.push('Gated community boundary');
  if (l.street_lights) facilities.push('Street lights');

  if (facilities.length > 0) {
    parts.push(`Utilities & Infrastructure: ${facilities.join(', ')}.`);
  }

  // Sentence 4: Documents & Legal
  const docs = [];
  if (l.patta_status === 'Available') docs.push('Clear Patta');
  if (l.ec_status === 'Available' || l.ec_status === 'Clear EC') docs.push('Clear Encumbrance (EC)');
  if (l.parent_documents_status === 'Available' || l.parent_documents_status === 'Verified') docs.push('Parent Documents Verified');
  if (l.approval_documents_status === 'Available') docs.push(`${approvalStr || 'Approval'} Order Copy`);
  if (l.sale_deed_status === 'Available' || l.sale_deed_status === 'Clear Title') docs.push('Clear Sale Deed Title');

  if (docs.length > 0) {
    parts.push(`Documentation & Legal: ${docs.join(', ')} with 100% verified legal titles, ready for immediate registration.`);
  }

  return parts.filter(Boolean).join('\n\n');
};

const generateProjectDescription = (pr) => {
  const parts = [];
  const nameStr = (pr.name || pr.title || '').trim() || 'Residential Construction Project';
  const typeStr = pr.project_type || '';
  const locStr = (pr.location || pr.area || '').trim();
  const builtStr = pr.builtup_area ? `${pr.builtup_area} ${pr.builtup_area_unit || 'sq.ft'}` : '';
  const plotStr = pr.plot_area ? `${pr.plot_area} ${pr.plot_area_unit || 'sq.ft'}` : '';
  const floorsStr = pr.floors ? `${pr.floors} ${Number(pr.floors) === 1 ? 'floor' : 'floors'}` : '';
  const bhkStr = pr.bedrooms ? `${pr.bedrooms} BHK` : '';
  const bathsStr = pr.bathrooms ? `${pr.bathrooms} Bathrooms` : '';

  // Sentence 1: Project Title + Type + Location
  let intro = `Turnkey construction project: ${nameStr}`;
  if (typeStr && !nameStr.toLowerCase().includes(typeStr.toLowerCase())) {
    intro += ` (${typeStr})`;
  }
  if (locStr) {
    intro += ` situated in ${locStr}, Chennai`;
  }
  intro += '.';
  parts.push(intro);

  // Sentence 2: Specs (Builtup area, Plot area, Floors, BHK, Bathrooms)
  const specs = [];
  if (builtStr) specs.push(`${builtStr} built-up area`);
  if (plotStr) specs.push(`${plotStr} plot area`);
  if (floorsStr) specs.push(`${floorsStr}`);
  if (bhkStr) specs.push(`spacious ${bhkStr} layout`);
  if (bathsStr) specs.push(bathsStr);

  if (specs.length > 0) {
    parts.push(`Designed and executed with premium architectural engineering spanning ${specs.join(', ')}.`);
  }

  // Sentence 3: Scope of Construction & Work Checkboxes
  const works = [];
  if (pr.rcc_structure) works.push('High-grade RCC Framed Structure');
  if (pr.concrete_roof) works.push('Reinforced Concrete Roof Slab');
  if (pr.compound_wall) works.push('Architectural Compound Wall');
  if (pr.gate) works.push('Custom Steel Main Gate');
  if (pr.parking) works.push('Covered Car & Bike Parking');
  if (pr.water_connection) works.push('Water Line Connection');
  if (pr.electrical_work) works.push('Concealed Copper Wiring & Modular Switches');
  if (pr.plumbing) works.push('CPVC Plumbing & Branded Sanitaryware');
  if (pr.painting) works.push('Weatherproof Exterior & Putty Interior Finish');
  if (pr.interior_work) works.push('Interior Woodwork & Modular Kitchen');

  if (works.length > 0) {
    parts.push(`Scope of Construction & Quality Highlights: ${works.join(', ')}.`);
  }

  // Sentence 4: Special Features
  if (pr.special_features && pr.special_features.trim()) {
    parts.push(`Special Features: ${pr.special_features.trim()}.`);
  }

  // Sentence 5: Project Status & Completion
  if (pr.status === 'Completed') {
    const compStr = pr.completion_date || pr.actual_completion_date ? ` in ${pr.completion_date || pr.actual_completion_date}` : '';
    parts.push(`Status: Successfully completed and handed over${compStr} with 100% structural quality compliance.`);
  } else if (pr.status === 'Under Construction') {
    parts.push('Status: Construction currently in progress adhering to strict timelines and structural engineering standards.');
  } else if (pr.status === 'Planning & Approvals') {
    parts.push('Status: Planning and approvals stage with customized architectural blueprint design.');
  }

  return parts.filter(Boolean).join('\n\n');
};

const defaultPropertyState = {
  id: null,
  property_id: '',
  title: 'Individual House for Sale',
  type: 'Individual House',
  listing_type: 'For Sale',
  status: 'Available',
  address: '',
  area: 'Poonamallee',
  city: 'Chennai',
  pincode: '',
  maps_url: '',
  latitude: '',
  longitude: '',
  landmark: '',
  price: '',
  price_amount: '',
  price_unit: 'Lakhs',
  price_display_type: 'Exact Price',
  negotiable: 'Yes',
  price_per_sqft: '',
  plot_area: '',
  plot_area_unit: 'sq.ft',
  builtup_area: '',
  builtup_area_unit: 'sq.ft',
  floor_area: '',
  floors: '',
  bedrooms: '',
  bathrooms: '',
  balconies: '',
  kitchens: '',
  living_room: '',
  dining_area: '',
  pooja_room: '',
  construction_status: 'Completed',
  year_built: '',
  construction_type: 'RCC / Concrete',
  roof_type: 'RCC Flat Concrete Roof',
  parking_available: 'Yes',
  parking_type: 'Car + Bike',
  cars: '',
  bikes: '',
  compound_wall: false,
  gate: false,
  water_connection: false,
  eb_connection: false,
  sewer_connection: false,
  borewell: false,
  overhead_tank: false,
  ground_water: false,
  road_access: false,
  facing: 'East',
  road_width: '',
  road_width_unit: 'ft',
  road_type: 'Tar Road',
  corner_property: 'No',
  patta_status: 'Available',
  ec_status: 'Available',
  approved_plan_status: 'Available',
  building_approval_status: 'Available',
  property_tax_status: 'Available',
  sale_deed_status: 'Available',
  other_documents: '',
  short_description: '',
  full_description: '',
  description: '',
  highlights: '',
  published: true,
  featured: false,
  location: 'Poonamallee',
  image: '',
  images: [],
  isDescriptionCustomized: false
};

const defaultLandState = {
  id: null,
  land_id: '',
  title: 'DTCP Approved Residential Plot',
  land_type: 'Residential Plot',
  listing_type: 'For Sale',
  status: 'Available',
  address: '',
  area: 'Poonamallee',
  city: 'Chennai',
  pincode: '',
  maps_url: '',
  latitude: '',
  longitude: '',
  landmark: '',
  plot_area: '',
  plot_area_unit: 'sq.ft',
  frontage: '',
  length: '',
  width: '',
  total_price: '',
  price_amount: '',
  price_unit: 'Lakhs',
  price_per_sqft: '',
  negotiable: 'Yes',
  price_display_type: 'Exact Price',
  approval_status: 'DTCP Approved',
  facing: 'East',
  road_width: '',
  road_width_unit: 'ft',
  road_type: 'Tar Road',
  road_facing: 'North',
  corner_plot: 'No',
  eb_available: false,
  water_available: false,
  drainage_available: false,
  borewell_available: false,
  gated_community: false,
  street_lights: false,
  patta_status: 'Available',
  ec_status: 'Available',
  parent_documents_status: 'Available',
  sale_deed_status: 'Available',
  approval_documents_status: 'Available',
  other_documents: '',
  nearby_school: '',
  nearby_hospital: '',
  nearby_bus_stop: '',
  nearby_railway: '',
  nearby_main_road: '',
  nearby_shopping: '',
  short_description: '',
  full_description: '',
  description: '',
  highlights: '',
  published: true,
  featured: false,
  location: 'Poonamallee',
  image: '',
  images: [],
  isDescriptionCustomized: false
};

const defaultProjectState = {
  id: null,
  project_id: '',
  name: 'Individual Villa Construction',
  title: 'Individual Villa Construction',
  project_type: 'Individual House',
  status: 'Completed',
  address: '',
  area: 'Poonamallee',
  city: 'Chennai',
  pincode: '',
  maps_url: '',
  latitude: '',
  longitude: '',
  plot_area: '',
  plot_area_unit: 'sq.ft',
  builtup_area: '',
  builtup_area_unit: 'sq.ft',
  floors: '',
  bedrooms: '',
  bathrooms: '',
  start_date: '',
  expected_completion_date: '',
  actual_completion_date: '',
  completion_date: '',
  rcc_structure: false,
  concrete_roof: false,
  compound_wall: false,
  gate: false,
  parking: false,
  water_connection: false,
  electrical_work: false,
  plumbing: false,
  painting: false,
  interior_work: false,
  overview: '',
  description: '',
  construction_details: '',
  special_features: '',
  challenges: '',
  solutions: '',
  client_requirements: '',
  final_outcome: '',
  cover_image: '',
  image: '',
  published: true,
  featured: false,
  location: 'Poonamallee',
  images: [],
  isDescriptionCustomized: false
};

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;

    // If opened with explicit login flag (e.g. from footer button), always show login form
    const isExplicitLogin = window.location.search.includes('login') || window.location.hash.includes('login');
    if (isExplicitLogin) {
      try {
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_active_tab');
        localStorage.removeItem('admin_persistent_token');
      } catch (e) {}
      return false;
    }

    const isDirectLead = window.location.hash.includes('lead') || window.location.search.includes('lead');
    if (isDirectLead) {
      if (!sessionStorage.getItem('admin_token')) {
        sessionStorage.setItem('admin_token', 'lead_authorized_session');
      }
      return true;
    }

    // Tab-scoped authentication: auto-logout occurs naturally when the admin tab is closed
    return !!sessionStorage.getItem('admin_token');
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dynamic Auth Status & Register Form States
  const [hasAdmin, setHasAdmin] = useState(null); // null = checking, false = uninitialized (show register), true = registered (show login)
  const [isAuthChecking, setIsAuthChecking] = useState(() => {
    if (typeof window === 'undefined') return true;
    const isExplicitLogin = window.location.search.includes('login') || window.location.hash.includes('login');
    if (isExplicitLogin) return true;
    const isDirectLead = window.location.hash.includes('lead') || window.location.search.includes('lead');
    if (isDirectLead) return false;
    return !sessionStorage.getItem('admin_token');
  });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    email: '',
    facebook: '',
    instagram: '',
    whatsapp: ''
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOptionalSocials, setShowOptionalSocials] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Admin Credentials CRUD State
  const [adminInfo, setAdminInfo] = useState({ username: '', display_username: '' });
  const [adminUserForm, setAdminUserForm] = useState({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [credStatusMsg, setCredStatusMsg] = useState('');
  const [credErrorMsg, setCredErrorMsg] = useState('');
  const [settingStatusMsg, setSettingStatusMsg] = useState('');

  // Lead Push Notifications State (Mobile Notification Bar & Browser)
  const [notifEnabled, setNotifEnabled] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_lead_notifications_enabled') === 'true' : false;
  });
  const [notifPermission, setNotifPermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [notifStatusMsg, setNotifStatusMsg] = useState('');
  const [notifErrorMsg, setNotifErrorMsg] = useState('');
  const lastNotifiedLeadIdRef = useRef(null);

  // Security Section Data Reset State
  const [resetSelection, setResetSelection] = useState({
    all: false,
    properties: false,
    land: false,
    projects: false,
    gallery: false,
    feedbacks: false,
    leads: false
  });
  const [isResettingData, setIsResettingData] = useState(false);
  const [resetStatusMsg, setResetStatusMsg] = useState('');
  const [resetErrorMsg, setResetErrorMsg] = useState('');

  const isAnyDataSelectedForReset = resetSelection.properties || resetSelection.land || resetSelection.projects || resetSelection.gallery || resetSelection.feedbacks || resetSelection.leads;

  const VALID_TABS = ['dashboard', 'properties', 'land', 'projects', 'gallery', 'feedbacks', 'testimonials', 'leads', 'settings', 'videos'];

  // Persist active section tab across reloads in sessionStorage (Direct to leads on notification click)
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined' && (
      window.location.hash.includes('lead') ||
      window.location.search.includes('lead')
    )) {
      sessionStorage.setItem('admin_active_tab', 'leads');
      return 'leads';
    }
    const saved = sessionStorage.getItem('admin_active_tab');
    if (saved === 'houses') return 'properties';
    return VALID_TABS.includes(saved) ? saved : 'dashboard';
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    sessionStorage.setItem('admin_active_tab', tabId);
    if (tabId === 'feedbacks') {
      fetch('/api/feedback?all=true')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (Array.isArray(data)) setFeedbacks(data);
        })
        .catch(() => { });
    }
    if (tabId === 'settings') {
      fetch('/api/settings')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.settings) setSettings(data.settings);
          if (data?.admin?.username) {
            setAdminInfo(data.admin);
            setAdminUserForm(prev => ({
              ...prev,
              newUsername: prev.newUsername || data.admin.username
            }));
          }
        })
        .catch(() => { });
    }
  };

  // Modal Form Visibility States
  const [modalType, setModalType] = useState(null); // 'property_form', 'land_form', 'project_form', 'service_form', 'gallery_form', 'rename_video', 'confirm_delete'
  const [formStep, setFormStep] = useState(1);
  const [deleteConfig, setDeleteConfig] = useState({ title: '', onConfirm: () => { } });

  // Lock background scroll when any modal is active
  useEffect(() => {
    if (modalType) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBodyOverflow || '';
        document.documentElement.style.overflow = prevHtmlOverflow || '';
      };
    }
  }, [modalType]);

  // Filter & Search States
  const [propSearch, setPropSearch] = useState('');
  const [landSearch, setLandSearch] = useState('');
  const [projSearch, setProjSearch] = useState('');
  const [feedSearch, setFeedSearch] = useState('');

  // Database Data States
  const defaultSettingsState = {
    company_name: 'SK BUILDERS',
    company_subtitle: '& PROPERTY CONSULTANT',
    phone: '',
    whatsapp_number: '',
    email: 'info@skbuilders.com',
    location: 'Poonamallee, Chennai',
    service_areas: 'Poonamallee, Mangadu, Kundrathur',
    logo_url: '/logo/sk-builders-logo.png',
    site_title: 'SK Builders & Property Consultant',
    meta_description: 'Builder & Property Consultant in Poonamallee, Mangadu & Kundrathur. Houses for sale, residential land, contract construction, and property guidance.'
  };

  const [settings, setSettings] = useState(defaultSettingsState);
  const [settingsForm, setSettingsForm] = useState(defaultSettingsState);
  const [isSettingsFormDirty, setIsSettingsFormDirty] = useState(false);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState([]);
  const [formService, setFormService] = useState({
    id: null,
    title: '',
    subtitle: '',
    badge: '',
    description: '',
    overview: '',
    icon_name: 'Home',
    link_url: '#contact',
    display_order: 1,
    highlights: '',
    deliverables: [],
    process_steps: []
  });
  const [formStat, setFormStat] = useState({ id: null, icon_name: 'Home', value: '', label: '', display_order: 1 });
  const [properties, setProperties] = useState([]);
  const [land, setLand] = useState([]);
  const [projects, setProjects] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [leads, setLeads] = useState([]);
  const [videos, setVideos] = useState([]);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoUrlType, setVideoUrlType] = useState('background');
  const [statusNotice, setStatusNotice] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingGallery, setIsSavingGallery] = useState(false);
  const [isSavingTestimonial, setIsSavingTestimonial] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);
  const [isSavingStat, setIsSavingStat] = useState(false);
  const [isUploadingHeroVideo, setIsUploadingHeroVideo] = useState(false);
  const [isUploadingBgVideo, setIsUploadingBgVideo] = useState(false);
  const [isRegisteringUrl, setIsRegisteringUrl] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [serverExtraction, setServerExtraction] = useState({
    isExtracting: false,
    videoId: null,
    progress: 0,
    status: 'idle'
  });
  const [clientExtraction, setClientExtraction] = useState({
    isExtracting: false,
    videoId: null,
    progress: 0,
    current: 0,
    total: 121,
    status: 'idle'
  });

  // Live Frame Extraction Progress Polling (fetches live compiler progress from backend continuously)
  useEffect(() => {
    let isSubscribed = true;

    const pollProgress = async () => {
      try {
        const res = await fetch('/api/media/frame-progress');
        if (res.ok && isSubscribed) {
          const data = await res.json();
          if (data.isExtracting) {
            // Server Python extraction is running — show live progress (server side caps at 99 while running)
            setServerExtraction({
              isExtracting: true,
              videoId: data.videoId,
              progress: Math.max(0, Math.round(data.progress || 0)),
              status: data.status || 'extracting'
            });
          } else {
            setServerExtraction(prev => {
              if (prev.isExtracting) {
                // Was extracting, now done → jump to 100%
                return { isExtracting: false, videoId: null, progress: 100, status: 'completed' };
              }
              const isComp = data.hasFrames || data.status === 'completed' || (data.progress >= 100);
              return { isExtracting: false, videoId: null, progress: isComp ? 100 : 0, status: data.status || 'idle' };
            });
          }
        }
      } catch (e) {
        // Silent error
      }
    };

    pollProgress();
    const timer = setInterval(pollProgress, 800);

    return () => {
      isSubscribed = false;
      clearInterval(timer);
    };
  }, []);

  // Dynamically compute location selection options from Admin Settings -> Service Areas
  const serviceAreaOptions = getServiceAreaOptions(settingsForm.service_areas || settings?.service_areas, settingsForm.location || settings?.location);

  // Set Admin Tab Title & Sync Web App Icon
  useEffect(() => {
    document.title = `${settings?.company_name || 'Admin'} - Admin Portal`;
    if (settings?.logo_url) {
      updateDynamicWebAppIcon(settings.logo_url, settings.company_name, 'admin');
    }
  }, [settings?.company_name, settings?.logo_url]);

  const [formProp, setFormProp] = useState(defaultPropertyState);
  const [formTestimonial, setFormTestimonial] = useState({ id: null, client_name: '', location: '', quote: '', rating: 5 });
  const [testSearch, setTestSearch] = useState('');
  const [propertyImagesList, setPropertyImagesList] = useState([]);
  const [stagedDeletedPropertyImages, setStagedDeletedPropertyImages] = useState([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [uploadingBasicImage, setUploadingBasicImage] = useState(false);
  const [isSavingProperty, setIsSavingProperty] = useState(false);
  const [propertyFormError, setPropertyFormError] = useState('');
  const [isCustomPropertyTitle, setIsCustomPropertyTitle] = useState(false);
  const [draggedImgIdx, setDraggedImgIdx] = useState(null);
  const [dragOverImgIdx, setDragOverImgIdx] = useState(null);

  const updateFormProp = (updates) => {
    setFormProp(prev => {
      const next = { ...prev, ...updates };
      if (!next.isDescriptionCustomized) {
        next.description = generatePropertyDescription(next);
      }
      return next;
    });
  };

  const [propertyUploadProgress, setPropertyUploadProgress] = useState({ uploading: false, current: 0, total: 0, pct: 0 });

  const handleSelectMultipleImages = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const newItems = files.map((file, i) => ({
      id: `local-prop-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
      url: URL.createObjectURL(file),
      file,
      isNew: true
    }));

    const updatedList = [...propertyImagesList, ...newItems];
    setPropertyImagesList(updatedList);
    if (updatedList.length > 0) {
      updateFormProp({ image: updatedList[0].url });
    }
    e.target.value = '';
  };

  const handleImageDragStart = (e, index) => {
    setDraggedImgIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch (err) { }
  };

  const handleImageDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverImgIdx !== index) {
      setDragOverImgIdx(index);
    }
  };

  const handleImageDragLeave = (e, index) => {
    if (dragOverImgIdx === index) {
      setDragOverImgIdx(null);
    }
  };

  const handleImageDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedImgIdx === null || draggedImgIdx === targetIndex) {
      setDraggedImgIdx(null);
      setDragOverImgIdx(null);
      return;
    }

    const list = [...propertyImagesList];
    const [draggedItem] = list.splice(draggedImgIdx, 1);
    list.splice(targetIndex, 0, draggedItem);

    setPropertyImagesList(list);
    if (list.length > 0) {
      updateFormProp({ image: list[0].url });
    }
    setDraggedImgIdx(null);
    setDragOverImgIdx(null);
  };

  const handleImageDragEnd = () => {
    setDraggedImgIdx(null);
    setDragOverImgIdx(null);
  };

  const setPropertyCoverImage = (index) => {
    if (index === 0 || index >= propertyImagesList.length) return;
    const list = [...propertyImagesList];
    const item = list.splice(index, 1)[0];
    list.unshift(item);
    setPropertyImagesList(list);
    updateFormProp({ image: list[0].url });
  };

  const movePropertyImage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= propertyImagesList.length) return;
    const list = [...propertyImagesList];
    const [movedItem] = list.splice(index, 1);
    list.splice(targetIndex, 0, movedItem);
    setPropertyImagesList(list);
    if (list.length > 0) {
      updateFormProp({ image: list[0].url });
    }
  };

  const removePropertyImage = (index) => {
    const itemToRemove = propertyImagesList[index];
    const list = propertyImagesList.filter((_, i) => i !== index);
    setPropertyImagesList(list);
    const newCover = list.length > 0 ? list[0].url : '';
    updateFormProp({ image: newCover });

    // Stage image for deletion on Save Property ONLY (do NOT delete physically or from DB on "X" click)
    if (itemToRemove && itemToRemove.url && !itemToRemove.url.startsWith('data:')) {
      setStagedDeletedPropertyImages(prev => [...prev, itemToRemove]);
    }
  };

  const propertyTitleOptions = [
    'Individual House for Sale',
    'Independent Villa for Sale',
    'Duplex Villa',
    'Luxury Villa for Sale',
    'Modern Residential House',
    'Contemporary House for Sale',
    'Premium Independent House',
    'Residential Building',
    'Commercial Building',
    'Independent House'
  ];

  const openCreateProperty = () => {
    setFormStep(1);
    setFormProp({
      ...defaultPropertyState,
      location: serviceAreaOptions[0] || 'Poonamallee'
    });
    setPropertyImagesList([]);
    setStagedDeletedPropertyImages([]);
    setSelectedImageFiles([]);
    setPropertyFormError('');
    setIsCustomPropertyTitle(false);
    setModalType('property_form');
  };

  const openEditProperty = async (p) => {
    const isCustom = !propertyTitleOptions.includes(p.title);
    setIsCustomPropertyTitle(isCustom);
    setStagedDeletedPropertyImages([]);

    let cleanPlotArea = '';
    let cleanPlotUnit = p.plot_area_unit || 'sq.ft';
    if (p.plot_area) {
      const rawPlot = String(p.plot_area);
      if (rawPlot.toLowerCase().includes('sq.m')) cleanPlotUnit = 'sq.m';
      else if (rawPlot.toLowerCase().includes('cent')) cleanPlotUnit = 'Cent';
      else if (rawPlot.toLowerCase().includes('ground')) cleanPlotUnit = 'Ground';
      else if (rawPlot.toLowerCase().includes('acre')) cleanPlotUnit = 'Acre';
      else if (rawPlot.toLowerCase().includes('sq')) cleanPlotUnit = 'sq.ft';
      const match = rawPlot.replace(/sq\.ft|sqft|sq\.m|sqm/gi, '').match(/[\d]+(?:\.[\d]+)?/);
      cleanPlotArea = match ? match[0] : rawPlot.replace(/[^0-9.]/g, '');
    }

    let cleanBuiltupArea = '';
    let cleanBuiltupUnit = p.builtup_area_unit || 'sq.ft';
    if (p.builtup_area) {
      const rawBuilt = String(p.builtup_area);
      if (rawBuilt.toLowerCase().includes('sq.m')) cleanBuiltupUnit = 'sq.m';
      else if (rawBuilt.toLowerCase().includes('cent')) cleanBuiltupUnit = 'Cent';
      else if (rawBuilt.toLowerCase().includes('ground')) cleanBuiltupUnit = 'Ground';
      else if (rawBuilt.toLowerCase().includes('sq')) cleanBuiltupUnit = 'sq.ft';
      const match = rawBuilt.replace(/sq\.ft|sqft|sq\.m|sqm/gi, '').match(/[\d]+(?:\.[\d]+)?/);
      cleanBuiltupArea = match ? match[0] : rawBuilt.replace(/[^0-9.]/g, '');
    }

    let cleanBedrooms = '';
    if (p.bedrooms) {
      const match = String(p.bedrooms).match(/\d+/);
      cleanBedrooms = match ? match[0] : '';
    }

    let cleanRoadWidth = '';
    let cleanRoadUnit = p.road_width_unit || 'ft';
    if (p.road_width) {
      const rawRoad = String(p.road_width);
      if (rawRoad.toLowerCase().includes('inch')) cleanRoadUnit = 'inch';
      else if (rawRoad.toLowerCase().includes('meter')) cleanRoadUnit = 'meter';
      else if (rawRoad.toLowerCase().includes('ft')) cleanRoadUnit = 'ft';
      const match = rawRoad.match(/[\d]+(?:\.[\d]+)?/);
      cleanRoadWidth = match ? match[0] : '';
    }

    const priceMatch = (p.price || '').replace(/[^0-9.]/g, '');
    const priceUnit = (p.price || '').includes('Crore') ? 'Crores' : (p.price || '').includes('Thousand') ? 'Thousands' : 'Lakhs';

    setFormProp({
      ...defaultPropertyState,
      ...p,
      plot_area: cleanPlotArea,
      plot_area_unit: cleanPlotUnit,
      builtup_area: cleanBuiltupArea,
      builtup_area_unit: cleanBuiltupUnit,
      bedrooms: cleanBedrooms,
      road_width: cleanRoadWidth,
      road_width_unit: cleanRoadUnit,
      price_amount: priceMatch,
      price_unit: priceUnit,
      published: !!p.published,
      featured: !!p.featured,
      isDescriptionCustomized: !!(p.description || p.full_description)
    });
    setPropertyFormError('');
    setFormStep(1);
    setSelectedImageFiles([]);
    setModalType('property_form');

    const initialImgs = [];
    const seenUrls = new Set();
    const addImg = (id, url, isCover) => {
      if (url && typeof url === 'string' && url !== '/house/completed-house.jpg' && !url.includes('logo') && !seenUrls.has(url)) {
        seenUrls.add(url);
        initialImgs.push({ id, url, isCover: isCover || initialImgs.length === 0, isNew: false });
      }
    };
    if (p.image) addImg(`main-${p.id}`, p.image, true);
    if (Array.isArray(p.images)) {
      p.images.forEach(img => {
        const u = typeof img === 'string' ? img : (img?.image_url || img?.url);
        addImg(img?.id || u, u, !!img?.is_cover);
      });
    }
    setPropertyImagesList(initialImgs);

    try {
      const res = await fetch(`/api/properties/${p.id}`);
      const data = await res.json();
      if (data.property && Array.isArray(data.property.images) && data.property.images.length > 0) {
        const fetchImgs = [];
        const seenFetch = new Set();
        data.property.images.forEach((img, i) => {
          const u = typeof img === 'string' ? img : (img?.image_url || img?.url);
          if (u && typeof u === 'string' && u !== '/house/completed-house.jpg' && !u.includes('logo') && !seenFetch.has(u)) {
            seenFetch.add(u);
            fetchImgs.push({
              id: img.id || u,
              url: u,
              isCover: !!img.is_cover || i === 0,
              isNew: false
            });
          }
        });
        if (fetchImgs.length > 0) {
          setPropertyImagesList(fetchImgs);
        }
      }
    } catch (err) {
      console.error('Error fetching property images:', err);
    }
  };

  // Land Form State
  const [formLand, setFormLand] = useState(defaultLandState);
  const [landImagesList, setLandImagesList] = useState([]);
  const [stagedDeletedLandImages, setStagedDeletedLandImages] = useState([]);
  const [uploadingLandImage, setUploadingLandImage] = useState(false);
  const [isSavingLand, setIsSavingLand] = useState(false);
  const [landFormError, setLandFormError] = useState('');
  const [isCustomLandTitle, setIsCustomLandTitle] = useState(false);
  const [draggedLandImgIdx, setDraggedLandImgIdx] = useState(null);
  const [dragOverLandImgIdx, setDragOverLandImgIdx] = useState(null);

  const updateFormLand = (updates) => {
    setFormLand(prev => {
      const next = { ...prev, ...updates };
      if (!next.isDescriptionCustomized) {
        next.description = generateLandDescription(next);
      }
      return next;
    });
  };

  const [landUploadProgress, setLandUploadProgress] = useState({ uploading: false, current: 0, total: 0, pct: 0 });

  const handleSelectMultipleLandImages = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const newItems = files.map((file, i) => ({
      id: `local-land-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
      url: URL.createObjectURL(file),
      file,
      isNew: true
    }));

    const updatedList = [...landImagesList, ...newItems];
    setLandImagesList(updatedList);
    if (updatedList.length > 0) {
      updateFormLand({ image: updatedList[0].url });
    }
    e.target.value = '';
  };

  const handleLandImageDragStart = (e, index) => {
    setDraggedLandImgIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(index)); } catch (err) { }
  };

  const handleLandImageDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverLandImgIdx !== index) setDragOverLandImgIdx(index);
  };

  const handleLandImageDragLeave = (e, index) => {
    if (dragOverLandImgIdx === index) setDragOverLandImgIdx(null);
  };

  const handleLandImageDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedLandImgIdx === null || draggedLandImgIdx === targetIndex) {
      setDraggedLandImgIdx(null);
      setDragOverLandImgIdx(null);
      return;
    }
    const list = [...landImagesList];
    const [draggedItem] = list.splice(draggedLandImgIdx, 1);
    list.splice(targetIndex, 0, draggedItem);
    setLandImagesList(list);
    if (list.length > 0) updateFormLand({ image: list[0].url });
    setDraggedLandImgIdx(null);
    setDragOverLandImgIdx(null);
  };

  const handleLandImageDragEnd = () => {
    setDraggedLandImgIdx(null);
    setDragOverLandImgIdx(null);
  };

  const setLandCoverImage = (index) => {
    if (index === 0 || index >= landImagesList.length) return;
    const list = [...landImagesList];
    const item = list.splice(index, 1)[0];
    list.unshift(item);
    setLandImagesList(list);
    updateFormLand({ image: list[0].url });
  };

  const moveLandImage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= landImagesList.length) return;
    const list = [...landImagesList];
    const [movedItem] = list.splice(index, 1);
    list.splice(targetIndex, 0, movedItem);
    setLandImagesList(list);
    if (list.length > 0) {
      updateFormLand({ image: list[0].url });
    }
  };

  const removeLandImage = (index) => {
    const itemToRemove = landImagesList[index];
    const list = landImagesList.filter((_, i) => i !== index);
    setLandImagesList(list);
    const newCover = list.length > 0 ? list[0].url : '';
    updateFormLand({ image: newCover });
    if (itemToRemove && itemToRemove.url && !itemToRemove.url.startsWith('data:')) {
      setStagedDeletedLandImages(prev => [...prev, itemToRemove]);
    }
  };

  const openCreateLand = () => {
    setFormStep(1);
    const initialLand = {
      ...defaultLandState,
      location: serviceAreaOptions[0] || 'Poonamallee'
    };
    initialLand.description = generateLandDescription(initialLand);
    setFormLand(initialLand);
    setLandImagesList([]);
    setStagedDeletedLandImages([]);
    setLandFormError('');
    setIsCustomLandTitle(false);
    setModalType('land_form');
  };

  const openEditLand = async (l) => {
    const isCustom = !landTitleOptions.includes(l.title);
    setIsCustomLandTitle(isCustom);
    setStagedDeletedLandImages([]);

    let cleanPlotArea = '';
    let cleanPlotUnit = l.plot_area_unit || 'sq.ft';
    if (l.plot_area) {
      const rawPlot = String(l.plot_area);
      if (rawPlot.toLowerCase().includes('sq.m')) cleanPlotUnit = 'sq.m';
      else if (rawPlot.toLowerCase().includes('cent')) cleanPlotUnit = 'Cent';
      else if (rawPlot.toLowerCase().includes('ground')) cleanPlotUnit = 'Ground';
      else if (rawPlot.toLowerCase().includes('acre')) cleanPlotUnit = 'Acre';
      else if (rawPlot.toLowerCase().includes('sq')) cleanPlotUnit = 'sq.ft';
      const match = rawPlot.replace(/sq\.ft|sqft|sq\.m|sqm/gi, '').match(/[\d]+(?:\.[\d]+)?/);
      cleanPlotArea = match ? match[0] : rawPlot.replace(/[^0-9.]/g, '');
    }

    let cleanRoadWidth = '';
    let cleanRoadUnit = l.road_width_unit || 'ft';
    if (l.road_width) {
      const rawRoad = String(l.road_width);
      if (rawRoad.toLowerCase().includes('meter')) cleanRoadUnit = 'meter';
      else if (rawRoad.toLowerCase().includes('ft')) cleanRoadUnit = 'ft';
      const match = rawRoad.match(/[\d]+(?:\.[\d]+)?/);
      cleanRoadWidth = match ? match[0] : '';
    }

    let cleanLength = l.length ? String(l.length).replace(/[^0-9.]/g, '') : '';
    let cleanWidth = l.width ? String(l.width).replace(/[^0-9.]/g, '') : '';

    const priceMatch = (l.total_price || l.price || '').replace(/[^0-9.]/g, '');
    const priceUnit = (l.total_price || l.price || '').includes('Crore') ? 'Crores' : (l.total_price || l.price || '').includes('Thousand') ? 'Thousands' : 'Lakhs';

    setFormLand({
      ...defaultLandState,
      ...l,
      plot_area: cleanPlotArea,
      plot_area_unit: cleanPlotUnit,
      length: cleanLength,
      width: cleanWidth,
      road_width: cleanRoadWidth,
      road_width_unit: cleanRoadUnit,
      price_amount: priceMatch,
      price_unit: priceUnit,
      published: !!l.published,
      featured: !!l.featured,
      isDescriptionCustomized: !!(l.description || l.full_description)
    });
    setLandFormError('');
    setFormStep(1);
    setModalType('land_form');

    const initialImgs = [];
    const seenUrls = new Set();
    const addImg = (id, url, isCover) => {
      if (url && typeof url === 'string' && url !== '/house/completed-house.jpg' && !url.includes('logo') && !seenUrls.has(url)) {
        seenUrls.add(url);
        initialImgs.push({ id, url, isCover: isCover || initialImgs.length === 0, isNew: false });
      }
    };
    if (l.image) addImg(`main-land-${l.id}`, l.image, true);
    if (Array.isArray(l.images)) {
      l.images.forEach(img => {
        const u = typeof img === 'string' ? img : (img?.image_url || img?.url);
        addImg(img?.id || u, u, !!img?.is_cover);
      });
    }
    setLandImagesList(initialImgs);

    try {
      const res = await fetch(`/api/land/${l.id}`);
      const data = await res.json();
      if (data.land && Array.isArray(data.land.images) && data.land.images.length > 0) {
        const fetchImgs = [];
        const seenFetch = new Set();
        data.land.images.forEach((img, i) => {
          const u = typeof img === 'string' ? img : (img?.image_url || img?.url);
          if (u && typeof u === 'string' && u !== '/house/completed-house.jpg' && !u.includes('logo') && !seenFetch.has(u)) {
            seenFetch.add(u);
            fetchImgs.push({
              id: img.id || u,
              url: u,
              isCover: !!img.is_cover || i === 0,
              isNew: false
            });
          }
        });
        if (fetchImgs.length > 0) {
          setLandImagesList(fetchImgs);
        }
      }
    } catch (err) {
      console.error('Error fetching land images:', err);
    }
  };

  // Projects Form State
  const [formProj, setFormProj] = useState(defaultProjectState);
  const [projectImagesList, setProjectImagesList] = useState([]);
  const [stagedDeletedProjectImages, setStagedDeletedProjectImages] = useState([]);
  const [uploadingProjectImage, setUploadingProjectImage] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectFormError, setProjectFormError] = useState('');
  const [isCustomProjectTitle, setIsCustomProjectTitle] = useState(false);
  const [draggedProjImgIdx, setDraggedProjImgIdx] = useState(null);
  const [dragOverProjImgIdx, setDragOverProjImgIdx] = useState(null);

  const updateFormProj = (updates) => {
    setFormProj(prev => {
      const next = { ...prev, ...updates };
      if (!next.isDescriptionCustomized) {
        const desc = generateProjectDescription(next);
        next.description = desc;
        next.overview = desc;
      }
      return next;
    });
  };

  const [projectUploadProgress, setProjectUploadProgress] = useState({ uploading: false, current: 0, total: 0, pct: 0 });

  const handleSelectMultipleProjectImages = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const newItems = files.map((file, i) => ({
      id: `local-proj-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
      url: URL.createObjectURL(file),
      file,
      isNew: true
    }));

    const updatedList = [...projectImagesList, ...newItems];
    setProjectImagesList(updatedList);
    if (updatedList.length > 0) {
      updateFormProj({ cover_image: updatedList[0].url, image: updatedList[0].url });
    }
    e.target.value = '';
  };

  const handleProjImageDragStart = (e, index) => {
    setDraggedProjImgIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(index)); } catch (err) { }
  };

  const handleProjImageDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverProjImgIdx !== index) setDragOverProjImgIdx(index);
  };

  const handleProjImageDragLeave = (e, index) => {
    if (dragOverProjImgIdx === index) setDragOverProjImgIdx(null);
  };

  const handleProjImageDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedProjImgIdx === null || draggedProjImgIdx === targetIndex) {
      setDraggedProjImgIdx(null);
      setDragOverProjImgIdx(null);
      return;
    }
    const list = [...projectImagesList];
    const [draggedItem] = list.splice(draggedProjImgIdx, 1);
    list.splice(targetIndex, 0, draggedItem);
    setProjectImagesList(list);
    if (list.length > 0) updateFormProj({ cover_image: list[0].url, image: list[0].url });
    setDraggedProjImgIdx(null);
    setDragOverProjImgIdx(null);
  };

  const handleProjImageDragEnd = () => {
    setDraggedProjImgIdx(null);
    setDragOverProjImgIdx(null);
  };

  const setProjectCoverImage = (index) => {
    if (index === 0 || index >= projectImagesList.length) return;
    const list = [...projectImagesList];
    const item = list.splice(index, 1)[0];
    list.unshift(item);
    setProjectImagesList(list);
    updateFormProj({ cover_image: list[0].url, image: list[0].url });
  };

  const moveProjectImage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= projectImagesList.length) return;
    const list = [...projectImagesList];
    const [movedItem] = list.splice(index, 1);
    list.splice(targetIndex, 0, movedItem);
    setProjectImagesList(list);
    if (list.length > 0) {
      updateFormProj({ cover_image: list[0].url, image: list[0].url });
    }
  };

  const removeProjectImage = (index) => {
    const itemToRemove = projectImagesList[index];
    const list = projectImagesList.filter((_, i) => i !== index);
    setProjectImagesList(list);
    const newCover = list.length > 0 ? list[0].url : '';
    updateFormProj({ cover_image: newCover, image: newCover });
    if (itemToRemove && itemToRemove.url && !itemToRemove.url.startsWith('data:')) {
      setStagedDeletedProjectImages(prev => [...prev, itemToRemove]);
    }
  };

  const openCreateProject = () => {
    setFormStep(1);
    const initialProj = {
      ...defaultProjectState,
      location: serviceAreaOptions[0] || 'Poonamallee'
    };
    initialProj.description = generateProjectDescription(initialProj);
    initialProj.overview = initialProj.description;
    setFormProj(initialProj);
    setProjectImagesList([]);
    setStagedDeletedProjectImages([]);
    setProjectFormError('');
    setIsCustomProjectTitle(false);
    setModalType('project_form');
  };

  const openEditProject = async (pr) => {
    const currentName = pr.name || pr.title || 'Individual Villa Construction';
    const isCustom = !projectTitleOptions.includes(currentName);
    setIsCustomProjectTitle(isCustom);
    setStagedDeletedProjectImages([]);

    let cleanBuiltupArea = '';
    let cleanBuiltupUnit = pr.builtup_area_unit || 'sq.ft';
    if (pr.builtup_area) {
      const rawBuilt = String(pr.builtup_area);
      if (rawBuilt.toLowerCase().includes('sq.m')) cleanBuiltupUnit = 'sq.m';
      else if (rawBuilt.toLowerCase().includes('sq')) cleanBuiltupUnit = 'sq.ft';
      const match = rawBuilt.match(/[\d]+(?:\.[\d]+)?/);
      cleanBuiltupArea = match ? match[0] : rawBuilt.replace(/[^0-9.]/g, '');
    }

    let cleanPlotArea = '';
    let cleanPlotUnit = pr.plot_area_unit || 'sq.ft';
    if (pr.plot_area) {
      const rawPlot = String(pr.plot_area);
      if (rawPlot.toLowerCase().includes('sq.m')) cleanPlotUnit = 'sq.m';
      else if (rawPlot.toLowerCase().includes('sq')) cleanPlotUnit = 'sq.ft';
      const match = rawPlot.match(/[\d]+(?:\.[\d]+)?/);
      cleanPlotArea = match ? match[0] : rawPlot.replace(/[^0-9.]/g, '');
    }

    let cleanFloors = pr.floors ? String(pr.floors).replace(/[^0-9]/g, '') : '';
    let cleanBedrooms = pr.bedrooms ? String(pr.bedrooms).replace(/[^0-9]/g, '') : '';
    let cleanBathrooms = pr.bathrooms ? String(pr.bathrooms).replace(/[^0-9]/g, '') : '';

    setFormProj({
      ...defaultProjectState,
      ...pr,
      name: currentName,
      title: currentName,
      builtup_area: cleanBuiltupArea,
      builtup_area_unit: cleanBuiltupUnit,
      plot_area: cleanPlotArea,
      plot_area_unit: cleanPlotUnit,
      floors: cleanFloors,
      bedrooms: cleanBedrooms,
      bathrooms: cleanBathrooms,
      published: !!pr.published,
      featured: !!pr.featured,
      isDescriptionCustomized: !!(pr.description || pr.overview)
    });
    setProjectFormError('');
    setFormStep(1);
    setModalType('project_form');

    const initialImgs = [];
    const seenUrls = new Set();
    const addImg = (id, url, isCover) => {
      if (url && typeof url === 'string' && url !== '/house/completed-house.jpg' && !url.includes('logo') && !seenUrls.has(url)) {
        seenUrls.add(url);
        initialImgs.push({ id, url, isCover: isCover || initialImgs.length === 0, isNew: false });
      }
    };
    const cover = pr.cover_image || pr.image;
    if (cover) addImg(`main-proj-${pr.id}`, cover, true);
    if (Array.isArray(pr.images)) {
      pr.images.forEach(img => {
        const u = typeof img === 'string' ? img : (img?.image_url || img?.url);
        addImg(img?.id || u, u, false);
      });
    }
    setProjectImagesList(initialImgs);

    try {
      const res = await fetch(`/api/projects/${pr.id}`);
      const data = await res.json();
      if (data.project && Array.isArray(data.project.images) && data.project.images.length > 0) {
        const fetchImgs = [];
        const seenFetch = new Set();
        data.project.images.forEach((img, i) => {
          const u = typeof img === 'string' ? img : (img?.image_url || img?.url);
          if (u && typeof u === 'string' && u !== '/house/completed-house.jpg' && !u.includes('logo') && !seenFetch.has(u)) {
            seenFetch.add(u);
            fetchImgs.push({
              id: img.id || u,
              url: u,
              isCover: i === 0,
              isNew: false
            });
          }
        });
        if (fetchImgs.length > 0) {
          setProjectImagesList(fetchImgs);
        }
      }
    } catch (err) {
      console.error('Error fetching project images:', err);
    }
  };

  const [formSrv, setFormSrv] = useState({ id: null, title: '', description: '', icon_name: 'Home', link_url: '#contact', display_order: 1 });
  const [formGal, setFormGal] = useState({ id: null, image: '' });
  const [galleryFilesList, setGalleryFilesList] = useState([]);
  const [activeUploadTask, setActiveUploadTask] = useState(null);
  const [videoRename, setVideoRename] = useState({ id: null, currentName: '', newName: '' });

  // Map Pin Picker Modal State
  const [showInteractiveMap, setShowInteractiveMap] = useState(true);
  const [mapPinModal, setMapPinModal] = useState({
    isOpen: false,
    section: null,
    tempUrl: '',
    latitude: '',
    longitude: '',
    address: '',
    location: '',
    isDetecting: false,
    detectMsg: ''
  });

  // Gallery Drag & Drop Reorder State
  const [draggedGalIdx, setDraggedGalIdx] = useState(null);
  const [dragOverGalIdx, setDragOverGalIdx] = useState(null);

  // Map Pinning Modal Handlers
  const openMapPinModal = (section) => {
    setShowInteractiveMap(true);
    let initialUrl = '';
    let initialAddress = '';
    let initialLoc = '';
    let initialLat = '';
    let initialLng = '';

    if (section === 'projects') {
      initialUrl = formProj.maps_url || '';
      initialAddress = formProj.address || '';
      initialLoc = formProj.location || 'Poonamallee';
      initialLat = formProj.latitude || '';
      initialLng = formProj.longitude || '';
    } else if (section === 'properties') {
      initialUrl = formProp.maps_url || '';
      initialAddress = formProp.address || '';
      initialLoc = formProp.location || 'Poonamallee';
      initialLat = formProp.latitude || '';
      initialLng = formProp.longitude || '';
    } else if (section === 'land') {
      initialUrl = formLand.maps_url || '';
      initialAddress = formLand.address || '';
      initialLoc = formLand.location || 'Poonamallee';
      initialLat = formLand.latitude || '';
      initialLng = formLand.longitude || '';
    }

    if (initialUrl) {
      const coords = parseCoordinates(initialUrl);
      if (coords) {
        if (!initialLat) initialLat = String(coords.latitude);
        if (!initialLng) initialLng = String(coords.longitude);
      }
    }

    setMapPinModal({
      isOpen: true,
      section,
      tempUrl: initialUrl,
      latitude: initialLat,
      longitude: initialLng,
      address: initialAddress,
      location: initialLoc,
      isDetecting: false,
      detectMsg: ''
    });

    if (initialUrl && (initialUrl.includes('goo.gl') || initialUrl.includes('maps.app.goo.gl'))) {
      resolveShortGoogleMapsUrl(initialUrl).then(res => {
        if (res && res.latitude && res.longitude) {
          setMapPinModal(prev => ({
            ...prev,
            latitude: String(res.latitude),
            longitude: String(res.longitude),
            detectMsg: `Resolved location: ${res.latitude}, ${res.longitude}`
          }));
        }
      });
    }
  };

  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      setMapPinModal(prev => ({ ...prev, detectMsg: 'Geolocation is not supported by your browser.' }));
      return;
    }
    setMapPinModal(prev => ({ ...prev, isDetecting: true, detectMsg: 'Detecting GPS coordinates...' }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const url = `https://maps.google.com/?q=${lat},${lng}`;
        setMapPinModal(prev => ({
          ...prev,
          isDetecting: false,
          latitude: lat,
          longitude: lng,
          tempUrl: url,
          detectMsg: `GPS Pinned: ${lat}, ${lng}`
        }));
      },
      (err) => {
        setMapPinModal(prev => ({
          ...prev,
          isDetecting: false,
          detectMsg: 'GPS detection: ' + (err.message || 'Permission denied')
        }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleApplyPinnedLocation = () => {
    const { section, tempUrl, latitude, longitude } = mapPinModal;
    const trimmedUrl = (tempUrl || '').trim();

    if (!trimmedUrl) {
      if (section === 'projects') {
        updateFormProj({ maps_url: '', latitude: '', longitude: '' });
      } else if (section === 'properties') {
        updateFormProp({ maps_url: '', latitude: '', longitude: '' });
      } else if (section === 'land') {
        updateFormLand({ maps_url: '', latitude: '', longitude: '' });
      }
      setMapPinModal(prev => ({ ...prev, isOpen: false }));
      return;
    }

    const coords = parseCoordinates(trimmedUrl);
    const finalLat = (coords && coords.latitude) ? String(coords.latitude) : latitude;
    const finalLng = (coords && coords.longitude) ? String(coords.longitude) : longitude;

    if (section === 'projects') {
      updateFormProj({ maps_url: trimmedUrl, latitude: finalLat, longitude: finalLng });
    } else if (section === 'properties') {
      updateFormProp({ maps_url: trimmedUrl, latitude: finalLat, longitude: finalLng });
    } else if (section === 'land') {
      updateFormLand({ maps_url: trimmedUrl, latitude: finalLat, longitude: finalLng });
    }

    setMapPinModal(prev => ({ ...prev, isOpen: false }));
  };

  // Gallery Reorder Drag Handlers
  const handleGalDragStart = (e, index) => {
    setDraggedGalIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleGalDragOver = (e, index) => {
    e.preventDefault();
    if (draggedGalIdx === null || draggedGalIdx === index) return;
    setDragOverGalIdx(index);
  };
  const handleGalDragLeave = (e, index) => {
    if (dragOverGalIdx === index) setDragOverGalIdx(null);
  };
  const handleGalDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedGalIdx === null || draggedGalIdx === targetIndex) {
      setDraggedGalIdx(null);
      setDragOverGalIdx(null);
      return;
    }
    const list = [...galleryFilesList];
    const [draggedItem] = list.splice(draggedGalIdx, 1);
    list.splice(targetIndex, 0, draggedItem);
    setGalleryFilesList(list);
    setDraggedGalIdx(null);
    setDragOverGalIdx(null);
  };
  const handleGalDragEnd = () => {
    setDraggedGalIdx(null);
    setDragOverGalIdx(null);
  };

  // Services & Stats Drag & Drop Reorder State & Handlers
  const [draggedSrvIdx, setDraggedSrvIdx] = useState(null);
  const [dragOverSrvIdx, setDragOverSrvIdx] = useState(null);
  const [draggedStatIdx, setDraggedStatIdx] = useState(null);
  const [dragOverStatIdx, setDragOverStatIdx] = useState(null);

  const handleSrvDragStart = (e, index) => {
    setDraggedSrvIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(index)); } catch (err) { }
  };

  const handleSrvDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSrvIdx !== index) setDragOverSrvIdx(index);
  };

  const handleSrvDragLeave = (e, index) => {
    if (dragOverSrvIdx === index) setDragOverSrvIdx(null);
  };

  const handleSrvDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (draggedSrvIdx === null || draggedSrvIdx === targetIndex) {
      setDraggedSrvIdx(null);
      setDragOverSrvIdx(null);
      return;
    }
    const list = [...services];
    const [draggedItem] = list.splice(draggedSrvIdx, 1);
    list.splice(targetIndex, 0, draggedItem);

    const reorderedList = list.map((item, idx) => ({ ...item, display_order: idx + 1 }));
    setServices(reorderedList);
    setDraggedSrvIdx(null);
    setDragOverSrvIdx(null);

    try {
      await fetch('/api/services/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reorderedList.map(s => ({ id: s.id, display_order: s.display_order })))
      });
      notifySiteDataUpdated();
    } catch (err) {
      console.error('Error reordering services:', err);
    }
  };

  const handleStatDragStart = (e, index) => {
    setDraggedStatIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(index)); } catch (err) { }
  };

  const handleStatDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatIdx !== index) setDragOverStatIdx(index);
  };

  const handleStatDragLeave = (e, index) => {
    if (dragOverStatIdx === index) setDragOverStatIdx(null);
  };

  const handleStatDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (draggedStatIdx === null || draggedStatIdx === targetIndex) {
      setDraggedStatIdx(null);
      setDragOverStatIdx(null);
      return;
    }
    const list = [...stats];
    const [draggedItem] = list.splice(draggedStatIdx, 1);
    list.splice(targetIndex, 0, draggedItem);

    const reorderedList = list.map((item, idx) => ({ ...item, display_order: idx + 1 }));
    setStats(reorderedList);
    setDraggedStatIdx(null);
    setDragOverStatIdx(null);

    try {
      await fetch('/api/stats/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reorderedList.map(s => ({ id: s.id, display_order: s.display_order })))
      });
      notifySiteDataUpdated();
    } catch (err) {
      console.error('Error reordering stats:', err);
    }
  };

  // Hero & Background Video Upload State & Refs
  const [selectedHeroVideoFile, setSelectedHeroVideoFile] = useState(null);
  const [customHeroVideoName, setCustomHeroVideoName] = useState('');
  const [heroDupError, setHeroDupError] = useState(false);
  const heroFileInputRef = useRef(null);
  const heroRenameInputRef = useRef(null);

  const [selectedBgVideoFile, setSelectedBgVideoFile] = useState(null);
  const [customBgVideoName, setCustomBgVideoName] = useState('');
  const [bgDupError, setBgDupError] = useState(false);
  const bgFileInputRef = useRef(null);
  const bgRenameInputRef = useRef(null);
  const [videoSectionTab, setVideoSectionTab] = useState('hero'); // 'hero' | 'background'

  const checkAuthStatus = async () => {
    setIsAuthChecking(true);
    try {
      const res = await fetch('/api/settings/auth-status');
      if (res.ok) {
        const data = await res.json();
        setHasAdmin(!!data.hasAdmin);
        if (data.username) {
          setAdminInfo(prev => ({ ...prev, username: data.username, display_username: data.username }));
          setAdminUserForm(prev => ({ ...prev, newUsername: data.username }));
        }
      } else {
        setHasAdmin(true);
      }
    } catch (e) {
      setHasAdmin(true);
    } finally {
      setIsAuthChecking(false);
    }
  };

  // Load session token, check auth status, or direct lead access from notification
  useEffect(() => {
    // Purge any persistent tokens from localStorage so closing the tab always logs out
    try {
      localStorage.removeItem('admin_persistent_token');
    } catch (e) {}

    const isExplicitLogin = typeof window !== 'undefined' && (
      window.location.search.includes('login') ||
      window.location.hash.includes('login')
    );

    if (isExplicitLogin) {
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_active_tab');
      setIsAuthenticated(false);
      setIsAuthChecking(true);
      checkAuthStatus();
      fetch('/api/settings')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.settings) setSettings(data.settings);
          if (data?.admin?.username) {
            setAdminInfo(data.admin);
            setAdminUserForm(prev => ({ ...prev, newUsername: data.admin.username }));
          }
        })
        .catch(() => { });
      return;
    }

    const isDirectLead = typeof window !== 'undefined' && (
      window.location.hash.includes('lead') ||
      window.location.search.includes('lead')
    );

    if (isDirectLead) {
      if (!sessionStorage.getItem('admin_token')) {
        sessionStorage.setItem('admin_token', 'lead_authorized_session');
      }
      setIsAuthenticated(true);
      setIsAuthChecking(false);
      setActiveTab('leads');
      sessionStorage.setItem('admin_active_tab', 'leads');
      fetchData();
      return;
    }

    const token = sessionStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
      setIsAuthChecking(false);
      fetchData();
    } else {
      checkAuthStatus();
      fetch('/api/settings')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.settings) setSettings(data.settings);
          if (data?.admin?.username) {
            setAdminInfo(data.admin);
            setAdminUserForm(prev => ({ ...prev, newUsername: data.admin.username }));
          }
        })
        .catch(() => { });
    }
  }, []);

  // Listen for direct lead notification clicks from Service Worker / Mobile Notification Bar
  useEffect(() => {
    const handleDirectLeadNavigation = () => {
      if (typeof window === 'undefined') return;
      if (window.location.hash.includes('lead') || window.location.search.includes('lead')) {
        if (!sessionStorage.getItem('admin_token')) {
          sessionStorage.setItem('admin_token', 'lead_authorized_session');
        }
        setIsAuthenticated(true);
        setIsAuthChecking(false);
        setActiveTab('leads');
        sessionStorage.setItem('admin_active_tab', 'leads');
        fetchData();
      }
    };

    const handleServiceWorkerMessage = (event) => {
      if (event.data && (event.data.type === 'OPEN_TAB' || event.data.type === 'OPEN_LEADS_TAB') && event.data.tab === 'leads') {
        if (!sessionStorage.getItem('admin_token')) {
          sessionStorage.setItem('admin_token', 'lead_authorized_session');
        }
        setIsAuthenticated(true);
        setIsAuthChecking(false);
        setActiveTab('leads');
        sessionStorage.setItem('admin_active_tab', 'leads');
        fetchData();
      }
    };

    window.addEventListener('hashchange', handleDirectLeadNavigation);
    window.addEventListener('popstate', handleDirectLeadNavigation);
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      window.removeEventListener('hashchange', handleDirectLeadNavigation);
      window.removeEventListener('popstate', handleDirectLeadNavigation);
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  const fetchData = async () => {
    setIsFetchingData(true);
    try {
      const [sRes, srvRes, statRes, propRes, landRes, projRes, galRes, feedRes, testRes, leadRes, vidRes] = await Promise.all([
        fetch('/api/settings').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/services').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/stats').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/properties').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/land').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/projects').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/gallery').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/feedback?all=true').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/testimonials').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/leads').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/media/videos').then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      if (sRes?.settings) {
        setSettings(sRes.settings);
        setSettingsForm(prev => {
          if (!isSettingsFormDirty) {
            const rawAreas = sRes.settings.service_areas || '';
            const commaAreas = rawAreas ? rawAreas.replace(/\s*•\s*/g, ', ') : 'Poonamallee, Mangadu, Kundrathur';
            return {
              ...defaultSettingsState,
              ...sRes.settings,
              service_areas: commaAreas
            };
          }
          return prev;
        });
      }

      if (sRes?.admin?.username) {
        setAdminInfo(sRes.admin);
        // ONLY prefill username inputs from DB inside Admin Settings; passwords remain completely blank
        setAdminUserForm(prev => ({
          ...prev,
          newUsername: sRes.admin.username,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
      const defaultStatsFallback = [
        { id: 1, icon_name: 'Home', value: '0', label: 'Homes Built', display_order: 1 },
        { id: 2, icon_name: 'MapPin', value: '0', label: 'Plots Sold', display_order: 2 },
        { id: 3, icon_name: 'Users', value: '0', label: 'Property Deals', display_order: 3 },
        { id: 4, icon_name: 'Users', value: '0', label: 'Happy Families', display_order: 4 }
      ];
      const defaultTestimonialsFallback = [
        { id: 1, client_name: 'Ramesh & Family', location: 'Poonamallee', quote: 'Professional approach, quality construction and on-time delivery. We are very happy with our new home in Poonamallee.', rating: 5 },
        { id: 2, client_name: 'Karthik Raja', location: 'Mangadu', quote: 'Transparent dealings and smooth legal registration assistance for our plot in Mangadu. Highly recommended!', rating: 5 },
        { id: 3, client_name: 'Suresh Kumar', location: 'Kundrathur', quote: 'Built our dream villa with top notch engineering standards and milestone updates. The engineering team made the process effortless.', rating: 5 }
      ];
      setServices(Array.isArray(srvRes) ? srvRes : []);
      setStats(Array.isArray(statRes) && statRes.length > 0 ? statRes : defaultStatsFallback);
      setProperties(Array.isArray(propRes?.properties) ? propRes.properties : (Array.isArray(propRes) ? propRes : []));
      setLand(Array.isArray(landRes?.land) ? landRes.land : (Array.isArray(landRes) ? landRes : []));
      setProjects(Array.isArray(projRes?.projects) ? projRes.projects : (Array.isArray(projRes) ? projRes : []));
      setGallery(Array.isArray(galRes) ? galRes : []);
      setFeedbacks(Array.isArray(feedRes) ? feedRes : (Array.isArray(feedRes?.feedbacks) ? feedRes.feedbacks : (Array.isArray(feedRes?.feedback) ? feedRes.feedback : [])));
      let mergedTestimonials = Array.isArray(testRes) && testRes.length > 0 ? [...testRes] : [];
      defaultTestimonialsFallback.forEach((defT) => {
        const exists = mergedTestimonials.some(
          (r) => r.client_name && r.client_name.toLowerCase().trim() === defT.client_name.toLowerCase().trim()
        );
        if (!exists) {
          mergedTestimonials.push(defT);
        }
      });
      setTestimonials(mergedTestimonials);
      setLeads(Array.isArray(leadRes) ? leadRes : []);
      setVideos(Array.isArray(vidRes) ? vidRes : []);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setIsInitialLoading(false);
      setIsFetchingData(false);
    }
  };

  const lastAdminVersionRef = useRef(0);

  // Cross-tab, cross-window, and remote multi-device auto-reload listener for Admin
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleSync = () => {
      // Background reload data if no modal form is actively open
      if (!modalType) {
        fetchData();
      }
    };

    // 1. BroadcastChannel message (instant 0ms cross-tab sync)
    const handleBroadcast = (event) => {
      if (event?.data?.type === 'DATA_UPDATED') {
        handleSync();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', handleBroadcast);
    }

    // 2. Storage event
    const handleStorage = (e) => {
      if (['sk_site_data_updated', 'data_updated'].includes(e.key)) {
        handleSync();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Remote version polling (every 3000ms)
    const adminVersionTimer = setInterval(async () => {
      try {
        const res = await fetch('/api/sync/version');
        if (res.ok) {
          const { version } = await res.json();
          if (version && lastAdminVersionRef.current > 0 && version > lastAdminVersionRef.current) {
            handleSync();
          }
          if (version) {
            lastAdminVersionRef.current = version;
          }
        }
      } catch (e) {}
    }, 3000);

    return () => {
      if (syncChannel) {
        syncChannel.removeEventListener('message', handleBroadcast);
      }
      window.removeEventListener('storage', handleStorage);
      clearInterval(adminVersionTimer);
    };
  }, [isAuthenticated, modalType]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/settings/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('admin_token', data.token);
        localStorage.removeItem('admin_persistent_token');
        sessionStorage.setItem('admin_active_tab', 'dashboard');
        setActiveTab('dashboard');
        setIsAuthenticated(true);
        setLoginError('');
        fetchData();
      } else {
        setLoginError(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      setLoginError('Unable to connect to backend server.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');

    if (!registerForm.username || !registerForm.username.trim()) {
      setRegisterError('Admin username is required.');
      return;
    }

    if (!registerForm.phone || !registerForm.phone.trim()) {
      setRegisterError('Mobile number is required.');
      return;
    }

    if (!registerForm.password || registerForm.password.length < 4) {
      setRegisterError('Password must be at least 4 characters long.');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError('Passwords do not match.');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch('/api/settings/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerForm.username.trim(),
          password: registerForm.password,
          phone: registerForm.phone,
          email: registerForm.email,
          facebook: registerForm.facebook,
          instagram: registerForm.instagram,
          whatsapp: registerForm.whatsapp
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('admin_token', data.token);
        localStorage.removeItem('admin_persistent_token');
        sessionStorage.setItem('admin_active_tab', 'dashboard');
        setActiveTab('dashboard');
        setIsAuthenticated(true);
        setHasAdmin(true);
        setRegisterError('');
        fetchData();
      } else {
        setRegisterError(data.error || 'Registration failed.');
      }
    } catch (err) {
      setRegisterError('Unable to connect to backend server.');
    } finally {
      setIsRegistering(false);
    }
  };


  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    setCredStatusMsg('');
    setCredErrorMsg('');

    const newU = (adminUserForm.newUsername || '').trim();
    const newP = (adminUserForm.newPassword || '').trim();
    const confirmP = (adminUserForm.confirmPassword || '').trim();
    const currentP = (adminUserForm.currentPassword || '').trim();

    if (!currentP) {
      setCredErrorMsg('Current password is required to confirm changes.');
      return;
    }

    if (!newU && !newP) {
      setCredErrorMsg('Please provide a new username, a new password, or both to update.');
      return;
    }

    if (newP) {
      if (newP !== confirmP) {
        setCredErrorMsg('New passwords do not match!');
        return;
      }
      if (newP.length < 4) {
        setCredErrorMsg('New password must be at least 4 characters long.');
        return;
      }
    }

    try {
      const res = await fetch('/api/settings/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentP,
          newUsername: newU,
          newPassword: newP
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCredStatusMsg(data.message || 'Admin credentials updated successfully!');
        setAdminUserForm({ currentPassword: '', newUsername: newU || adminUserForm.newUsername, newPassword: '', confirmPassword: '' });
        setAdminInfo(prev => ({ ...prev, username: newU || prev.username, display_username: newU || prev.display_username }));
        fetchData();
        setTimeout(() => setCredStatusMsg(''), 4000);
      } else {
        setCredErrorMsg(data.error || 'Failed to update credentials.');
      }
    } catch (err) {
      setCredErrorMsg('Server error updating credentials.');
    }
  };

  const handleToggleResetAll = (checked) => {
    setResetSelection({
      all: checked,
      properties: checked,
      land: checked,
      projects: checked,
      gallery: checked,
      feedbacks: checked,
      leads: checked
    });
  };

  const handleToggleResetItem = (key, checked) => {
    setResetSelection(prev => {
      const next = { ...prev, [key]: checked };
      const allChecked = next.properties && next.land && next.projects && next.gallery && next.feedbacks && next.leads;
      return { ...next, all: allChecked };
    });
  };

  const handleExecuteReset = () => {
    const selectedKeys = ['properties', 'land', 'projects', 'gallery', 'feedbacks', 'leads'].filter(k => resetSelection[k]);
    if (selectedKeys.length === 0) {
      setResetErrorMsg('Please select at least one category to reset.');
      setTimeout(() => setResetErrorMsg(''), 4000);
      return;
    }
    setModalType('confirm_reset');
  };

  const performActualReset = async () => {
    setIsResettingData(true);
    setResetStatusMsg('');
    setResetErrorMsg('');

    try {
      const res = await fetch('/api/settings/reset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: resetSelection.properties,
          land: resetSelection.land,
          projects: resetSelection.projects,
          gallery: resetSelection.gallery,
          feedbacks: resetSelection.feedbacks,
          leads: resetSelection.leads
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResetStatusMsg(data.message || 'Selected data and physical image files purged successfully!');
        setResetSelection({
          all: false,
          properties: false,
          land: false,
          projects: false,
          gallery: false,
          feedbacks: false,
          leads: false
        });
        await fetchData();
        notifySiteDataUpdated();
        setTimeout(() => setResetStatusMsg(''), 8000);
      } else {
        setResetErrorMsg(data.error || 'Failed to execute data reset.');
      }
    } catch (err) {
      setResetErrorMsg('Network error connecting to reset service.');
    } finally {
      setIsResettingData(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingStatusMsg('');
    setIsSavingSettings(true);

    try {
      const company = settingsForm.company_name ?? settings.company_name ?? 'SK BUILDERS';
      const subtitle = settingsForm.company_subtitle ?? settings.company_subtitle ?? '& PROPERTY CONSULTANT';
      const defaultTitle = `${company} ${subtitle}`.trim();
      const payload = {
        ...settingsForm,
        company_name: company,
        company_subtitle: subtitle,
        site_title: defaultTitle,
        meta_description: settingsForm.meta_description ?? settings.meta_description ?? ''
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsSettingsFormDirty(false);
        setSettings(payload);
        setSettingStatusMsg('Website settings saved successfully!');
        fetchData();
        notifySiteDataUpdated();
        updateDynamicWebAppIcon(payload.logo_url || settings.logo_url, payload.company_name, 'admin');
        setTimeout(() => setSettingStatusMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const logoInputRef = useRef(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const handleUploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoUploading(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await fetch('/api/settings/upload-logo', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(prev => ({ ...prev, logo_url: data.logo_url }));
        setSettingsForm(prev => ({ ...prev, logo_url: data.logo_url }));
        setSettingStatusMsg('New logo uploaded successfully!');
        fetchData();
        notifySiteDataUpdated();
        updateDynamicWebAppIcon(data.logo_url, settings.company_name, 'admin');
        setTimeout(() => setSettingStatusMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleResetLogo = async () => {
    try {
      const res = await fetch('/api/settings/reset-logo', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSettings(prev => ({ ...prev, logo_url: data.logo_url }));
        setSettingsForm(prev => ({ ...prev, logo_url: data.logo_url }));
        setSettingStatusMsg('Logo reset to default!');
        fetchData();
        notifySiteDataUpdated();
        updateDynamicWebAppIcon(data.logo_url, settings.company_name, 'admin');
        setTimeout(() => setSettingStatusMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error resetting logo:', err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_active_tab');
    localStorage.removeItem('admin_persistent_token');
    sessionStorage.clear();
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setAdminUserForm({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' });
    if (typeof window !== 'undefined' && window.location.hash) {
      try {
        window.history.replaceState(null, '', window.location.pathname);
      } catch (e) {}
    }
    checkAuthStatus(true);
  };

  const handleCloseAdminTab = () => {
    // Clear session so reopening requires login
    try {
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_active_tab');
      localStorage.removeItem('admin_persistent_token');
    } catch (e) {}

    // Attempt standard and fallback window close methods without redirect
    try {
      window.close();
    } catch (e) {}

    try {
      window.open('', '_self', '');
      window.close();
    } catch (e) {}

    try {
      window.open(window.location.href, '_self');
      window.close();
    } catch (e) {}

    try {
      self.close();
    } catch (e) {}

    try {
      if (window.top && window.top !== window) {
        window.top.close();
      }
    } catch (e) {}
  };

  // Play a soft notification audio chime using HTML5 Web Audio API
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  };

  // Trigger system notification on mobile notification bar / desktop notification drawer
  const triggerLeadNotification = (lead) => {
    if (!lead || !lead.id) return;
    playNotificationChime();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    const title = `🔔 New Lead: ${lead.name || 'Client Enquiry'}`;
    const body = `📞 ${lead.phone || ''} • ${lead.service || 'Property Enquiry'}${lead.message ? `\n"${lead.message}"` : ''}`;
    const options = {
      body,
      icon: settings.logo_url || '/logo/sk-builders-logo.png',
      badge: settings.logo_url || '/logo/sk-builders-logo.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: `lead-${lead.id}`,
      renotify: true,
      requireInteraction: true,
      data: { url: '/admin#leads', leadId: lead.id }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, options);
      }).catch(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, options);
        }
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  };

  // Toggle Lead Notifications ON / OFF
  const handleToggleNotifications = async () => {
    if (notifEnabled) {
      setNotifEnabled(false);
      localStorage.setItem('admin_lead_notifications_enabled', 'false');
      setNotifStatusMsg('Lead notifications turned OFF for this device.');
      setTimeout(() => setNotifStatusMsg(''), 3500);
      return;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifErrorMsg('This browser does not support Web Notifications.');
      setTimeout(() => setNotifErrorMsg(''), 4000);
      return;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setNotifErrorMsg('Notifications require HTTPS. Please open the admin portal');
      setTimeout(() => setNotifErrorMsg(''), 7000);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') {
        setNotifEnabled(true);
        localStorage.setItem('admin_lead_notifications_enabled', 'true');
        setNotifStatusMsg('Lead notifications turned ON! You will receive alerts on your mobile notification bar.');
        setTimeout(() => setNotifStatusMsg(''), 4500);

        // Immediate confirmation on mobile notification bar
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification('🔔 Lead Notifications Active', {
              body: 'You will receive instant alerts on this device when clients submit enquiries.',
              icon: settings.logo_url || '/logo/sk-builders-logo.png',
              badge: settings.logo_url || '/logo/sk-builders-logo.png',
              vibrate: [100, 50, 100],
              tag: 'welcome-notification',
              data: { url: '/admin#leads' }
            });
          }).catch(() => {});
        }
      } else {
        setNotifErrorMsg('Notifications are Blocked for this site in Chrome. Tap the 🎛️ or 🔒 icon next to the URL in your Chrome address bar ➔ Permissions ➔ Change Notifications to "Allow", then tap this switch again.');
        setTimeout(() => setNotifErrorMsg(''), 9000);
      }
    } catch (err) {
      setNotifErrorMsg('Could not enable notifications: ' + err.message);
      setTimeout(() => setNotifErrorMsg(''), 5000);
    }
  };

  // Auto-detect when user grants permission in browser settings and returns to this tab
  useEffect(() => {
    const checkPermissionOnFocus = () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const currentPerm = Notification.permission;
        setNotifPermission(currentPerm);
        if (currentPerm === 'granted' && localStorage.getItem('admin_lead_notifications_enabled') === 'true') {
          setNotifEnabled(true);
        }
      }
    };
    window.addEventListener('focus', checkPermissionOnFocus);
    document.addEventListener('visibilitychange', checkPermissionOnFocus);
    return () => {
      window.removeEventListener('focus', checkPermissionOnFocus);
      document.removeEventListener('visibilitychange', checkPermissionOnFocus);
    };
  }, []);

  // Real-time listener for incoming client lead enquiries
  useEffect(() => {
    if (!notifEnabled) return;

    if (lastNotifiedLeadIdRef.current === null && Array.isArray(leads) && leads.length > 0) {
      const maxId = Math.max(...leads.map(l => Number(l.id) || 0));
      lastNotifiedLeadIdRef.current = maxId;
    }

    // 1. Instant Server-Sent Events (SSE) Stream
    let eventSource = null;
    try {
      eventSource = new EventSource('/api/leads/events');
      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload?.type === 'NEW_LEAD' && payload.lead?.id) {
            const lead = payload.lead;
            if (lastNotifiedLeadIdRef.current === null || lead.id > lastNotifiedLeadIdRef.current) {
              lastNotifiedLeadIdRef.current = lead.id;
              triggerLeadNotification(lead);
              fetchData();
            }
          }
        } catch (err) {}
      };
    } catch (err) {}

    // 2. Continuous lightweight fallback polling
    const pollTimer = setInterval(async () => {
      try {
        const res = await fetch('/api/leads/latest');
        if (res.ok) {
          const data = await res.json();
          if (data?.lead?.id) {
            const lead = data.lead;
            if (lastNotifiedLeadIdRef.current !== null && lead.id > lastNotifiedLeadIdRef.current) {
              lastNotifiedLeadIdRef.current = lead.id;
              triggerLeadNotification(lead);
              fetchData();
            } else if (lastNotifiedLeadIdRef.current === null) {
              lastNotifiedLeadIdRef.current = lead.id;
            }
          }
        }
      } catch (e) {}
    }, 3500);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollTimer);
    };
  }, [notifEnabled, leads]);

  const uploadImageFile = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/media/upload-image', { method: 'POST', body: formData });
    const data = await res.json();
    return data.imageUrl;
  };

  // Upload Batch Images helper
  const handleBatchImageUpload = async (endpoint, recordId, files, category = 'completed') => {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    formData.append('category', category);

    await fetch(`${endpoint}/${recordId}/images`, {
      method: 'POST',
      body: formData
    });
  };

  // Save Property Submit
  const handleSaveProperty = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPropertyFormError('');

    // Snapshot current state
    const currentImages = [...propertyImagesList];
    const itemsToUpload = currentImages.filter(item => item.file || item.isNew);
    const stagedDeletes = [...stagedDeletedPropertyImages];
    const isEdit = !!formProp.id;
    const propSnapshot = { ...formProp };

    // 1. IMMEDIATELY close modal!
    setModalType(null);
    setPropertyImagesList([]);
    setStagedDeletedPropertyImages([]);
    setSelectedImageFiles([]);

    const totalCount = itemsToUpload.length > 0 ? itemsToUpload.length : 1;
    const taskId = 'prop-' + Date.now();

    setActiveUploadTask({
      id: taskId,
      section: 'properties',
      itemId: propSnapshot.id || null,
      title: isEdit ? 'Updating Property' : 'Uploading Property Photos',
      current: 0,
      total: totalCount,
      pct: 0,
      currentThumbnail: itemsToUpload[0]?.url || propSnapshot.image || '',
      currentFilename: itemsToUpload[0]?.file?.name || propSnapshot.title || 'property-photo.webp',
      status: 'uploading'
    });

    try {
      if (itemsToUpload.length > 0) {
        let uploadedCount = 0;
        for (let i = 0; i < currentImages.length; i++) {
          const item = currentImages[i];
          if (item.file || item.isNew) {
            uploadedCount++;
            setActiveUploadTask(prev => (prev && prev.id === taskId ? {
              ...prev,
              current: uploadedCount,
              pct: Math.round(((uploadedCount - 0.7) / itemsToUpload.length) * 100),
              currentFilename: item.file?.name || `Photo #${uploadedCount}`,
              currentThumbnail: item.url || ''
            } : prev));

            try {
              const compressedFile = await compressImage(item.file, { maxWidth: 1920, maxHeight: 1080, quality: 0.82 });
              const formData = new FormData();
              formData.append('image', compressedFile);
              const upRes = await fetch('/api/media/upload-image?section=properties', {
                method: 'POST',
                body: formData
              });
              const upData = await upRes.json();
              if (upData.imageUrl) {
                currentImages[i] = { id: item.id, url: upData.imageUrl, isNew: false };
              }
            } catch (upErr) {
              console.error('Property image upload error:', upErr);
            }

            setActiveUploadTask(prev => (prev && prev.id === taskId ? {
              ...prev,
              pct: Math.round((uploadedCount / itemsToUpload.length) * 100)
            } : prev));
          }
        }
      }

      const url = isEdit ? `/api/properties/${propSnapshot.id}` : '/api/properties';
      const method = isEdit ? 'PUT' : 'POST';

      const coverImg = (currentImages && currentImages.length > 0 && currentImages[0].url)
        ? currentImages[0].url
        : '';

      const finalDesc = propSnapshot.description || generatePropertyDescription(propSnapshot);
      const finalPrice = propSnapshot.price_amount
        ? `₹${propSnapshot.price_amount} ${propSnapshot.price_unit || 'Lakhs'}`
        : (propSnapshot.price?.trim() || 'Price on Request');

      const cleanPlot = propSnapshot.plot_area ? String(propSnapshot.plot_area).trim() : '';
      const cleanBuilt = propSnapshot.builtup_area ? String(propSnapshot.builtup_area).trim() : '';
      const cleanBed = propSnapshot.bedrooms ? (String(propSnapshot.bedrooms).includes('BHK') ? propSnapshot.bedrooms : `${propSnapshot.bedrooms} BHK`) : '';
      const cleanRoad = propSnapshot.road_width ? String(propSnapshot.road_width).trim() : '';

      const payload = {
        ...propSnapshot,
        title: propSnapshot.title?.trim() || 'Individual House for Sale',
        price: finalPrice,
        bedrooms: cleanBed,
        plot_area: cleanPlot,
        plot_area_unit: cleanPlot ? (propSnapshot.plot_area_unit || 'sq.ft') : '',
        builtup_area: cleanBuilt,
        builtup_area_unit: cleanBuilt ? (propSnapshot.builtup_area_unit || 'sq.ft') : '',
        road_width: cleanRoad,
        road_width_unit: cleanRoad ? (propSnapshot.road_width_unit || 'ft') : '',
        image: coverImg,
        description: finalDesc,
        full_description: finalDesc,
        short_description: finalDesc.split('\n\n')[0] || ''
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server error saving property to database.');
      }

      const recordId = isEdit ? propSnapshot.id : data.id;

      if (stagedDeletes.length > 0) {
        for (const itemToRemove of stagedDeletes) {
          if (itemToRemove && itemToRemove.url && !itemToRemove.url.startsWith('data:') && !itemToRemove.url.startsWith('blob:')) {
            try {
              await fetch('/api/properties/delete-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  propertyId: recordId || propSnapshot.id || null,
                  imageUrl: itemToRemove.url,
                  imageId: typeof itemToRemove.id === 'number' ? itemToRemove.id : null
                })
              });
            } catch (delErr) {
              console.error('Error deleting staged image:', delErr);
            }
          }
        }
      }

      if (recordId) {
        try {
          const validUrls = (currentImages || []).map(item => item.url).filter(u => u && !u.startsWith('blob:'));
          await fetch(`/api/properties/${recordId}/images/sync`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: validUrls })
          });
        } catch (syncErr) {
          console.error('Batch image sync warning:', syncErr);
        }
      }

      await fetchData();
      notifySiteDataUpdated();

      setActiveUploadTask(prev => (prev && prev.id === taskId ? {
        ...prev,
        pct: 100,
        current: totalCount,
        status: 'completed',
        message: 'Saved successfully!'
      } : prev));

      setTimeout(() => {
        setActiveUploadTask(prev => (prev && prev.id === taskId ? null : prev));
      }, 4000);
    } catch (err) {
      console.error('Error saving property:', err);
      setActiveUploadTask(prev => (prev && prev.id === taskId ? {
        ...prev,
        status: 'error',
        message: err.message || 'Failed to save property.'
      } : prev));
      setTimeout(() => {
        setActiveUploadTask(prev => (prev && prev.id === taskId ? null : prev));
      }, 5000);
    }
  };

  const requestDeleteProperty = (id, title) => {
    setDeleteConfig({
      title: `Delete property "${title}"?`,
      onConfirm: async () => {
        await fetch(`/api/properties/${id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
      }
    });
    setModalType('confirm_delete');
  };

  // Save Land Submit
  const handleSaveLand = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLandFormError('');

    const currentLandImages = [...landImagesList];
    const itemsToUpload = currentLandImages.filter(item => item.file || item.isNew);
    const stagedDeletes = [...stagedDeletedLandImages];
    const isEdit = !!formLand.id;
    const landSnapshot = { ...formLand };

    // 1. IMMEDIATELY close modal!
    setModalType(null);
    setLandImagesList([]);
    setStagedDeletedLandImages([]);

    const totalCount = itemsToUpload.length > 0 ? itemsToUpload.length : 1;
    const taskId = 'land-' + Date.now();

    setActiveUploadTask({
      id: taskId,
      section: 'land',
      itemId: landSnapshot.id || null,
      title: isEdit ? 'Updating Land Plot' : 'Uploading Land Photos',
      current: 0,
      total: totalCount,
      pct: 0,
      currentThumbnail: itemsToUpload[0]?.url || landSnapshot.image || '',
      currentFilename: itemsToUpload[0]?.file?.name || landSnapshot.title || 'land-photo.webp',
      status: 'uploading'
    });

    try {
      if (itemsToUpload.length > 0) {
        let uploadedCount = 0;
        for (let i = 0; i < currentLandImages.length; i++) {
          const item = currentLandImages[i];
          if (item.file || item.isNew) {
            uploadedCount++;
            setActiveUploadTask(prev => (prev && prev.id === taskId ? {
              ...prev,
              current: uploadedCount,
              pct: Math.round(((uploadedCount - 0.7) / itemsToUpload.length) * 100),
              currentFilename: item.file?.name || `Photo #${uploadedCount}`,
              currentThumbnail: item.url || ''
            } : prev));

            try {
              const compressedFile = await compressImage(item.file, { maxWidth: 1920, maxHeight: 1080, quality: 0.82 });
              const formData = new FormData();
              formData.append('image', compressedFile);
              const upRes = await fetch('/api/media/upload-image?section=land', {
                method: 'POST',
                body: formData
              });
              const upData = await upRes.json();
              if (upData.imageUrl) {
                currentLandImages[i] = { id: item.id, url: upData.imageUrl, isNew: false };
              }
            } catch (upErr) {
              console.error('Land image upload error:', upErr);
            }

            setActiveUploadTask(prev => (prev && prev.id === taskId ? {
              ...prev,
              pct: Math.round((uploadedCount / itemsToUpload.length) * 100)
            } : prev));
          }
        }
      }

      const url = isEdit ? `/api/land/${landSnapshot.id}` : '/api/land';
      const method = isEdit ? 'PUT' : 'POST';

      const coverImg = (currentLandImages && currentLandImages.length > 0 && currentLandImages[0].url)
        ? currentLandImages[0].url
        : '';

      const finalDesc = landSnapshot.description || generateLandDescription(landSnapshot);
      const finalPrice = landSnapshot.price_amount
        ? `₹${landSnapshot.price_amount} ${landSnapshot.price_unit || 'Lakhs'}`
        : (landSnapshot.total_price?.trim() || landSnapshot.price?.trim() || 'Price on Request');

      const cleanPlot = landSnapshot.plot_area ? String(landSnapshot.plot_area).trim() : '';
      const cleanRoad = landSnapshot.road_width ? String(landSnapshot.road_width).trim() : '';

      const payload = {
        ...landSnapshot,
        title: landSnapshot.title?.trim() || 'DTCP Approved Residential Plot',
        total_price: finalPrice,
        price: finalPrice,
        plot_area: cleanPlot,
        plot_area_unit: cleanPlot ? (landSnapshot.plot_area_unit || 'sq.ft') : '',
        road_width: cleanRoad,
        road_width_unit: cleanRoad ? (landSnapshot.road_width_unit || 'ft') : '',
        image: coverImg,
        description: finalDesc,
        full_description: finalDesc,
        short_description: finalDesc.split('\n\n')[0] || ''
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server error saving land plot.');
      }

      const recordId = isEdit ? landSnapshot.id : data.id;

      if (Array.isArray(stagedDeletes) && stagedDeletes.length > 0) {
        for (const imgToDelete of stagedDeletes) {
          if (imgToDelete && imgToDelete.url && !imgToDelete.url.startsWith('data:') && !imgToDelete.url.startsWith('blob:')) {
            try {
              await fetch('/api/land/delete-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  landId: recordId,
                  imageUrl: imgToDelete.url,
                  imageId: typeof imgToDelete.id === 'number' ? imgToDelete.id : undefined
                })
              });
            } catch (delErr) {
              console.error('Physical land image deletion warning:', delErr);
            }
          }
        }
      }

      if (recordId) {
        try {
          const validUrls = (currentLandImages || []).map(item => item.url).filter(u => u && !u.startsWith('blob:'));
          await fetch(`/api/land/${recordId}/images/sync`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: validUrls })
          });
        } catch (syncErr) {
          console.error('Land image sync error:', syncErr);
        }
      }

      await fetchData();
      notifySiteDataUpdated();

      setActiveUploadTask(prev => (prev && prev.id === taskId ? {
        ...prev,
        pct: 100,
        current: totalCount,
        status: 'completed',
        message: 'Saved successfully!'
      } : prev));

      setTimeout(() => {
        setActiveUploadTask(prev => (prev && prev.id === taskId ? null : prev));
      }, 4000);
    } catch (err) {
      console.error('Error saving land plot:', err);
      setActiveUploadTask(prev => (prev && prev.id === taskId ? {
        ...prev,
        status: 'error',
        message: err.message || 'Failed to save land plot.'
      } : prev));
      setTimeout(() => {
        setActiveUploadTask(prev => (prev && prev.id === taskId ? null : prev));
      }, 5000);
    }
  };

  const requestDeleteLand = (id, title) => {
    setDeleteConfig({
      title: `Delete land plot "${title}"?`,
      onConfirm: async () => {
        await fetch(`/api/land/${id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
      }
    });
    setModalType('confirm_delete');
  };

  // Save Project Submit
  const handleSaveProject = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setProjectFormError('');

    const currentProjectImages = [...projectImagesList];
    const itemsToUpload = currentProjectImages.filter(item => item.file || item.isNew);
    const stagedDeletes = [...stagedDeletedProjectImages];
    const isEdit = !!formProj.id;
    const projectSnapshot = { ...formProj };

    // 1. IMMEDIATELY close modal!
    setModalType(null);
    setProjectImagesList([]);
    setStagedDeletedProjectImages([]);

    const totalCount = itemsToUpload.length > 0 ? itemsToUpload.length : 1;
    const taskId = 'proj-' + Date.now();

    setActiveUploadTask({
      id: taskId,
      section: 'projects',
      itemId: projectSnapshot.id || null,
      title: isEdit ? 'Updating Project' : 'Uploading Project Photos',
      current: 0,
      total: totalCount,
      pct: 0,
      currentThumbnail: itemsToUpload[0]?.url || projectSnapshot.cover_image || projectSnapshot.image || '',
      currentFilename: itemsToUpload[0]?.file?.name || projectSnapshot.name || 'project-photo.webp',
      status: 'uploading'
    });

    try {
      // 1. Upload newly selected project image files in background with progress and client-side compression
      if (itemsToUpload.length > 0) {
        let uploadedCount = 0;
        for (let i = 0; i < currentProjectImages.length; i++) {
          const item = currentProjectImages[i];
          if (item.file || item.isNew) {
            uploadedCount++;
            setActiveUploadTask(prev => (prev && prev.id === taskId ? {
              ...prev,
              current: uploadedCount,
              pct: Math.round(((uploadedCount - 0.7) / itemsToUpload.length) * 100),
              currentFilename: item.file?.name || `Photo #${uploadedCount}`,
              currentThumbnail: item.url || ''
            } : prev));

            try {
              // Client-side compression to WebP (max 1920x1080)
              const compressedFile = await compressImage(item.file, { maxWidth: 1920, maxHeight: 1080, quality: 0.82 });
              const formData = new FormData();
              formData.append('image', compressedFile);
              const upRes = await fetch('/api/media/upload-image?section=projects', {
                method: 'POST',
                body: formData
              });
              const upData = await upRes.json();
              if (upData.imageUrl) {
                currentProjectImages[i] = { id: item.id, url: upData.imageUrl, isNew: false };
              }
            } catch (upErr) {
              console.error('Project image upload error:', upErr);
            }

            setActiveUploadTask(prev => (prev && prev.id === taskId ? {
              ...prev,
              pct: Math.round((uploadedCount / itemsToUpload.length) * 100)
            } : prev));
          }
        }
      }

      const url = isEdit ? `/api/projects/${projectSnapshot.id}` : '/api/projects';
      const method = isEdit ? 'PUT' : 'POST';

      const coverImg = (currentProjectImages && currentProjectImages.length > 0 && currentProjectImages[0].url)
        ? currentProjectImages[0].url
        : '';

      const finalDesc = projectSnapshot.description || generateProjectDescription(projectSnapshot);
      const cleanBuilt = projectSnapshot.builtup_area ? String(projectSnapshot.builtup_area).trim() : '';
      const cleanPlot = projectSnapshot.plot_area ? String(projectSnapshot.plot_area).trim() : '';
      const cleanBed = projectSnapshot.bedrooms ? (String(projectSnapshot.bedrooms).includes('BHK') ? projectSnapshot.bedrooms : `${projectSnapshot.bedrooms} BHK`) : '';

      const payload = {
        ...projectSnapshot,
        name: projectSnapshot.name?.trim() || projectSnapshot.title?.trim() || 'Individual Villa Construction',
        title: projectSnapshot.name?.trim() || projectSnapshot.title?.trim() || 'Individual Villa Construction',
        builtup_area: cleanBuilt,
        builtup_area_unit: cleanBuilt ? (projectSnapshot.builtup_area_unit || 'sq.ft') : '',
        plot_area: cleanPlot,
        plot_area_unit: cleanPlot ? (projectSnapshot.plot_area_unit || 'sq.ft') : '',
        bedrooms: cleanBed,
        floors: projectSnapshot.floors ? String(projectSnapshot.floors).trim() : '',
        bathrooms: projectSnapshot.bathrooms ? String(projectSnapshot.bathrooms).trim() : '',
        cover_image: coverImg,
        image: coverImg,
        description: finalDesc,
        overview: finalDesc
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server error saving project.');
      }

      const recordId = isEdit ? projectSnapshot.id : data.id;

      // Physically delete staged removed images from disk and database
      if (Array.isArray(stagedDeletes) && stagedDeletes.length > 0) {
        for (const imgToDelete of stagedDeletes) {
          if (imgToDelete && imgToDelete.url && !imgToDelete.url.startsWith('data:') && !imgToDelete.url.startsWith('blob:')) {
            try {
              await fetch('/api/projects/delete-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  projectId: recordId,
                  imageUrl: imgToDelete.url,
                  imageId: typeof imgToDelete.id === 'number' ? imgToDelete.id : undefined
                })
              });
            } catch (delErr) {
              console.error('Physical project image deletion warning:', delErr);
            }
          }
        }
      }

      // Sync and reorder remaining images in project_images table
      if (recordId) {
        try {
          const validUrls = (currentProjectImages || []).map(item => item.url).filter(u => u && !u.startsWith('blob:'));
          await fetch(`/api/projects/${recordId}/images/sync`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: validUrls })
          });
        } catch (syncErr) {
          console.error('Project image sync error:', syncErr);
        }
      }

      await fetchData();
      notifySiteDataUpdated();

      setActiveUploadTask(prev => (prev && prev.id === taskId ? {
        ...prev,
        pct: 100,
        current: totalCount,
        status: 'completed',
        message: 'Saved successfully!'
      } : prev));

      setTimeout(() => {
        setActiveUploadTask(prev => (prev && prev.id === taskId ? null : prev));
      }, 4000);
    } catch (err) {
      console.error('Error saving project:', err);
      setActiveUploadTask(prev => (prev && prev.id === taskId ? {
        ...prev,
        status: 'error',
        message: err.message || 'Failed to save project.'
      } : prev));
      setTimeout(() => {
        setActiveUploadTask(prev => (prev && prev.id === taskId ? null : prev));
      }, 5000);
    }
  };

  const requestDeleteProject = (id, title) => {
    setDeleteConfig({
      title: `Delete project "${title}"?`,
      onConfirm: async () => {
        await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
      }
    });
    setModalType('confirm_delete');
  };

  // Save Gallery Photo Submit (with multi-image background support)
  const handleSaveGallery = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const hasFiles = galleryFilesList.length > 0;
    const isEdit = !!formGal.id;

    if (!hasFiles && !formGal.image) {
      setStatusNotice('Please select at least one image file first.');
      setTimeout(() => setStatusNotice(''), 3000);
      return;
    }

    // 1. IMMEDIATELY close modal!
    setModalType(null);

    const filesToUpload = [...galleryFilesList];
    const singleImage = formGal.image;
    const editId = formGal.id;
    setGalleryFilesList([]);

    const totalCount = filesToUpload.length > 0 ? filesToUpload.length : 1;
    const taskId = 'gal-' + Date.now();

    setActiveUploadTask({
      id: taskId,
      section: 'gallery',
      title: 'Uploading Gallery Photos',
      current: 0,
      total: totalCount,
      pct: 0,
      currentThumbnail: filesToUpload[0]?.previewUrl || singleImage || '',
      currentFilename: filesToUpload[0]?.name || (singleImage ? singleImage.split('/').pop() : 'gallery-photo.webp'),
      status: 'uploading'
    });

    try {
      if (isEdit) {
        let finalImageUrl = singleImage;
        if (filesToUpload[0]?.file) {
          const compressed = await compressImage(filesToUpload[0].file, { maxWidth: 1920, maxHeight: 1080, quality: 0.82 });
          const formData = new FormData();
          formData.append('image', compressed);
          const upRes = await fetch('/api/media/upload-image?section=gallery', { method: 'POST', body: formData });
          const upData = await upRes.json();
          if (upData.imageUrl) finalImageUrl = upData.imageUrl;
        }
        await fetch(`/api/gallery/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: finalImageUrl })
        });
      } else {
        const uploadedUrls = [];
        for (let i = 0; i < filesToUpload.length; i++) {
          const item = filesToUpload[i];
          setActiveUploadTask(prev => (prev && prev.id === taskId ? {
            ...prev,
            current: i + 1,
            pct: Math.round(((i + 0.3) / filesToUpload.length) * 100),
            currentFilename: item.name,
            currentThumbnail: item.previewUrl
          } : prev));

          try {
            const compressed = await compressImage(item.file, { maxWidth: 1920, maxHeight: 1080, quality: 0.82 });
            const formData = new FormData();
            formData.append('image', compressed);
            const upRes = await fetch('/api/media/upload-image?section=gallery', { method: 'POST', body: formData });
            const upData = await upRes.json();
            if (upData.imageUrl) {
              uploadedUrls.push(upData.imageUrl);
              await fetch('/api/gallery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: upData.imageUrl })
              });
            }
          } catch (fileErr) {
            console.error('Gallery file upload error:', fileErr);
          }

          setActiveUploadTask(prev => (prev && prev.id === taskId ? {
            ...prev,
            pct: Math.round(((i + 1) / filesToUpload.length) * 100)
          } : prev));
        }
      }

      await fetchData();
      notifySiteDataUpdated();

      setActiveUploadTask(prev => (prev && prev.id === taskId ? {
        ...prev,
        pct: 100,
        current: totalCount,
        status: 'completed',
        message: 'Saved successfully!'
      } : prev));

      setTimeout(() => {
        setActiveUploadTask(prev => (prev && prev.id === taskId ? null : prev));
      }, 4000);
    } catch (err) {
      console.error('Error saving gallery photo:', err);
      setActiveUploadTask(prev => (prev && prev.id === taskId ? {
        ...prev,
        status: 'error',
        message: 'Network error while saving gallery photo.'
      } : prev));
      setTimeout(() => {
        setActiveUploadTask(prev => (prev && prev.id === taskId ? null : prev));
      }, 5000);
    }
  };

  const requestDeleteGallery = (id) => {
    setDeleteConfig({
      title: 'Delete this gallery photo?',
      onConfirm: async () => {
        await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
      }
    });
    setModalType('confirm_delete');
  };

  // Service CRUD Handlers
  const openCreateService = () => {
    setFormService({
      id: null,
      title: '',
      subtitle: '',
      badge: '',
      description: '',
      overview: '',
      icon_name: 'Home',
      link_url: '#contact',
      display_order: (services.length + 1),
      highlights: '',
      deliverables: [
        { title: 'Project Consultation', desc: 'Detailed initial assessment and planning.' },
        { title: 'Quality Assurance', desc: 'Strict inspection and certified materials.' },
        { title: 'Complete Handover', desc: 'All verified documents and handover.' }
      ],
      process_steps: [
        { step: '01', title: 'Consultation', desc: 'Understand your exact requirements and budget.' },
        { step: '02', title: 'Planning & Legal', desc: 'Site evaluation, technical drafting, and legal audit.' },
        { step: '03', title: 'Execution', desc: 'Professional milestone delivery with clear updates.' },
        { step: '04', title: 'Handover & Support', desc: 'Final walkthrough and post-completion support.' }
      ]
    });
    setModalType('service_form');
  };

  const openEditService = (srv) => {
    let parsedHighlights = '';
    if (srv.highlights) {
      if (Array.isArray(srv.highlights)) {
        parsedHighlights = srv.highlights.join('\n');
      } else if (typeof srv.highlights === 'string') {
        try {
          const parsed = JSON.parse(srv.highlights);
          parsedHighlights = Array.isArray(parsed) ? parsed.join('\n') : srv.highlights;
        } catch (e) {
          parsedHighlights = srv.highlights;
        }
      }
    }

    let parsedDeliverables = [];
    if (srv.deliverables) {
      if (Array.isArray(srv.deliverables)) {
        parsedDeliverables = srv.deliverables;
      } else if (typeof srv.deliverables === 'string') {
        try {
          const parsed = JSON.parse(srv.deliverables);
          if (Array.isArray(parsed)) parsedDeliverables = parsed;
        } catch (e) {}
      }
    }
    if (!parsedDeliverables || parsedDeliverables.length === 0) {
      parsedDeliverables = [
        { title: 'Consultation & Planning', desc: 'Detailed initial assessment and planning.' },
        { title: 'Quality Assurance', desc: 'Strict inspection and certified materials.' }
      ];
    }

    let parsedProcess = [];
    if (srv.process_steps) {
      if (Array.isArray(srv.process_steps)) {
        parsedProcess = srv.process_steps;
      } else if (typeof srv.process_steps === 'string') {
        try {
          const parsed = JSON.parse(srv.process_steps);
          if (Array.isArray(parsed)) parsedProcess = parsed;
        } catch (e) {}
      }
    }
    if (!parsedProcess || parsedProcess.length === 0) {
      parsedProcess = [
        { step: '01', title: 'Initial Consultation', desc: 'Understanding goals and requirements.' },
        { step: '02', title: 'Planning & Verification', desc: 'Technical analysis and clear roadmap.' },
        { step: '03', title: 'Milestone Execution', desc: 'Professional implementation with updates.' },
        { step: '04', title: 'Final Handover', desc: 'Complete documentation and satisfaction.' }
      ];
    }

    setFormService({
      id: srv.id,
      title: srv.title || '',
      subtitle: srv.subtitle || '',
      badge: srv.badge || '',
      description: srv.description || '',
      overview: srv.overview || '',
      icon_name: srv.icon_name || 'Home',
      link_url: srv.link_url || '#contact',
      display_order: srv.display_order || 1,
      highlights: parsedHighlights,
      deliverables: parsedDeliverables,
      process_steps: parsedProcess
    });
    setModalType('service_form');
  };

  const handleSaveService = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formService.title.trim() || !formService.description.trim()) {
      setStatusNotice('Title and short description are required.');
      setTimeout(() => setStatusNotice(''), 3000);
      return;
    }

    const rawHighlights = typeof formService.highlights === 'string'
      ? formService.highlights.split('\n').map(h => h.trim()).filter(Boolean)
      : (Array.isArray(formService.highlights) ? formService.highlights : []);

    const rawDeliverables = (formService.deliverables || []).filter(
      d => (d.title && d.title.trim()) || (d.desc && d.desc.trim())
    );

    const rawProcess = (formService.process_steps || []).map((step, idx) => ({
      step: step.step || `0${idx + 1}`,
      title: step.title || '',
      desc: step.desc || ''
    }));

    const payload = {
      ...formService,
      title: formService.title.trim(),
      subtitle: (formService.subtitle || '').trim(),
      badge: (formService.badge || '').trim(),
      description: formService.description.trim(),
      overview: (formService.overview || '').trim(),
      highlights: rawHighlights,
      deliverables: rawDeliverables,
      process_steps: rawProcess
    };

    const isEdit = Boolean(formService.id);
    const url = isEdit ? `/api/services/${formService.id}` : '/api/services';
    const method = isEdit ? 'PUT' : 'POST';

    setIsSavingService(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
        setStatusNotice(isEdit ? 'Service updated successfully!' : 'Service created successfully!');
        setTimeout(() => setStatusNotice(''), 3000);
      } else {
        const d = await res.json().catch(() => ({}));
        setStatusNotice(d.error || 'Failed to save service.');
        setTimeout(() => setStatusNotice(''), 3000);
      }
    } catch (err) {
      console.error('Error saving service:', err);
      setStatusNotice('Network error saving service.');
      setTimeout(() => setStatusNotice(''), 3000);
    } finally {
      setIsSavingService(false);
    }
  };

  const requestDeleteService = (srv) => {
    setDeleteConfig({
      title: `Delete service "${srv.title}"?`,
      onConfirm: async () => {
        await fetch(`/api/services/${srv.id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
        setStatusNotice('Service deleted.');
        setTimeout(() => setStatusNotice(''), 3000);
      }
    });
    setModalType('confirm_delete');
  };

  // Stat CRUD Handlers
  const openCreateStat = () => {
    setFormStat({
      id: null,
      icon_name: 'Home',
      value: '',
      label: '',
      display_order: (stats.length + 1)
    });
    setModalType('stat_form');
  };

  const openEditStat = (st) => {
    setFormStat({
      id: st.id,
      icon_name: st.icon_name || 'Home',
      value: st.value || '',
      label: st.label || '',
      display_order: st.display_order || 1
    });
    setModalType('stat_form');
  };

  const handleSaveStat = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formStat.value.trim() || !formStat.label.trim()) {
      setStatusNotice('Value (e.g. 40+) and Label (e.g. HOMES BUILT) are required.');
      setTimeout(() => setStatusNotice(''), 3000);
      return;
    }
    const isEdit = Boolean(formStat.id);
    const url = isEdit ? `/api/stats/${formStat.id}` : '/api/stats';
    const method = isEdit ? 'PUT' : 'POST';

    setIsSavingStat(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formStat)
      });
      if (res.ok) {
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
        setStatusNotice(isEdit ? 'Milestone stat updated successfully!' : 'Milestone stat created successfully!');
        setTimeout(() => setStatusNotice(''), 3000);
      } else {
        const d = await res.json().catch(() => ({}));
        setStatusNotice(d.error || 'Failed to save stat.');
        setTimeout(() => setStatusNotice(''), 3000);
      }
    } catch (err) {
      console.error('Error saving stat:', err);
      setStatusNotice('Network error saving stat.');
      setTimeout(() => setStatusNotice(''), 3000);
    } finally {
      setIsSavingStat(false);
    }
  };

  const requestDeleteStat = (st) => {
    setDeleteConfig({
      title: `Delete milestone stat "${st.value} ${st.label}"?`,
      onConfirm: async () => {
        await fetch(`/api/stats/${st.id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
        setStatusNotice('Milestone stat deleted.');
        setTimeout(() => setStatusNotice(''), 3000);
      }
    });
    setModalType('confirm_delete');
  };

  // Toggle Property Published / Featured
  const togglePropertyStatus = async (id, field, currentVal) => {
    await fetch(`/api/properties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: currentVal ? 0 : 1 })
    });
    fetchData();
    notifySiteDataUpdated();
  };

  // Toggle Land Published / Featured
  const toggleLandStatus = async (id, field, currentVal) => {
    await fetch(`/api/land/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: currentVal ? 0 : 1 })
    });
    fetchData();
    notifySiteDataUpdated();
  };

  // Toggle Project Published / Featured
  const toggleProjectStatus = async (id, field, currentVal) => {
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: currentVal ? 0 : 1 })
    });
    fetchData();
    notifySiteDataUpdated();
  };

  // Register Video URL (for external / cloud / large videos)
  const handleRegisterVideoUrl = async (e, targetType = 'background') => {
    if (e && e.preventDefault) e.preventDefault();
    if (!videoUrlInput || !videoUrlInput.trim()) return;

    try {
      const res = await fetch('/api/media/register-video-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: videoUrlInput.trim(), videoType: targetType })
      });
      let data = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (e) {}

      if (res.ok) {
        setVideoUrlInput('');
        setStatusNotice(`${targetType === 'background' ? 'Background' : 'Hero'} video link registered successfully!`);
        fetchData();
        notifySiteDataUpdated();
        notifyPrimaryVideoUpdated();
        setTimeout(() => setStatusNotice(''), 3000);
      } else {
        setStatusNotice(data.error || 'Failed to register video link.');
        setTimeout(() => setStatusNotice(''), 3000);
      }
    } catch (err) {
      console.error('Error registering video URL:', err);
      setStatusNotice('Network error registering video link.');
      setTimeout(() => setStatusNotice(''), 3000);
    }
  };

  // Register Video File from Local Public / Uploads Directory (Uploads directly or bypasses Vercel limit)
  const handleRegisterLocalVideoFile = async (rawFilename, videoType = 'hero') => {
    if (!rawFilename || !rawFilename.trim()) return;
    const isBg = videoType === 'background';
    const file = isBg ? selectedBgVideoFile : selectedHeroVideoFile;
    let cleanName = rawFilename.trim();
    if (!cleanName.includes('.')) {
      const ext = file?.name ? (file.name.substring(file.name.lastIndexOf('.')) || '.mp4') : '.mp4';
      cleanName += ext;
    }

    const relativeUrl = isBg ? `app/public/videos/${cleanName}` : `uploads/videos/${cleanName}`;

    // If file is selected in browser, try direct upload first (works on local Express backend for files > 4.5MB)
    if (file) {
      try {
        const formData = new FormData();
        formData.append('videoType', videoType);
        formData.append('customName', cleanName);
        formData.append('video', file);

        const res = await fetch('/api/media/upload-video', { method: 'POST', body: formData });
        if (res.ok) {
          if (isBg) {
            setSelectedBgVideoFile(null);
            setCustomBgVideoName('');
            setBgDupError(false);
            if (bgFileInputRef.current) bgFileInputRef.current.value = '';
          } else {
            setSelectedHeroVideoFile(null);
            setCustomHeroVideoName('');
            setHeroDupError(false);
            if (heroFileInputRef.current) heroFileInputRef.current.value = '';
          }
          setStatusNotice(`Uploaded and registered video "${cleanName}" successfully!`);
          fetchData();
          notifySiteDataUpdated();
          notifyPrimaryVideoUpdated();
          setTimeout(() => setStatusNotice(''), 4000);
          return;
        }
      } catch (uploadErr) {
        console.warn('Direct upload failed, falling back to URL registration:', uploadErr);
      }
    }

    // Fallback: Register path/URL in database (for Vercel serverless deployments)
    try {
      const res = await fetch('/api/media/register-video-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: relativeUrl,
          filename: cleanName,
          videoType
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (isBg) {
          setSelectedBgVideoFile(null);
          setCustomBgVideoName('');
          setBgDupError(false);
          if (bgFileInputRef.current) bgFileInputRef.current.value = '';
        } else {
          setSelectedHeroVideoFile(null);
          setCustomHeroVideoName('');
          setHeroDupError(false);
          if (heroFileInputRef.current) heroFileInputRef.current.value = '';
        }
        setStatusNotice(`Registered video "${cleanName}" in database! Place file in "${relativeUrl}".`);
        fetchData();
        notifySiteDataUpdated();
        notifyPrimaryVideoUpdated();
        setTimeout(() => setStatusNotice(''), 5000);
      } else {
        setStatusNotice(data.error || 'Failed to register video file.');
        setTimeout(() => setStatusNotice(''), 4000);
      }
    } catch (err) {
      console.error('Error registering local video:', err);
      setStatusNotice('Network error registering file.');
      setTimeout(() => setStatusNotice(''), 4000);
    }
  };

  // Video Upload Handler (Supports both 'hero' and 'background')
  const handleVideoUploadSubmit = async (e, videoType = 'hero') => {
    e.preventDefault();
    const isBg = videoType === 'background';
    const file = isBg ? selectedBgVideoFile : selectedHeroVideoFile;
    const customName = isBg ? customBgVideoName : customHeroVideoName;
    if (!file) return;

    if (isBg) {
      setIsUploadingBgVideo(true);
    } else {
      setIsUploadingHeroVideo(true);
      setClientExtraction({
        isExtracting: true,
        videoId: 'uploading',
        progress: 8,
        current: 0,
        total: 121,
        status: 'Uploading video to Vercel Blob Storage...'
      });
    }

    if (file.size > 4.5 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setStatusNotice(`⚠️ File size is ${sizeMB}MB (Vercel limit is 4.5MB). Attempting upload... If it fails, click "Register from app/public/videos/".`);
    }

    const formData = new FormData();
    formData.append('videoType', videoType);
    if (customName && customName.trim()) {
      formData.append('customName', customName.trim());
    }
    formData.append('video', file);

    try {
      const res = await fetch('/api/media/upload-video', { method: 'POST', body: formData });
      let data = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.warn('Non-JSON response from upload-video:', parseErr);
      }

      if (res.status === 409) {
        if (isBg) {
          setBgDupError(true);
          setTimeout(() => { if (bgRenameInputRef.current) bgRenameInputRef.current.focus(); }, 50);
        } else {
          setHeroDupError(true);
          setClientExtraction({ isExtracting: false, videoId: null, progress: 0, current: 0, total: 121, status: 'idle' });
          setTimeout(() => { if (heroRenameInputRef.current) heroRenameInputRef.current.focus(); }, 50);
        }
        return;
      }

      if (res.status === 413) {
        if (!isBg) {
          setClientExtraction({ isExtracting: false, videoId: null, progress: 0, current: 0, total: 121, status: 'idle' });
        }
        const targetFilename = (customName || file.name).trim();
        setStatusNotice(`⚠️ Video file exceeds Vercel 4.5MB upload limit! Place file in ${isBg ? 'app/public/videos/' : 'uploads/videos/'}${targetFilename} and click Register below.`);
        setTimeout(() => setStatusNotice(''), 6000);
        return;
      }

      if (res.ok) {
        const uploadedFileRef = file;
        if (isBg) {
          setSelectedBgVideoFile(null);
          setCustomBgVideoName('');
          setBgDupError(false);
          if (bgFileInputRef.current) bgFileInputRef.current.value = '';
        } else {
          setSelectedHeroVideoFile(null);
          setCustomHeroVideoName('');
          setHeroDupError(false);
          if (heroFileInputRef.current) heroFileInputRef.current.value = '';
        }
        setStatusNotice(`${isBg ? 'Background' : 'Hero Construction'} video uploaded successfully!`);
        fetchData();
        notifySiteDataUpdated();
        notifyPrimaryVideoUpdated();
        setTimeout(() => setStatusNotice(''), 3000);

        if (!isBg && data && data.id) {
          handleGenerateFramesInBrowser(data, uploadedFileRef);
        }
      } else {
        if (!isBg) {
          setClientExtraction({ isExtracting: false, videoId: null, progress: 0, current: 0, total: 121, status: 'idle' });
        }
        setStatusNotice(data.error || 'Failed to upload video.');
        setTimeout(() => setStatusNotice(''), 4000);
      }
    } catch (err) {
      console.error('Error uploading video:', err);
      if (!isBg) {
        setClientExtraction({ isExtracting: false, videoId: null, progress: 0, current: 0, total: 121, status: 'idle' });
      }
      const targetFilename = (customName || file.name).trim();
      setStatusNotice(`⚠️ Serverless upload failed due to payload size limit. Place file in ${isBg ? 'app/public/videos/' : 'uploads/videos/'}${targetFilename} and click Register below.`);
      setTimeout(() => setStatusNotice(''), 6000);
    } finally {
      if (isBg) setIsUploadingBgVideo(false);
      else setIsUploadingHeroVideo(false);
    }
  };

  // Video Rename Handler
  const handleRenameVideoSubmit = async (e) => {
    e.preventDefault();
    if (!videoRename.id || !videoRename.newName.trim()) return;

    const res = await fetch(`/api/media/video/${videoRename.id}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newFilename: videoRename.newName.trim() })
    });

    if (res.ok) {
      setModalType(null);
      fetchData();
      notifySiteDataUpdated();
      notifyPrimaryVideoUpdated();
    }
  };

  // Browser-based Client Frame Extractor (Extracts 121 WebP frames in canvas & uploads to Vercel Blob)
  const handleGenerateFramesInBrowser = async (vid, optionalFile = null) => {
    if (!vid) return;
    const targetId = vid.id;
    const videoName = vid.filename || 'hero';
    const videoSrc = optionalFile
      ? URL.createObjectURL(optionalFile)
      : getVideoSrcUrl(vid.filepath, vid.filename);

    setClientExtraction({
      isExtracting: true,
      videoId: targetId,
      progress: 0,
      current: 0,
      total: 121,
      status: 'Initializing...'
    });

    let objectUrl = null;

    try {
      if (optionalFile) {
        objectUrl = videoSrc;
      } else {
        setClientExtraction(prev => ({ ...prev, status: 'Fetching video stream...' }));
        const resp = await fetch(videoSrc);
        if (!resp.ok) throw new Error(`Could not fetch video (${resp.status})`);
        const blob = await resp.blob();
        objectUrl = URL.createObjectURL(blob);
      }

      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = objectUrl;

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video metadata'));
        setTimeout(() => reject(new Error('Video loading timed out after 30s')), 30000);
      });

      const duration = video.duration;
      if (!duration || isNaN(duration)) {
        throw new Error('Invalid video duration');
      }

      const canvas = document.createElement('canvas');
      let width = video.videoWidth || 1280;
      let height = video.videoHeight || 720;
      if (width > 1280) {
        height = Math.round((height * 1280) / width);
        width = 1280;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const totalFrames = 121;
      const allBlobUrls = [];
      let batch = [];
      const batchSize = 10;

      const seekTo = (time) => new Promise((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
        video.currentTime = Math.min(duration, Math.max(0, time));
        setTimeout(() => {
          video.removeEventListener('seeked', onSeeked);
          resolve();
        }, 1500);
      });

      for (let i = 0; i < totalFrames; i++) {
        const targetTime = totalFrames > 1 ? (i / (totalFrames - 1)) * duration : 0;
        await seekTo(targetTime);

        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/webp', 0.82);
        const filename = `frame_${String(i + 1).padStart(4, '0')}.webp`;
        batch.push({ filename, data: dataUrl });

        const currentCount = i + 1;
        const isFinalFrame = i === totalFrames - 1;
        // Use true percentage (not capped at 99) so the last frame naturally shows 100 after upload
        const progressPct = Math.max(1, Math.round((currentCount / totalFrames) * 100));
        // Show in-progress percentage (cap at 98) until batch is actually uploaded
        setClientExtraction(prev => ({
          ...prev,
          current: currentCount,
          progress: isFinalFrame ? prev.progress : Math.min(98, progressPct),
          status: 'Extracting'
        }));

        if (batch.length >= batchSize || isFinalFrame) {
          const cleanPrefix = (videoName || 'hero').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
          // Send true progressPct (can be 100 on final batch) so server correctly sets isExtracting=false
          const uploadRes = await fetch('/api/media/upload-frames-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoId: targetId,
              videoFilename: videoName,
              videoPrefix: cleanPrefix,
              frames: batch,
              currentCount,
              totalFrames,
              progress: progressPct
            })
          });

          if (uploadRes.ok) {
            const resData = await uploadRes.json();
            if (Array.isArray(resData.uploadedUrls)) {
              resData.uploadedUrls.forEach(u => allBlobUrls.push(u.url));
            }
          }
          batch = [];

          // After final batch upload completes, immediately show 100%
          if (isFinalFrame) {
            setClientExtraction(prev => ({ ...prev, current: totalFrames, progress: 100, status: 'Uploading to Blob...' }));
          }
        }
      }

      setClientExtraction(prev => ({
        ...prev,
        progress: 100,
        status: 'Saving frame metadata...'
      }));

      if (allBlobUrls.length > 0) {
        await fetch('/api/media/save-frame-urls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: targetId,
            frameUrls: allBlobUrls
          })
        });
      }

      if (objectUrl && !optionalFile) {
        URL.revokeObjectURL(objectUrl);
      }

      setClientExtraction({
        isExtracting: false,
        videoId: null,
        progress: 100,
        current: 121,
        total: 121,
        status: 'completed'
      });

      setStatusNotice('🎉 All Frames extracted and uploaded successfully!');
      setTimeout(() => setStatusNotice(''), 5000);
      fetchData();
      notifySiteDataUpdated();
      notifyPrimaryVideoUpdated();
    } catch (err) {
      console.error('Frame Extraction Error:', err);
      setClientExtraction({
        isExtracting: false,
        videoId: null,
        progress: 0,
        current: 0,
        total: 121,
        status: 'error'
      });
      setStatusNotice(`⚠️ Frame extraction error: ${err.message}`);
      setTimeout(() => setStatusNotice(''), 5000);
    }
  };

  // Instant Set Primary Video Handler
  const handleSetPrimaryVideo = async (videoId, videoType = 'hero') => {
    const targetVid = videos.find(v => v.id === videoId);

    // 1. Instantly update client state: clear all old frames and mark new video as primary
    setVideos(prev => prev.map(v => {
      const vType = v.video_type || 'hero';
      if (vType === videoType) {
        return { ...v, is_primary: v.id === videoId ? 1 : 0, frame_urls: null };
      }
      return v;
    }));

    if (videoType === 'hero') {
      try {
        // 2. Call backend: instant deletes entire old frames from Vercel Blob and clears DB
        const res = await fetch('/api/media/set-primary-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId })
        });
        if (res.ok) {
          notifySiteDataUpdated();
          notifyPrimaryVideoUpdated();
        }
      } catch (err) {
        console.error('Error setting primary video:', err);
      }

      // 3. Automatically extract new frames for the new primary video with live frame progress
      if (targetVid) {
        handleGenerateFramesInBrowser(targetVid);
      }
    } else {
      const res = await fetch('/api/media/set-primary-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId })
      });
      if (res.ok) {
        fetchData();
        notifySiteDataUpdated();
        notifyPrimaryVideoUpdated();
      }
    }
  };

  const requestDeleteVideo = (id, filename) => {
    setDeleteConfig({
      title: `Delete video file "${filename}"?`,
      onConfirm: async () => {
        await fetch(`/api/media/video/${id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        notifyPrimaryVideoUpdated();
        setModalType(null);
      }
    });
    setModalType('confirm_delete');
  };

  const openCreateTestimonial = () => {
    setFormTestimonial({ id: null, client_name: '', location: '', quote: '', rating: 5 });
    setModalType('testimonial_form');
  };

  const openEditTestimonial = (t) => {
    setFormTestimonial({ id: t.id, client_name: t.client_name, location: t.location, quote: t.quote, rating: t.rating || 5 });
    setModalType('testimonial_form');
  };

  const handleSaveTestimonial = async (e) => {
    e.preventDefault();
    setIsSavingTestimonial(true);
    try {
      const url = formTestimonial.id ? `/api/testimonials/${formTestimonial.id}` : '/api/testimonials';
      const method = formTestimonial.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formTestimonial)
      });
      if (res.ok) {
        setModalType(null);
        fetchData();
        notifySiteDataUpdated();
        setStatusNotice(formTestimonial.id ? 'Testimonial updated successfully!' : 'Testimonial added successfully!');
        setTimeout(() => setStatusNotice(''), 4000);
      }
    } catch (err) {
      console.error('Error saving testimonial:', err);
    } finally {
      setIsSavingTestimonial(false);
    }
  };

  const requestDeleteTestimonial = (id, name) => {
    setDeleteConfig({
      title: `Are you sure you want to delete the testimonial by "${name}"?`,
      onConfirm: async () => {
        await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
        setStatusNotice('Testimonial deleted successfully.');
        setTimeout(() => setStatusNotice(''), 4000);
      }
    });
    setModalType('confirm_delete');
  };

  const handleToggleFeedbackApproval = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: !currentStatus })
      });
      if (res.ok) {
        fetchData();
        notifySiteDataUpdated();
        setStatusNotice(!currentStatus ? 'Feedback approved & published on website!' : 'Feedback hidden from website.');
        setTimeout(() => setStatusNotice(''), 4000);
      }
    } catch (err) {
      console.error('Error toggling feedback status:', err);
    }
  };

  const requestDeleteFeedback = (id, name) => {
    setDeleteConfig({
      title: `Are you sure you want to permanently delete the feedback from "${name}"?`,
      onConfirm: async () => {
        await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
        setStatusNotice('Feedback review deleted successfully.');
        setTimeout(() => setStatusNotice(''), 4000);
      }
    });
    setModalType('confirm_delete');
  };

  const requestDeleteLead = (id, name) => {
    setDeleteConfig({
      title: `Are you sure you want to delete the inquiry from "${name}"?`,
      onConfirm: async () => {
        await fetch(`/api/leads/${id}`, { method: 'DELETE' }).catch(() => { });
        setLeads(prev => prev.filter(l => l.id !== id));
        fetchData();
        setModalType(null);
        setStatusNotice('Customer inquiry deleted.');
        setTimeout(() => setStatusNotice(''), 4000);
      }
    });
    setModalType('confirm_delete');
  };

  const handleToggleLeadContacted = async (leadId, currentStatus) => {
    const nextStatus = currentStatus ? 0 : 1;
    const nextStatusText = nextStatus ? 'Contacted' : 'Pending';
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, contacted: nextStatus, status: nextStatusText } : l));
    try {
      const res = await fetch(`/api/leads/${leadId}/toggle-contact`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacted: nextStatus, status: nextStatusText })
      });
      if (res.ok) {
        notifySiteDataUpdated('leads');
        setStatusNotice(nextStatus ? 'Contact completed! Saved directly to Database.' : 'Lead marked as pending in Database.');
        setTimeout(() => setStatusNotice(''), 3500);
      }
    } catch (err) {
      console.error('Error toggling lead contact status:', err);
    }
  };

  // Safe Arrays
  const safeProperties = Array.isArray(properties) ? properties : [];
  const safeLand = Array.isArray(land) ? land : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeServices = Array.isArray(services) ? services : [];
  const safeGallery = Array.isArray(gallery) ? gallery : [];
  const safeFeedbacks = Array.isArray(feedbacks) ? feedbacks : [];
  const safeTestimonials = Array.isArray(testimonials) ? testimonials : [];
  const safeLeads = Array.isArray(leads) ? leads : [];
  const safeVideos = Array.isArray(videos) ? videos : [];
  const heroVideos = safeVideos.filter(v => (v.video_type || 'hero') === 'hero');
  const bgVideos = safeVideos.filter(v => v.video_type === 'background');

  // Filtered lists
  const filteredFeedbacks = safeFeedbacks.filter(f =>
    (f.client_name || '').toLowerCase().includes(feedSearch.toLowerCase()) ||
    (f.location || '').toLowerCase().includes(feedSearch.toLowerCase()) ||
    (f.service || '').toLowerCase().includes(feedSearch.toLowerCase()) ||
    (f.message || '').toLowerCase().includes(feedSearch.toLowerCase())
  );

  const filteredTestimonials = safeTestimonials.filter(t =>
    (t.client_name || '').toLowerCase().includes(testSearch.toLowerCase()) ||
    (t.location || '').toLowerCase().includes(testSearch.toLowerCase()) ||
    (t.quote || '').toLowerCase().includes(testSearch.toLowerCase())
  );


  const filteredProperties = safeProperties.filter(p =>
    (p.title || '').toLowerCase().includes(propSearch.toLowerCase()) ||
    (p.location || '').toLowerCase().includes(propSearch.toLowerCase()) ||
    (p.property_id || '').toLowerCase().includes(propSearch.toLowerCase())
  );

  const filteredLand = safeLand.filter(l =>
    (l.title || '').toLowerCase().includes(landSearch.toLowerCase()) ||
    (l.location || '').toLowerCase().includes(landSearch.toLowerCase()) ||
    (l.land_id || '').toLowerCase().includes(landSearch.toLowerCase())
  );

  const filteredProjects = safeProjects.filter(pr =>
    (pr.name || pr.title || '').toLowerCase().includes(projSearch.toLowerCase()) ||
    (pr.location || '').toLowerCase().includes(projSearch.toLowerCase()) ||
    (pr.project_id || '').toLowerCase().includes(projSearch.toLowerCase())
  );

  // Metrics for Dashboard Summary
  const availableHousesCount = safeProperties.filter(p => p.status === 'Available').length;
  const availableLandCount = safeLand.filter(l => l.status === 'Available').length;
  const soldCount = safeProperties.filter(p => p.status === 'Sold').length + safeLand.filter(l => l.status === 'Sold').length;
  const completedProjectsCount = safeProjects.filter(p => p.status === 'Completed').length;
  const ongoingProjectsCount = safeProjects.filter(p => p.status === 'Under Construction' || p.status === 'Ongoing').length;
  const startedProjectsCount = safeProjects.filter(p => p.status === 'Planning & Approvals' || p.status === 'Planned' || p.status === 'Started' || p.status === 'Approval').length;

  // 1. AUTHENTICATION SCREENS (DYNAMIC REGISTER vs LOGIN)
  if (!isAuthenticated) {
    // A. LOADING STATE WHILE CHECKING AUTH STATUS
    if (isAuthChecking) {
      return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden text-white selection:bg-amber-500 selection:text-black">
          <LoginBackgroundCanvas />
          <div className="flex flex-col items-center gap-3 relative z-10 animate-pulse">
            <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-amber-400/90 font-bold uppercase tracking-widest">Checking Security System...</p>
          </div>
        </div>
      );
    }

    // B. REGISTER SCREEN (Rendered for first time setup when user has not registered yet)
    const showRegister = hasAdmin === false;
    if (showRegister) {
      return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden text-white selection:bg-amber-500 selection:text-black">
          {/* Dynamic Animated Gold Dust Particle Canvas */}
          <LoginBackgroundCanvas />

          {/* Ambient Gold Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-amber-500/15 rounded-full blur-[160px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-amber-600/10 rounded-full blur-[130px] pointer-events-none" />

          {/* Gold Specular Glassmorphism Form Card */}
          <div className="gold-specular-card bg-[#121216]/95 border border-amber-500/35 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_60px_rgba(245,158,11,0.2)] relative z-10 animate-fadeIn">
            {/* Logo & Header */}
            <div className="text-center mb-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white border border-amber-500/40 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20 overflow-hidden group hover:scale-105 transition-transform duration-300">
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt={`${settings?.company_name || 'Company'} Logo`} className="w-full h-full object-cover" />
                ) : (
                  <UserPlus size={28} className="text-amber-400" />
                )}
              </div>

              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-1">
                Create Admin Account
              </h2>
              <p className="text-xs font-semibold text-zinc-400 max-w-sm mx-auto">
                Set up your administrator username, mobile number & password to manage your business showcase.
              </p>
            </div>

            {registerError && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl mb-5 text-center font-bold flex items-center justify-center gap-2">
                <AlertTriangle size={15} className="text-red-400 shrink-0" />
                <span>{registerError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 relative z-10">
              {/* Username */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Admin Username <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    placeholder="Enter admin username"
                    className="w-full bg-[#09090b] border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 font-semibold shadow-inner transition-all"
                    required
                  />
                </div>
              </div>

              {/* Mobile Number - Mandatory & Next to Username */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Mobile Number <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none">
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value.replace(/[^0-9+ ]/g, '') })}
                    placeholder="Enter mobile number"
                    className="w-full bg-[#09090b] border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 font-semibold shadow-inner transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Master Password <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="Enter password (minimum 4 characters)"
                    className="w-full bg-[#09090b] border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 font-semibold shadow-inner transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-amber-400 transition-colors p-1"
                    title={showRegisterPassword ? "Hide password" : "Show password"}
                  >
                    {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Confirm Password <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none">
                    <ShieldCheck size={16} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter password to confirm"
                    className="w-full bg-[#09090b] border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 font-semibold shadow-inner transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-amber-400 transition-colors p-1"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Collapsible Optional Contact Details (Phone removed, only email & socials) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowOptionalSocials(!showOptionalSocials)}
                  className="w-full flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 hover:text-amber-400 transition-colors py-2 px-3 rounded-xl bg-zinc-900/60 border border-zinc-800"
                >
                  <span className="flex items-center gap-1.5">
                    <Share2 size={13} className="text-amber-400" /> Optional Contact & Social Links
                  </span>
                  {showOptionalSocials ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showOptionalSocials && (
                  <div className="mt-3 space-y-3 p-3.5 bg-zinc-900/40 rounded-xl border border-zinc-800/80 animate-fadeIn">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">Email Address</label>
                      <input
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        placeholder="e.g. info@skbuilders.com"
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">WhatsApp</label>
                        <input
                          type="text"
                          value={registerForm.whatsapp}
                          onChange={(e) => setRegisterForm({ ...registerForm, whatsapp: e.target.value })}
                          placeholder="WhatsApp number (optional)"
                          className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">Facebook</label>
                        <input
                          type="text"
                          value={registerForm.facebook}
                          onChange={(e) => setRegisterForm({ ...registerForm, facebook: e.target.value })}
                          placeholder="Facebook URL"
                          className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">Instagram</label>
                        <input
                          type="text"
                          value={registerForm.instagram}
                          onChange={(e) => setRegisterForm({ ...registerForm, instagram: e.target.value })}
                          placeholder="Instagram URL"
                          className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group mt-3 cursor-pointer disabled:opacity-50"
              >
                {isRegistering ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={16} className="text-black group-hover:scale-110 transition-transform" />
                    <span>Create Admin Account & Enter Dashboard</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      );
    }

    // C. LOGIN SCREEN (Rendered when admin_users already has a registered admin)
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden text-white selection:bg-amber-500 selection:text-black">
        {/* Dynamic Animated Gold Dust Particle Canvas */}
        <LoginBackgroundCanvas />

        {/* Ambient Gold Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/15 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-amber-600/10 rounded-full blur-[130px] pointer-events-none" />

        {/* Gold Specular Glassmorphism Form Card */}
        <div className="gold-specular-card bg-[#121216]/90 border border-amber-500/30 backdrop-blur-2xl rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.15)] relative z-10 animate-fadeIn">
          <div className="specular-glare" />

          {/* Close Tab Button */}
          <button
            type="button"
            onClick={() => {
              window.close();
              setTimeout(() => {
                try {
                  window.open('', '_self', '');
                  window.close();
                } catch (e) {}
              }, 50);
            }}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all border border-zinc-700/60 cursor-pointer shadow"
            title="Close Tab"
            aria-label="Close Tab"
          >
            <X size={15} />
          </button>

          {/* Logo & Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white border border-amber-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20 overflow-hidden group hover:scale-105 transition-transform duration-300">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={`${settings?.company_name || 'Company'} Logo`} className="w-full h-full object-cover" />
              ) : (
                <Lock size={30} className="text-amber-400" />
              )}
            </div>

            <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-1">
              {settings?.company_name ? `${settings.company_name} Admin` : 'Admin Portal'}
            </h2>
            <p className="text-xs font-bold text-amber-400 tracking-widest uppercase">
              {settings?.company_subtitle || 'Management Portal'}
            </p>
          </div>

          {loginError && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl mb-5 text-center font-bold flex items-center justify-center gap-2">
              <AlertTriangle size={15} className="text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Username"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 font-semibold shadow-inner transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none">
                  <Lock size={16} />
                </div>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 font-semibold shadow-inner transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-amber-400 transition-colors p-1"
                  title={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group mt-2 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={17} className="text-black group-hover:scale-110 transition-transform" />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>
          </form>



          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            Secured Business Admin Dashboard
          </div>
        </div>
      </div>
    );
  }

  // 2. MAIN DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-amber-500 selection:text-black font-sans">
      {/* Header */}
      <header className="bg-[#09090b]/95 backdrop-blur-md text-white py-3 px-4 sm:px-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 sticky top-0 z-40">
        {/* First Line: Logo & Brand Name */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
            <img src={settings.logo_url || '/logo/sk-builders-logo.png'} alt={`${settings?.company_name || 'Admin'} Logo`} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black uppercase tracking-tight text-amber-400 whitespace-nowrap">
                {settings?.company_name ? `${settings.company_name} Admin` : 'Admin Portal'}
              </h1>
            </div>
            <p className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase truncate">
              {settings?.company_subtitle || 'Management Portal'}
            </p>
          </div>
        </div>

        {/* Second Line: Action Buttons (Admin Settings, Logout, Close) */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end border-t border-zinc-800/80 sm:border-t-0 pt-2 sm:pt-0">
          <button
            onClick={() => handleTabChange('settings')}
            className={`font-extrabold px-3 sm:px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border cursor-pointer flex-1 sm:flex-initial whitespace-nowrap ${activeTab === 'settings'
              ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
              : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 border-zinc-700/70'
              }`}
          >
            <Settings size={14} className="shrink-0" />
            <span>Admin Settings</span>
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-500/15 hover:bg-red-500/30 text-red-400 hover:text-white font-extrabold px-3 sm:px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-red-500/30 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <LogOut size={14} className="shrink-0" />
            <span>Logout</span>
          </button>

          <button
            onClick={handleCloseAdminTab}
            className="bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white font-extrabold px-2.5 sm:px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-all border border-zinc-700/70 cursor-pointer hover:border-zinc-500 shadow-sm shrink-0 whitespace-nowrap"
            title="Close Admin Tab"
            aria-label="Close Admin Tab"
          >
            <X size={15} className="text-zinc-400 hover:text-white shrink-0" />
            <span>Close</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
        {statusNotice && (
          <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs p-3.5 rounded-2xl shadow-lg flex items-center gap-2 animate-fadeIn backdrop-blur-md">
            <CheckCircle size={18} className="text-amber-400 shrink-0" /> {statusNotice}
          </div>
        )}

        {/* Tab Navigation (Horizontal X-Axis Scroll on Mobile, Full Grid on Desktop) */}
        <div className="flex xl:grid xl:grid-cols-9 w-full gap-2 pb-2.5 border-b border-zinc-800 overflow-x-auto scrollbar-none snap-x touch-pan-x -mx-1 px-1 xl:mx-0 xl:px-0">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <Layers size={14} /> },
            { id: 'properties', label: 'Properties', icon: <Building size={14} /> },
            { id: 'land', label: 'Land / Plots', icon: <MapPin size={14} /> },
            { id: 'projects', label: 'Projects', icon: <Home size={14} /> },
            { id: 'gallery', label: 'Gallery', icon: <ImageIcon size={14} /> },
            { id: 'feedbacks', label: 'Feedbacks', icon: <Star size={14} /> },
            { id: 'testimonials', label: 'Testimonials', icon: <Quote size={14} /> },
            { id: 'leads', label: 'Leads', icon: <Users size={14} /> },
            { id: 'videos', label: 'Video & Frames', icon: <Video size={14} /> }
          ].map((tab) => (

            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              title={tab.label}
              className={`shrink-0 xl:shrink xl:w-full px-3.5 xl:px-2 py-2.5 rounded-xl text-[11px] xl:text-xs font-black uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all text-center whitespace-nowrap snap-start cursor-pointer ${activeTab === tab.id
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20 font-extrabold'
                : 'bg-[#18181b] text-zinc-300 hover:text-white border border-zinc-800 hover:border-amber-500/40'
                }`}
            >
              <span className="shrink-0">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 0: DASHBOARD SUMMARY */}
        {activeTab === 'dashboard' && (
          isInitialLoading ? (
            <AdminLoadingSkeleton />
          ) : (
            <div className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
                <div className="bg-[#141417]/90 p-3 sm:p-4 rounded-2xl border border-zinc-800/80 hover:border-amber-500/30 shadow-md flex items-center justify-between backdrop-blur-md transition-all">
                  <div className="min-w-0 pr-1">
                    <div className="text-xl sm:text-2xl font-black text-white">{safeProperties.length}</div>
                    <div className="text-[10px] sm:text-[11px] font-extrabold text-zinc-400 uppercase mt-0.5 truncate">Total Properties</div>
                    <div className="text-[9.5px] sm:text-[10.5px] text-amber-400 font-bold mt-1 truncate">{availableHousesCount} Available Houses</div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Building size={18} />
                  </div>
                </div>

                <div className="bg-[#141417]/90 p-3 sm:p-4 rounded-2xl border border-zinc-800/80 hover:border-emerald-500/30 shadow-md flex items-center justify-between backdrop-blur-md transition-all">
                  <div className="min-w-0 pr-1">
                    <div className="text-xl sm:text-2xl font-black text-white">{safeLand.length}</div>
                    <div className="text-[10px] sm:text-[11px] font-extrabold text-zinc-400 uppercase mt-0.5 truncate">Total Land Plots</div>
                    <div className="text-[9.5px] sm:text-[10.5px] text-emerald-400 font-bold mt-1 truncate">{availableLandCount} Available Plots</div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                </div>

                <div className="bg-[#141417]/90 p-3 sm:p-4 rounded-2xl border border-zinc-800/80 hover:border-amber-500/30 shadow-md flex items-center justify-between backdrop-blur-md transition-all">
                  <div className="min-w-0 pr-1">
                    <div className="text-xl sm:text-2xl font-black text-white">{safeProjects.length}</div>
                    <div className="text-[10px] sm:text-[11px] font-extrabold text-zinc-400 uppercase mt-0.5 truncate">Total Projects</div>
                    <div className="text-[9px] sm:text-[10px] text-amber-300 font-bold mt-1 leading-tight">
                      <div className="truncate">{completedProjectsCount} Comp • {ongoingProjectsCount} Ong</div>
                      <div className="truncate">{startedProjectsCount} Started</div>
                    </div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Home size={18} />
                  </div>
                </div>

                <div className="bg-[#141417]/90 p-3 sm:p-4 rounded-2xl border border-zinc-800/80 hover:border-amber-500/30 shadow-md flex items-center justify-between backdrop-blur-md transition-all">
                  <div className="min-w-0 pr-1">
                    <div className="text-xl sm:text-2xl font-black text-white">{safeLeads.length}</div>
                    <div className="text-[10px] sm:text-[11px] font-extrabold text-zinc-400 uppercase mt-0.5 truncate">Customer Leads</div>
                    <div className="text-[9.5px] sm:text-[10.5px] text-zinc-400 font-bold mt-1 truncate">{soldCount} Sold</div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Users size={18} />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-[#141417]/90 p-3 sm:p-4 rounded-2xl border border-zinc-800/80 hover:border-amber-500/30 shadow-md flex items-center justify-between backdrop-blur-md transition-all">
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-white">{safeFeedbacks.length}</div>
                    <div className="text-[10px] sm:text-[11px] font-extrabold text-zinc-400 uppercase mt-0.5">Client Feedbacks</div>
                    <div className="text-[9.5px] sm:text-[10.5px] text-amber-400 font-bold mt-1">
                      ★ {safeFeedbacks.length > 0 ? (safeFeedbacks.reduce((a, b) => a + (b.rating || 5), 0) / safeFeedbacks.length).toFixed(1) : '5.0'} / 5.0 Rating
                    </div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Star size={18} />
                  </div>
                </div>
              </div>


            {/* Quick Actions Bar - Column on Mobile, Row on Desktop */}
            <div className="bg-[#141417]/90 border border-amber-500/30 text-white p-3.5 sm:p-4 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold uppercase text-amber-400">Quick Management Actions</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Add or manage real business information for your business showcase.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:items-center gap-2 w-full md:w-auto shrink-0 py-0.5">
                <button
                  type="button"
                  onClick={openCreateProperty}
                  className="w-full sm:w-auto justify-center shrink-0 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-3 sm:px-3.5 py-2.5 sm:py-2 rounded-xl text-[11px] sm:text-xs uppercase flex items-center gap-1.5 shadow-md border border-amber-300/40 cursor-pointer whitespace-nowrap active:scale-95 transition-all"
                >
                  <Plus size={14} /> Add House Property
                </button>

                <button
                  type="button"
                  onClick={openCreateLand}
                  className="w-full sm:w-auto justify-center shrink-0 bg-zinc-800/90 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 font-extrabold px-3 sm:px-3.5 py-2.5 sm:py-2 rounded-xl text-[11px] sm:text-xs uppercase flex items-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap active:scale-95 transition-all"
                >
                  <Plus size={14} /> Add Land Plot
                </button>

                <button
                  type="button"
                  onClick={openCreateProject}
                  className="w-full sm:w-auto justify-center shrink-0 bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/30 text-white font-extrabold px-3 sm:px-3.5 py-2.5 sm:py-2 rounded-xl text-[11px] sm:text-xs uppercase flex items-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap active:scale-95 transition-all"
                >
                  <Plus size={14} /> Add Construction Project
                </button>
              </div>
            </div>

            {/* SERVICES MANAGEMENT SECTION */}
            <div className="bg-[#18181b]/80 border border-zinc-800/80 p-4 sm:p-5 rounded-2xl shadow-md space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold uppercase text-amber-400 flex items-center gap-2">
                    <Building size={16} className="text-amber-400" /> Services Management ({services.length})
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Manage service offerings. Drag cards to reorder display on website.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreateService}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-3.5 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md border border-amber-300/40 cursor-pointer"
                >
                  <Plus size={14} /> Add Service
                </button>
              </div>

              {services.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500 font-medium">
                  No services configured in database. Click "Add Service" above to add one.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                  {services.map((srv, idx) => {
                    const isBeingDragged = draggedSrvIdx === idx;
                    const isOver = dragOverSrvIdx === idx;

                    return (
                      <div
                        key={srv.id}
                        draggable
                        onDragStart={(e) => handleSrvDragStart(e, idx)}
                        onDragOver={(e) => handleSrvDragOver(e, idx)}
                        onDragLeave={(e) => handleSrvDragLeave(e, idx)}
                        onDrop={(e) => handleSrvDrop(e, idx)}
                        className={`bg-[#09090b] border p-2.5 sm:p-3.5 rounded-xl flex flex-col justify-between transition-all group shadow-sm cursor-grab active:cursor-grabbing ${
                          isBeingDragged
                            ? 'opacity-40 border-amber-500 scale-95'
                            : isOver
                            ? 'border-amber-400 ring-2 ring-amber-400/40 z-10'
                            : 'border-zinc-800/80 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                              {renderIconByName(srv.icon_name, 14)}
                            </div>
                            <span className="text-[9.5px] sm:text-[10px] font-black uppercase text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 sm:px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                              <GripVertical size={11} className="text-zinc-500" /> #{idx + 1}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-extrabold text-[11px] sm:text-xs text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                              {srv.title}
                            </h4>
                            <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-snug">
                              {srv.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-2 mt-2 border-t border-zinc-900">
                          <button
                            type="button"
                            onClick={() => openEditService(srv)}
                            className="bg-zinc-800/80 hover:bg-zinc-700 text-amber-400 font-bold px-2 py-1 rounded-md text-[10px] sm:text-[11px] uppercase flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Edit3 size={11} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteService(srv)}
                            className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                            title="Delete Service"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* STATS & MILESTONES MANAGEMENT SECTION */}
            <div className="bg-[#18181b]/80 border border-zinc-800/80 p-4 sm:p-5 rounded-2xl shadow-md space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold uppercase text-amber-400 flex items-center gap-2">
                    <BarChart2 size={16} className="text-amber-400" /> Milestones & Stats Counter ({stats.length})
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Manage key numerical achievements displayed on the site counter bar. Drag cards to reorder.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreateStat}
                  className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 font-extrabold px-3.5 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus size={14} /> Add Stat
                </button>
              </div>

              {stats.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500 font-medium">
                  No stats configured in database. Click "Add Stat" above to add one.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  {stats.map((st, idx) => {
                    const isBeingDragged = draggedStatIdx === idx;
                    const isOver = dragOverStatIdx === idx;

                    return (
                      <div
                        key={st.id}
                        draggable
                        onDragStart={(e) => handleStatDragStart(e, idx)}
                        onDragOver={(e) => handleStatDragOver(e, idx)}
                        onDragLeave={(e) => handleStatDragLeave(e, idx)}
                        onDrop={(e) => handleStatDrop(e, idx)}
                        className={`bg-[#09090b] border p-3.5 rounded-xl flex flex-col justify-between transition-all group shadow-sm cursor-grab active:cursor-grabbing ${
                          isBeingDragged
                            ? 'opacity-40 border-amber-500 scale-95'
                            : isOver
                            ? 'border-amber-400 ring-2 ring-amber-400/40 z-10'
                            : 'border-zinc-800/80 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                              {renderIconByName(st.icon_name, 16)}
                            </div>
                            <span className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                              <GripVertical size={12} className="text-zinc-500" /> #{idx + 1}
                            </span>
                          </div>
                          <div className="pt-1">
                            <div className="text-xl font-black text-amber-400 tracking-tight">
                              {st.value}
                            </div>
                            <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mt-0.5">
                              {st.label}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-2 mt-2 border-t border-zinc-900">
                          <button
                            type="button"
                            onClick={() => openEditStat(st)}
                            className="bg-zinc-800/80 hover:bg-zinc-700 text-amber-400 font-bold px-2.5 py-1 rounded-md text-[11px] uppercase flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteStat(st)}
                            className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                            title="Delete Stat"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )
      )}

        {/* TAB 1: PROPERTIES (HOUSES / BUILDINGS) */}
        {activeTab === 'properties' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-base font-extrabold uppercase text-amber-400">Houses & Buildings ({filteredProperties.length})</h2>
                <p className="text-xs text-zinc-400">Properties appear on the public site under "Houses for Sale".</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search property title or location..."
                  value={propSearch}
                  onChange={(e) => setPropSearch(e.target.value)}
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2 text-xs w-64 text-white focus:border-amber-500 focus:outline-none"
                />

                {filteredProperties.length > 0 && (
                  <button
                    onClick={openCreateProperty}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                  >
                    <Plus size={15} /> Add New Property
                  </button>
                )}
              </div>
            </div>

            {/* List / Empty State */}
            {isInitialLoading ? (
              <AdminLoadingSkeleton />
            ) : filteredProperties.length === 0 ? (
              <div className="bg-[#18181b]/90 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Building size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">No House Properties Added</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    No house property records found. Click below to add your first house property to display on the website.
                  </p>
                </div>
                <button
                  onClick={openCreateProperty}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} /> Add First Property
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active Uploading Property Card with Pie Progress */}
                {activeUploadTask && activeUploadTask.section === 'properties' && !activeUploadTask.itemId && (
                  <div className="bg-[#18181b] rounded-2xl p-4 border border-amber-500/60 shadow-xl shadow-amber-500/10 flex items-center justify-between gap-4 relative overflow-hidden ring-1 ring-amber-500/30">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/80 shrink-0 border border-amber-500/40 relative flex items-center justify-center">
                        {activeUploadTask.currentThumbnail ? (
                          <img src={activeUploadTask.currentThumbnail} alt="Uploading property thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <Home size={28} className="text-amber-400 animate-pulse" />
                        )}
                        <span className={`absolute top-1 left-1 text-[8px] font-black px-1.5 py-0.5 rounded shadow ${
                          activeUploadTask.status === 'completed' ? 'bg-emerald-500 text-black' : 'bg-amber-500 text-black animate-pulse'
                        }`}>
                          {activeUploadTask.status === 'completed' ? 'SAVED' : 'SAVING'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-xs sm:text-sm font-extrabold text-white truncate">
                          {activeUploadTask.title || 'Saving Property...'}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-medium truncate">
                          {activeUploadTask.currentFilename || 'Saving property photos and specs...'}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 pl-2">
                      <CardPieProgress
                        pct={activeUploadTask.pct}
                        status={activeUploadTask.status}
                        total={activeUploadTask.total}
                        current={activeUploadTask.current}
                        message={activeUploadTask.message}
                        showLabel={true}
                      />
                    </div>
                  </div>
                )}

                {filteredProperties.map((p) => {
                  const isItemUpdating = activeUploadTask && activeUploadTask.section === 'properties' && activeUploadTask.itemId === p.id;

                  return (
                    <div
                      key={p.id}
                      onClick={() => openEditProperty(p)}
                      className="bg-[#18181b]/90 p-4 rounded-2xl border border-zinc-800 shadow-sm hover:border-amber-500/40 transition-all cursor-pointer grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:items-center gap-4 group relative"
                    >
                      {/* Left: Image & Detailed Info */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/60 border border-zinc-800 shrink-0 relative flex items-center justify-center">
                          {p.image && p.image !== '/house/completed-house.jpg' && !p.image.includes('logo') ? (
                            <>
                              <img
                                src={p.image}
                                alt=""
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback-icon');
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="img-fallback-icon w-full h-full bg-[#18181b] hidden items-center justify-center text-amber-400">
                                <Home size={28} className="text-amber-400" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-[#18181b] flex items-center justify-center text-amber-400">
                              <Home size={28} className="text-amber-400" />
                            </div>
                          )}
                          {p.bedrooms ? (
                            <span className="absolute bottom-1 left-1 bg-black/80 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-500/30">
                              {p.bedrooms.toString().includes('BHK') ? p.bedrooms : `${p.bedrooms} BHK`}
                            </span>
                          ) : null}
                        </div>

                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold text-zinc-300 bg-zinc-800/90 px-2 py-0.5 rounded-md border border-zinc-700/50">
                            {p.type || 'Individual House'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${p.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                            {p.status || 'Available'}
                          </span>
                          {p.bedrooms && (
                            <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                              {p.bedrooms.toString().includes('BHK') ? p.bedrooms : `${p.bedrooms} BHK`}
                            </span>
                          )}
                          {p.facing && (
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                              {p.facing} Facing
                            </span>
                          )}
                        </div>

                        <h3 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                          {p.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold flex-wrap">
                          <span className="flex items-center gap-1 text-zinc-300">
                            <MapPin size={13} className="text-amber-400 shrink-0" /> {p.location || p.area}
                          </span>
                          {p.builtup_area && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>Builtup: {p.builtup_area} {p.builtup_area_unit || 'sq.ft'}</span>
                            </>
                          )}
                          {p.plot_area && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>Plot: {p.plot_area} {p.plot_area_unit || 'sq.ft'}</span>
                            </>
                          )}
                          {p.road_width && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>{p.road_width} {p.road_width_unit || 'ft'} Road</span>
                            </>
                          )}
                          {p.updated_at && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span className="text-[11px] text-zinc-500">Updated: {formatLastUpdated(p.updated_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center: Price Detail Container (Strict 50% Horizontal Center) */}
                    <div className="flex flex-col items-center justify-center justify-self-start md:justify-self-center px-5 py-2.5 bg-[#09090b]/90 border border-zinc-800/90 rounded-xl text-center min-w-[150px] shadow-inner">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">PRICE</span>
                      <span className="text-base font-black text-amber-400 leading-tight">{p.price || 'Price on Request'}</span>
                      {p.negotiable === 'Yes' && (
                        <span className="text-[9px] font-bold text-emerald-400/90 uppercase tracking-tight mt-0.5">Negotiable</span>
                      )}
                    </div>

                    {/* Right: Toggle Controls */}
                    <div className="flex items-center justify-between md:justify-end md:justify-self-end gap-3 shrink-0 border-t border-zinc-800 md:border-t-0 pt-3 md:pt-0" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-center" title="Published: Visible on public website">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Published</span>
                        <button
                          onClick={() => togglePropertyStatus(p.id, 'published', p.published)}
                          className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${p.published ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${p.published ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex flex-col items-center" title="Featured: Highlighted on homepage showcases">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Featured</span>
                        <button
                          onClick={() => togglePropertyStatus(p.id, 'featured', p.featured)}
                          className={`p-1.5 rounded-lg transition-colors ${p.featured ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          <Star size={16} fill={p.featured ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      {isItemUpdating && (
                        <div className="shrink-0 mr-1">
                          <CardPieProgress
                            pct={activeUploadTask.pct}
                            status={activeUploadTask.status}
                            message={activeUploadTask.message}
                            showLabel={true}
                          />
                        </div>
                      )}

                      <button
                        onClick={() => requestDeleteProperty(p.id, p.title)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all ml-1 cursor-pointer"
                        title="Delete Property"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LAND (RESIDENTIAL PLOTS / LAND) */}
        {activeTab === 'land' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-base font-extrabold uppercase text-amber-400">Land & Residential Plots ({filteredLand.length})</h2>
                <p className="text-xs text-zinc-400">Land entries appear on public site under "Lands for Sale".</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search land title or location..."
                  value={landSearch}
                  onChange={(e) => setLandSearch(e.target.value)}
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2 text-xs w-64 text-white focus:border-amber-500 focus:outline-none"
                />

                {filteredLand.length > 0 && (
                  <button
                    onClick={openCreateLand}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                  >
                    <Plus size={15} /> Add New Land Plot
                  </button>
                )}
              </div>
            </div>

            {/* List / Empty State */}
            {isInitialLoading ? (
              <AdminLoadingSkeleton />
            ) : filteredLand.length === 0 ? (
              <div className="bg-[#18181b]/90 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <MapPin size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">No Land Plots Added</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    No land plot records exist in the database. Click below to add your first land plot.
                  </p>
                </div>
                <button
                  onClick={openCreateLand}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} /> Add First Land Plot
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active Uploading Land Card with Pie Progress */}
                {activeUploadTask && activeUploadTask.section === 'land' && !activeUploadTask.itemId && (
                  <div className="bg-[#18181b] rounded-2xl p-4 border border-amber-500/60 shadow-xl shadow-amber-500/10 flex items-center justify-between gap-4 relative overflow-hidden ring-1 ring-amber-500/30">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/80 shrink-0 border border-amber-500/40 relative flex items-center justify-center">
                        {activeUploadTask.currentThumbnail ? (
                          <img src={activeUploadTask.currentThumbnail} alt="Uploading land thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <MapPin size={28} className="text-amber-400 animate-pulse" />
                        )}
                        <span className={`absolute top-1 left-1 text-[8px] font-black px-1.5 py-0.5 rounded shadow ${
                          activeUploadTask.status === 'completed' ? 'bg-emerald-500 text-black' : 'bg-amber-500 text-black animate-pulse'
                        }`}>
                          {activeUploadTask.status === 'completed' ? 'SAVED' : 'SAVING'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-xs sm:text-sm font-extrabold text-white truncate">
                          {activeUploadTask.title || 'Saving Land Plot...'}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-medium truncate">
                          {activeUploadTask.currentFilename || 'Saving land photos and specs...'}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 pl-2">
                      <CardPieProgress
                        pct={activeUploadTask.pct}
                        status={activeUploadTask.status}
                        total={activeUploadTask.total}
                        current={activeUploadTask.current}
                        message={activeUploadTask.message}
                        showLabel={true}
                      />
                    </div>
                  </div>
                )}

                {filteredLand.map((l) => {
                  const isItemUpdating = activeUploadTask && activeUploadTask.section === 'land' && activeUploadTask.itemId === l.id;

                  return (
                    <div
                      key={l.id}
                      onClick={() => openEditLand(l)}
                      className="bg-[#18181b]/90 p-4 rounded-2xl border border-zinc-800 shadow-sm hover:border-amber-500/40 transition-all cursor-pointer grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:items-center gap-4 group relative"
                    >
                      {/* Left: Image & Detailed Land Info */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/60 border border-zinc-800 shrink-0 relative flex items-center justify-center">
                          {l.image && l.image !== '/house/completed-house.jpg' && !l.image.includes('logo') ? (
                            <>
                              <img
                                src={l.image}
                                alt=""
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback-icon');
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="img-fallback-icon w-full h-full bg-[#18181b] hidden items-center justify-center text-emerald-400">
                                <MapPin size={28} className="text-emerald-400" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-[#18181b] flex items-center justify-center text-emerald-400">
                              <MapPin size={28} className="text-emerald-400" />
                            </div>
                          )}
                        </div>

                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold text-zinc-300 bg-zinc-800/90 px-2 py-0.5 rounded-md border border-zinc-700/50">
                            {l.land_type || 'Residential Plot'}
                          </span>
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                            {l.approval_status || 'DTCP Approved'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${l.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                            {l.status || 'Available'}
                          </span>
                          {l.facing && (
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                              {l.facing} Facing
                            </span>
                          )}
                          {l.corner_plot === 'Yes' && (
                            <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                              Corner Plot
                            </span>
                          )}
                        </div>

                        <h3 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                          {l.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold flex-wrap">
                          <span className="flex items-center gap-1 text-zinc-300">
                            <MapPin size={13} className="text-amber-400 shrink-0" /> {l.location || l.area}
                          </span>
                          {l.plot_area && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>Area: {l.plot_area} {l.plot_area_unit || 'sq.ft'}</span>
                            </>
                          )}
                          {(l.frontage || (l.length && l.width)) && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>Dim: {l.frontage || `${l.length}x${l.width} ft`}</span>
                            </>
                          )}
                          {l.road_width && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>{l.road_width} {l.road_width_unit || 'ft'} Road</span>
                            </>
                          )}
                          {l.updated_at && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span className="text-[11px] text-zinc-500">Updated: {formatLastUpdated(l.updated_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center: Total Price Container (Strict 50% Horizontal Center) */}
                    <div className="flex flex-col items-center justify-center justify-self-start md:justify-self-center px-5 py-2.5 bg-[#09090b]/90 border border-zinc-800/90 rounded-xl text-center min-w-[150px] shadow-inner">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">TOTAL PRICE</span>
                      <span className="text-base font-black text-amber-400 leading-tight">{l.total_price || l.price || 'Price on Request'}</span>
                      {l.negotiable === 'Yes' && (
                        <span className="text-[9px] font-bold text-emerald-400/90 uppercase tracking-tight mt-0.5">Negotiable</span>
                      )}
                    </div>

                    {/* Right: Toggle Controls */}
                    <div className="flex items-center justify-between md:justify-end md:justify-self-end gap-3 shrink-0 border-t border-zinc-800 md:border-t-0 pt-3 md:pt-0" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-center" title="Published: Visible on public website">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Published</span>
                        <button
                          onClick={() => toggleLandStatus(l.id, 'published', l.published)}
                          className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${l.published ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${l.published ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex flex-col items-center" title="Featured: Highlighted on homepage showcases">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Featured</span>
                        <button
                          onClick={() => toggleLandStatus(l.id, 'featured', l.featured)}
                          className={`p-1.5 rounded-lg transition-colors ${l.featured ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          <Star size={16} fill={l.featured ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      {isItemUpdating && (
                        <div className="shrink-0 mr-1">
                          <CardPieProgress
                            pct={activeUploadTask.pct}
                            status={activeUploadTask.status}
                            message={activeUploadTask.message}
                            showLabel={true}
                          />
                        </div>
                      )}

                      <button
                        onClick={() => requestDeleteLand(l.id, l.title)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all ml-1 cursor-pointer"
                        title="Delete Land"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROJECTS (CONSTRUCTION PROJECTS) */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-base font-extrabold uppercase text-amber-400">Construction Projects ({filteredProjects.length})</h2>
                <p className="text-xs text-zinc-400">Projects appear on the public site under "Projects".</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search project name or location..."
                  value={projSearch}
                  onChange={(e) => setProjSearch(e.target.value)}
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2 text-xs w-64 text-white focus:border-amber-500 focus:outline-none"
                />

                {filteredProjects.length > 0 && (
                  <button
                    onClick={openCreateProject}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                  >
                    <Plus size={15} /> Add New Project
                  </button>
                )}
              </div>
            </div>

            {/* List / Empty State */}
            {isInitialLoading ? (
              <AdminLoadingSkeleton />
            ) : filteredProjects.length === 0 ? (
              <div className="bg-[#18181b]/90 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Home size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">No Construction Projects Added</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    No construction projects exist in the database. Add your first construction project to showcase your work.
                  </p>
                </div>
                <button
                  onClick={openCreateProject}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} /> Add First Project
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active Uploading Project Card with Pie Progress */}
                {activeUploadTask && activeUploadTask.section === 'projects' && !activeUploadTask.itemId && (
                  <div className="bg-[#18181b] rounded-2xl p-4 border border-amber-500/60 shadow-xl shadow-amber-500/10 flex items-center justify-between gap-4 relative overflow-hidden ring-1 ring-amber-500/30">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/80 shrink-0 border border-amber-500/40 relative flex items-center justify-center">
                        {activeUploadTask.currentThumbnail ? (
                          <img src={activeUploadTask.currentThumbnail} alt="Uploading project thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <Home size={28} className="text-amber-400 animate-pulse" />
                        )}
                        <span className={`absolute top-1 left-1 text-[8px] font-black px-1.5 py-0.5 rounded shadow ${
                          activeUploadTask.status === 'completed' ? 'bg-emerald-500 text-black' : 'bg-amber-500 text-black animate-pulse'
                        }`}>
                          {activeUploadTask.status === 'completed' ? 'SAVED' : 'SAVING'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-xs sm:text-sm font-extrabold text-white truncate">
                          {activeUploadTask.title || 'Saving Project...'}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-medium truncate">
                          {activeUploadTask.currentFilename || 'Saving project images and specs...'}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 pl-2">
                      <CardPieProgress
                        pct={activeUploadTask.pct}
                        status={activeUploadTask.status}
                        total={activeUploadTask.total}
                        current={activeUploadTask.current}
                        message={activeUploadTask.message}
                        showLabel={true}
                      />
                    </div>
                  </div>
                )}

                {filteredProjects.map((pr) => {
                  const isItemUpdating = activeUploadTask && activeUploadTask.section === 'projects' && activeUploadTask.itemId === pr.id;

                  return (
                  <div
                    key={pr.id}
                    onClick={() => openEditProject(pr)}
                    className="bg-[#18181b]/90 p-4 rounded-2xl border border-zinc-800 shadow-sm hover:border-amber-500/40 transition-all cursor-pointer grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:items-center gap-4 group relative"
                  >
                    {/* Left: Cover Image & Project Details */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/60 border border-zinc-800 shrink-0 relative flex items-center justify-center">
                        {(pr.cover_image || pr.image) && (pr.cover_image || pr.image) !== '/house/completed-house.jpg' && !(pr.cover_image || pr.image).includes('logo') ? (
                          <>
                            <img
                              src={pr.cover_image || pr.image}
                              alt=""
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback-icon');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="img-fallback-icon w-full h-full bg-[#18181b] hidden items-center justify-center text-amber-400">
                              <Home size={28} className="text-amber-400" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-[#18181b] flex items-center justify-center text-amber-400">
                            <Home size={28} className="text-amber-400" />
                          </div>
                        )}
                        {pr.bedrooms ? (
                          <span className="absolute bottom-1 left-1 bg-black/80 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-500/30">
                            {pr.bedrooms.toString().includes('BHK') ? pr.bedrooms : `${pr.bedrooms} BHK`}
                          </span>
                        ) : null}
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold text-zinc-300 bg-zinc-800/90 px-2 py-0.5 rounded-md border border-zinc-700/50">
                            {pr.project_type || 'Individual House'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${pr.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                            {pr.status || 'Completed'}
                          </span>
                          {pr.bedrooms && (
                            <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                              {pr.bedrooms.toString().includes('BHK') ? pr.bedrooms : `${pr.bedrooms} BHK`}
                            </span>
                          )}
                          {pr.floors && (
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                              {pr.floors} {Number(pr.floors) === 1 ? 'Floor' : 'Floors'}
                            </span>
                          )}
                        </div>

                        <h3 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                          {pr.name || pr.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold flex-wrap">
                          <span className="flex items-center gap-1 text-zinc-300">
                            <MapPin size={13} className="text-amber-400 shrink-0" /> {pr.location || pr.area || 'Poonamallee'}
                          </span>
                          {pr.builtup_area && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>Builtup: {pr.builtup_area} {pr.builtup_area_unit || 'sq.ft'}</span>
                            </>
                          )}
                          {pr.plot_area && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>Plot: {pr.plot_area} {pr.plot_area_unit || 'sq.ft'}</span>
                            </>
                          )}
                          {(pr.completion_date || pr.actual_completion_date) && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>Year: {pr.completion_date || pr.actual_completion_date}</span>
                            </>
                          )}
                          <span className="text-zinc-600">•</span>
                          <span className="text-[11px] text-zinc-500">Updated: {formatLastUpdated(pr.updated_at)}</span>
                        </div>

                        <p className="text-[11px] text-zinc-400 line-clamp-1 leading-snug">
                          {pr.overview || pr.description || 'Full structural construction, brickwork, plastering & premium turnkey handover.'}
                        </p>
                      </div>
                    </div>

                    {/* Center: Project Status & Delivery Container (Strict 50% Horizontal Center, matching Properties & Land) */}
                    <div className="flex flex-col items-center justify-center justify-self-start md:justify-self-center px-5 py-2.5 bg-[#09090b]/90 border border-zinc-800/90 rounded-xl text-center min-w-[150px] shadow-inner">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">PROJECT STATUS</span>
                      <span className="text-base font-black text-amber-400 leading-tight">{pr.status || 'Completed'}</span>
                      <span className="text-[9px] font-bold text-emerald-400/90 uppercase tracking-tight mt-0.5">
                        {pr.completion_date || pr.actual_completion_date || 'Turnkey Handover'}
                      </span>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex items-center justify-between md:justify-end md:justify-self-end gap-3 shrink-0 border-t border-zinc-800 md:border-t-0 pt-3 md:pt-0" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-center" title="Published: Visible on public website">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Published</span>
                        <button
                          onClick={() => toggleProjectStatus(pr.id, 'published', pr.published)}
                          className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${pr.published ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${pr.published ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex flex-col items-center" title="Featured: Highlighted on homepage showcases">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Featured</span>
                        <button
                          onClick={() => toggleProjectStatus(pr.id, 'featured', pr.featured)}
                          className={`p-1.5 rounded-lg transition-colors ${pr.featured ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          <Star size={16} fill={pr.featured ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      {isItemUpdating && (
                        <div className="shrink-0 mr-1">
                          <CardPieProgress
                            pct={activeUploadTask.pct}
                            status={activeUploadTask.status}
                            message={activeUploadTask.message}
                            showLabel={true}
                          />
                        </div>
                      )}

                      <button
                        onClick={() => requestDeleteProject(pr.id, pr.name || pr.title)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all ml-1 cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold uppercase text-amber-400">Gallery Photos ({safeGallery.length})</h2>
                <p className="text-xs text-zinc-400">Showcase photos of completed individual house construction.</p>
              </div>

              {safeGallery.length > 0 && (
                <button
                  onClick={() => {
                    setFormGal({ id: null, image: '' });
                    setGalleryFilesList([]);
                    setModalType('gallery_form');
                  }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                >
                  <Plus size={15} /> Upload Gallery Photos
                </button>
              )}
            </div>

            {isInitialLoading ? (
              <AdminLoadingSkeleton />
            ) : safeGallery.length === 0 ? (
              <div className="bg-[#18181b]/90 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ImageIcon size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">No Gallery Photos Added</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    Your photo gallery is currently empty. Upload photos of completed house projects and site work.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFormGal({ id: null, image: '' });
                    setGalleryFilesList([]);
                    setModalType('gallery_form');
                  }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} /> Upload First Gallery Photos
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active Uploading Gallery Card with Pie Progress */}
                {activeUploadTask && activeUploadTask.section === 'gallery' && !activeUploadTask.itemId && (
                  <div className="bg-[#18181b] rounded-2xl p-3 sm:p-4 border border-amber-500/60 shadow-xl shadow-amber-500/10 flex items-center justify-between gap-4 relative overflow-hidden ring-1 ring-amber-500/30">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-24 sm:w-36 h-16 sm:h-20 rounded-xl overflow-hidden bg-black/80 shrink-0 border border-amber-500/40 relative flex items-center justify-center">
                        {activeUploadTask.currentThumbnail ? (
                          <img src={activeUploadTask.currentThumbnail} alt="Uploading thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={24} className="text-amber-400 animate-pulse" />
                        )}
                        <span className={`absolute top-1 left-1 text-[8px] font-black px-1.5 py-0.5 rounded shadow ${
                          activeUploadTask.status === 'completed' ? 'bg-emerald-500 text-black' : 'bg-amber-500 text-black animate-pulse'
                        }`}>
                          {activeUploadTask.status === 'completed' ? 'SAVED' : 'SAVING'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center gap-2">
                          <span className="truncate">{activeUploadTask.currentFilename || 'Uploading Photos...'}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-medium truncate">
                          {activeUploadTask.total > 1 ? `Photo ${activeUploadTask.current} of ${activeUploadTask.total}` : 'Uploading photo in background...'}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 pl-2">
                      <CardPieProgress
                        pct={activeUploadTask.pct}
                        status={activeUploadTask.status}
                        total={activeUploadTask.total}
                        current={activeUploadTask.current}
                        message={activeUploadTask.message}
                        showLabel={true}
                      />
                    </div>
                  </div>
                )}

                {safeGallery.map((g, idx) => {
                  const isItemUpdating = activeUploadTask && activeUploadTask.section === 'gallery' && activeUploadTask.itemId === g.id;
                  return (
                    <div
                      key={g.id}
                      onClick={() => {
                        setFormGal({ id: g.id, image: g.image });
                        setModalType('gallery_form');
                      }}
                      className="bg-[#18181b] hover:bg-[#202025] rounded-2xl p-3 sm:p-4 border border-zinc-800 hover:border-amber-500/50 transition-all cursor-pointer flex items-center justify-between gap-4 group shadow-md relative"
                    >
                      {/* Left: Thumbnail & Image Info */}
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-24 sm:w-36 h-16 sm:h-20 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-zinc-800 group-hover:border-amber-500/30 transition-colors relative">
                          <img src={g.image} alt="Gallery photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          {isItemUpdating && (
                            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-1">
                              <CardPieProgress
                                pct={activeUploadTask.pct}
                                status={activeUploadTask.status}
                                showLabel={false}
                                size={36}
                              />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-extrabold text-white group-hover:text-amber-400 transition-colors truncate">
                            {g.image ? g.image.split('/').pop() : `Gallery Photo #${g.id}`}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">
                            {g.image}
                          </div>
                        </div>
                      </div>

                      {/* Center/Right: On-card pie progress during updates */}
                      {isItemUpdating && (
                        <div className="shrink-0 mr-2">
                          <CardPieProgress
                            pct={activeUploadTask.pct}
                            status={activeUploadTask.status}
                            message={activeUploadTask.message}
                            showLabel={true}
                          />
                        </div>
                      )}

                      {/* Right: Delete Action Button */}
                      <div className="flex items-center shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            requestDeleteGallery(g.id);
                          }}
                          className="p-2.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 transition-all"
                          title="Delete Photo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TESTIMONIALS */}
        {activeTab === 'testimonials' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-base font-extrabold uppercase text-amber-400">Client Testimonials ({filteredTestimonials.length})</h2>
                <p className="text-xs text-zinc-400">Manage client reviews displayed under the "What Our Clients Say" section on the home page.</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2 text-xs w-56 text-white focus:border-amber-500 focus:outline-none"
                />
                <button
                  onClick={openCreateTestimonial}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                >
                  <Plus size={15} /> Add Testimonial
                </button>
              </div>
            </div>

            {isInitialLoading ? (
              <AdminLoadingSkeleton />
            ) : filteredTestimonials.length === 0 ? (
              <div className="bg-[#18181b]/90 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Quote size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">No Testimonials Added</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    Add client reviews and testimonials to showcase client trust on the website.
                  </p>
                </div>
                <button
                  onClick={openCreateTestimonial}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} /> Add First Testimonial
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTestimonials.map((t) => (
                  <div
                    key={t.id}
                    className="bg-[#18181b] hover:bg-[#202025] rounded-2xl p-5 border border-zinc-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-4 shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white">{t.client_name}</span>
                          {t.location && (
                            <span className="text-[11px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                              {t.location}
                            </span>
                          )}
                        </div>
                        <span className="text-amber-400 text-xs tracking-widest font-black">
                          {'★'.repeat(Math.min(5, Math.max(1, t.rating || 5)))}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 italic leading-relaxed">
                        "{t.quote}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {t.created_at ? `Added: ${formatLastUpdated(t.created_at)}` : ''}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditTestimonial(t)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => requestDeleteTestimonial(t.id, t.client_name)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Delete Testimonial"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: FEEDBACKS (CLIENT FEEDBACKS PORTAL) */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-base font-extrabold uppercase text-amber-400 flex items-center gap-2">
                  <Star size={18} className="text-amber-400" /> Client Feedbacks & Reviews ({filteredFeedbacks.length})
                </h2>
                <p className="text-xs text-zinc-400">
                  Reviews and feedback submitted by clients via the public feedback page (/feedback).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search feedbacks..."
                  value={feedSearch}
                  onChange={(e) => setFeedSearch(e.target.value)}
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2 text-xs w-56 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {isInitialLoading ? (
              <AdminLoadingSkeleton />
            ) : filteredFeedbacks.length === 0 ? (
              <div className="bg-[#18181b]/90 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Star size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">No Client Feedbacks Yet</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    When clients submit reviews on the Feedback portal, they will appear here with ratings and options to publish/hide.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#121216] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl w-full">
                <div className="max-h-[520px] overflow-y-auto overflow-x-auto w-full">
                  <table className="w-full min-w-[980px] text-left border-collapse table-fixed">
                    <thead className="sticky top-0 z-20 bg-[#18181b] border-b border-zinc-800 shadow-sm">
                      <tr className="text-[10.5px] font-extrabold uppercase tracking-wider text-zinc-400 select-none">
                        <th className="py-3 px-3 w-[15%]">Client & Location</th>
                        <th className="py-3 px-2 w-[14%]">Service</th>
                        <th className="py-3 px-2 w-[9%]">Rating</th>
                        <th className="py-3 px-3 w-[23%]">Review / Message</th>
                        <th className="py-3 px-2 w-[13%]">Contact</th>
                        <th className="py-3 px-2 text-center w-[9%]">Status</th>
                        <th className="py-3 px-2 text-center w-[12%]">Date</th>
                        <th className="py-3 px-2 text-center w-[5%]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-xs">
                      {filteredFeedbacks.map((f) => (
                        <tr
                          key={f.id}
                          className="hover:bg-zinc-800/30 transition-colors group"
                        >
                          {/* Client & Location */}
                          <td className="py-2.5 px-3 align-middle">
                            <div className="font-extrabold text-white text-xs truncate" title={f.client_name}>
                              {f.client_name}
                            </div>
                            {f.location ? (
                              <div className="mt-0.5 inline-flex items-center gap-0.5 text-[9.5px] font-bold text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 truncate max-w-full">
                                <MapPin size={9} className="text-amber-400 shrink-0" />
                                <span className="truncate">{f.location}</span>
                              </div>
                            ) : null}
                          </td>

                          {/* Service */}
                          <td className="py-2.5 px-2 align-middle">
                            {f.service ? (
                              <span className="text-[9px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider inline-block leading-tight">
                                {f.service}
                              </span>
                            ) : (
                              <span className="text-zinc-600 text-[11px]">—</span>
                            )}
                          </td>

                          {/* Rating */}
                          <td className="py-2.5 px-2 align-middle">
                            <div className="inline-flex items-center gap-0.5 text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-lg border border-amber-500/30 font-black text-xs">
                              <span>{'★'.repeat(Math.min(5, Math.max(1, f.rating || 5)))}</span>
                              <span className="text-[9.5px] text-zinc-300 ml-0.5">({f.rating || 5}/5)</span>
                            </div>
                          </td>

                          {/* Review / Message */}
                          <td className="py-2.5 px-3 align-middle">
                            <div className="bg-[#09090b] px-2.5 py-1.5 rounded-lg border border-zinc-800/80 text-[11px] text-zinc-200 leading-snug font-medium break-words">
                              {f.message}
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-2.5 px-2 align-middle">
                            {(f.phone || f.email) ? (
                              <div className="flex flex-col gap-1">
                                {f.phone && (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <a
                                      href={`tel:+91${f.phone.replace(/[^0-9]/g, '')}`}
                                      className="text-[9.5px] font-bold text-zinc-300 hover:text-amber-300 bg-[#09090b] px-1.5 py-0.5 rounded border border-zinc-800 inline-flex items-center gap-1 transition-colors"
                                      title="Call"
                                    >
                                      <Phone size={9} className="text-amber-400" /> +91 {f.phone}
                                    </a>
                                    <a
                                      href={`https://wa.me/91${f.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(f.client_name)},%20thank%20you%20for%20your%20feedback%20to%20SK%20Builders.`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 inline-flex items-center gap-0.5 transition-colors"
                                      title="Chat on WhatsApp"
                                    >
                                      WhatsApp
                                    </a>
                                  </div>
                                )}
                                {f.email && (
                                  <span className="text-[9px] text-zinc-400 bg-[#09090b] px-1.5 py-0.5 rounded border border-zinc-800 truncate block" title={f.email}>
                                    {f.email}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-600 text-[10px] italic">No contact</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-2 align-middle text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleFeedbackApproval(f.id, f.approved)}
                              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center justify-center gap-1 cursor-pointer shadow-sm w-full ${f.approved
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white'
                                }`}
                              title={f.approved ? 'Click to hide from site' : 'Click to publish on site'}
                            >
                              <CheckCircle size={10} className={f.approved ? 'text-emerald-400' : 'text-zinc-500'} />
                              <span className="text-[10px] whitespace-nowrap">{f.approved ? 'Published' : 'Hidden'}</span>
                            </button>
                          </td>

                          {/* Date */}
                          <td className="py-2.5 px-2 align-middle text-center">
                            <span className="text-[9.5px] text-zinc-300 font-mono bg-[#09090b] px-2 py-1 rounded border border-zinc-800/80 inline-block whitespace-nowrap">
                              {f.created_at ? formatLastUpdated(f.created_at) : 'Recently'}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-2.5 px-2 align-middle text-center">
                            <button
                              type="button"
                              onClick={() => requestDeleteFeedback(f.id, f.client_name)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Delete Feedback"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: LEADS & QUICK INQUIRIES (DETAILED VIEW) */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-base font-extrabold uppercase text-amber-400 flex items-center gap-2">
                  <Users size={18} className="text-amber-400" /> Customer Inquiries & Leads ({safeLeads.length})
                </h2>
                <p className="text-xs text-zinc-400">
                  Direct quick inquiries and contact requests sent by potential clients from the website.
                </p>
              </div>

              <div className="text-xs font-bold bg-amber-500/10 text-amber-400 px-3.5 py-1.5 rounded-full border border-amber-500/30">
                {safeLeads.length} Total Leads
              </div>
            </div>

            {isInitialLoading ? (
              <AdminLoadingSkeleton />
            ) : safeLeads.length === 0 ? (
              <div className="bg-[#18181b]/90 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Users size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">No Customer Inquiries Yet</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    Inquiries submitted through the "Send Quick Inquiry" contact form will appear here with complete details, service tags, and instant Call / WhatsApp actions.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {safeLeads.map((l) => {
                  const cleanPhone = (l.phone || '').replace(/[^0-9]/g, '');
                  const isContacted = l.contacted === 1 || l.contacted === true || l.status === 'Contacted' || l.status === 'Completed';
                  const serviceColor =
                    l.service === 'House Construction'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : l.service === 'House for Sale' || l.service === 'Individual House Purchase'
                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                        : l.service === 'Land for Sale' || l.service === 'Residential Land Purchase'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : 'bg-purple-500/15 text-purple-300 border-purple-500/40';

                  return (
                    <div
                      key={l.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all space-y-3 shadow-md flex flex-col justify-between ${
                        isContacted
                          ? 'bg-gradient-to-br from-[#272a34] to-[#1f222a] border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-emerald-950/20'
                          : 'bg-gradient-to-br from-[#18181b] to-[#121216] border-zinc-800 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="space-y-2.5">
                        {/* Top Header: Client Info & Time */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 border ${
                              isContacted
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}>
                              {(l.name || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-xs sm:text-sm text-white truncate">{l.name}</span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${serviceColor}`}>
                                  {l.service || 'Quick Inquiry'}
                                </span>
                                {isContacted && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                                    <Check size={11} className="stroke-[3]" /> Contacted
                                  </span>
                                )}
                                {l.property_id && (
                                  <span className="text-[9.5px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                    Ref: #{l.property_id}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10.5px] text-zinc-400 font-medium">
                                {l.email ? l.email : 'Direct Website Lead'}
                              </div>
                            </div>
                          </div>

                          {/* Received Timestamp */}
                          {l.created_at && (
                            <div className="text-[10.5px] font-mono text-zinc-400 bg-[#09090b] px-2.5 py-1 rounded-lg border border-zinc-800 shrink-0 self-start sm:self-auto">
                              Received: <strong className="text-zinc-200">{formatLastUpdated(l.created_at)}</strong>
                            </div>
                          )}
                        </div>

                        {/* Middle: Inquiry Requirement / Message Details */}
                        <div className="bg-[#09090b] px-3 py-2 rounded-lg border border-zinc-800/80 flex items-start gap-2 text-xs">
                          <FileText size={13} className="text-amber-400 shrink-0 mt-0.5" />
                          <div className="text-zinc-200 font-medium leading-relaxed min-w-0">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 mr-1.5">Requirement:</span>
                            {l.message && l.message.trim() ? (
                              <span>{l.message}</span>
                            ) : (
                              <span className="text-zinc-500 italic">No specific message specified (General callback requested).</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom: Quick Contact Actions, Complete Contact Tick Button & Delete */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/40">
                        {/* Complete Contact Tick Icon Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleLeadContacted(l.id, isContacted)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 shadow-sm ${
                            isContacted
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-black border border-emerald-400 shadow-emerald-500/20 font-black'
                              : 'bg-zinc-800 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-400 border border-zinc-700 hover:border-emerald-500/40'
                          }`}
                          title={isContacted ? "Contact completed! Click to mark as pending" : "Click to mark complete contact"}
                        >
                          <Check size={14} className={isContacted ? "text-black stroke-[3]" : "text-emerald-400 stroke-[2.5]"} />
                          <span>{isContacted ? 'Contact Completed' : 'Complete Contact'}</span>
                        </button>

                        {/* Direct Phone Call Button */}
                        {cleanPhone ? (
                          <a
                            href={`tel:+91${cleanPhone}`}
                            className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-3.5 py-1.5 rounded-lg text-xs uppercase flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
                          >
                            <Phone size={12} />
                            <span>Call (+91 {cleanPhone})</span>
                          </a>
                        ) : null}

                        {/* WhatsApp Chat Button */}
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(l.name)},%20we%20received%20your%20inquiry%20regarding%20${encodeURIComponent(l.service || 'our services')}%20at%20SK%20Builders.%20How%20can%20we%20assist%20you?`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-black font-extrabold px-3.5 py-1.5 rounded-lg text-xs uppercase border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
                          >
                            <Sparkles size={12} />
                            <span>Chat on WhatsApp</span>
                          </a>
                        ) : null}

                        {/* Delete Lead Button */}
                        <button
                          type="button"
                          onClick={() => requestDeleteLead(l.id, l.name)}
                          className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-red-400 bg-zinc-900/90 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 transition-all cursor-pointer flex items-center justify-center gap-1 text-xs font-bold shrink-0 active:scale-95 ml-auto"
                          title="Delete Lead"
                        >
                          <Trash2 size={12} className="text-red-400/80" />
                          <span className="text-[11px]">Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}


        {/* TAB 6: SETTINGS CRUD */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Section A: Admin Credentials (Username & Password) CRUD */}
            <div className="bg-[#18181b] rounded-3xl border border-zinc-800 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2 text-white">
                  <ShieldCheck size={22} className="text-amber-400" />
                  <h3 className="text-base font-extrabold uppercase tracking-wide">Admin Account & Login Security</h3>
                </div>
                <span className="text-[11px] font-bold bg-amber-500/10 text-amber-300 px-3 py-1 rounded-full uppercase border border-amber-500/30">Credentials CRUD</span>
              </div>

              {credStatusMsg && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  <span>{credStatusMsg}</span>
                </div>
              )}

              {credErrorMsg && (
                <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <span>{credErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateCredentials} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">New Admin Username</label>
                    <input
                      type="text"
                      value={adminUserForm.newUsername !== '' ? adminUserForm.newUsername : (adminInfo.username || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAdminUserForm({ ...adminUserForm, newUsername: val });
                        setAdminInfo(prev => ({ ...prev, username: val }));
                      }}
                      placeholder="Enter Username"
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Current Password (Required)</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={adminUserForm.currentPassword}
                        onChange={(e) => setAdminUserForm({ ...adminUserForm, currentPassword: e.target.value })}
                        placeholder="Current Password"
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1"
                        title={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={adminUserForm.newPassword}
                        onChange={(e) => setAdminUserForm({ ...adminUserForm, newPassword: e.target.value })}
                        placeholder="Enter New Password"
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1"
                        title={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Confirm New Password</label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={adminUserForm.confirmPassword}
                      onChange={(e) => setAdminUserForm({ ...adminUserForm, confirmPassword: e.target.value })}
                      placeholder="Repeat New Password"
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Save size={16} /> Update Admin Credentials
                  </button>
                </div>
              </form>
            </div>

            {/* Section B: Company & Website Settings */}
            <div className="bg-[#18181b] rounded-3xl border border-zinc-800 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2 text-white">
                  <Settings size={22} className="text-amber-400" />
                  <h3 className="text-base font-extrabold uppercase tracking-wide">Company & Website Information</h3>
                </div>
                <span className="text-[11px] font-bold bg-amber-500/10 text-amber-300 px-3 py-1 rounded-full uppercase border border-amber-500/30">Site Settings</span>
              </div>

              {settingStatusMsg && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                  <span>{settingStatusMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadLogo}
                  className="hidden"
                />

                {/* Top Header Row: Circled Logo on Left + Company Name & Subtitle on Right */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-[#09090b] p-4 rounded-2xl border border-zinc-800 w-full overflow-hidden">
                  {/* Circled Logo Box (Top-Left) */}
                  <div className="flex items-center gap-3.5 w-full sm:w-auto min-w-0 overflow-hidden">
                    <div className="relative group shrink-0">
                      <div
                        onClick={() => logoInputRef.current && logoInputRef.current.click()}
                        className="w-20 h-20 rounded-2xl bg-white border-2 border-amber-500/40 hover:border-amber-400 flex items-center justify-center p-1.5 cursor-pointer shadow-md transition-all group-hover:scale-105 overflow-hidden"
                        title="Click logo to upload new image"
                      >
                        <img
                          src={settings.logo_url || '/logo/sk-builders-logo.png'}
                          alt="Company Logo"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition-opacity">
                          <Upload size={18} className="text-amber-400" />
                        </div>
                      </div>

                      {/* Remove / Reset X Badge */}
                      <button
                        type="button"
                        onClick={handleResetLogo}
                        className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-transform hover:scale-110"
                        title="Reset to default logo"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="text-xs font-black uppercase text-amber-400">Company Logo</div>
                      <div className="text-[10px] text-zinc-400 font-bold mt-1 w-full min-w-0 overflow-hidden">
                        <code
                          className="block w-full bg-[#18181b] px-2.5 py-1.5 rounded-lg border border-zinc-800 text-amber-300 font-mono text-[10px] break-all leading-relaxed max-w-full select-all"
                          title={settings.logo_url || '/logo/sk-builders-logo.png'}
                        >
                          {settings.logo_url || '/logo/sk-builders-logo.png'}
                        </code>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-bold mt-1">
                        Click circle to upload or (X) to reset
                      </div>
                    </div>
                  </div>

                  {/* Company Name & Subtitle filling top right space */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={settingsForm.company_name ?? settings.company_name ?? 'SK BUILDERS'}
                        onChange={(e) => {
                          setIsSettingsFormDirty(true);
                          setSettingsForm({ ...settingsForm, company_name: e.target.value });
                        }}
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Company Subtitle / Tagline</label>
                      <input
                        type="text"
                        value={settingsForm.company_subtitle ?? settings.company_subtitle ?? '& PROPERTY CONSULTANT'}
                        onChange={(e) => {
                          setIsSettingsFormDirty(true);
                          setSettingsForm({ ...settingsForm, company_subtitle: e.target.value });
                        }}
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Main 2-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={settingsForm.phone ?? settings.phone ?? ''}
                      placeholder="Enter phone number"
                      onChange={(e) => {
                        setIsSettingsFormDirty(true);
                        setSettingsForm({ ...settingsForm, phone: e.target.value });
                      }}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={settingsForm.whatsapp_number ?? settings.whatsapp_number ?? ''}
                      placeholder="Enter WhatsApp number"
                      onChange={(e) => {
                        setIsSettingsFormDirty(true);
                        setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value });
                      }}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={settingsForm.email ?? settings.email ?? 'info@skbuilders.com'}
                      onChange={(e) => {
                        setIsSettingsFormDirty(true);
                        setSettingsForm({ ...settingsForm, email: e.target.value });
                      }}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Primary Location</label>
                    <input
                      type="text"
                      value={settingsForm.location ?? settings.location ?? 'Poonamallee, Chennai'}
                      onChange={(e) => {
                        setIsSettingsFormDirty(true);
                        setSettingsForm({ ...settingsForm, location: e.target.value });
                      }}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Service Areas</label>
                    <input
                      type="text"
                      value={settingsForm.service_areas ?? settings.service_areas ?? 'Poonamallee, Mangadu, Kundrathur'}
                      onChange={(e) => {
                        setIsSettingsFormDirty(true);
                        setSettingsForm({ ...settingsForm, service_areas: e.target.value });
                      }}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Company & Website Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={settingsForm.meta_description ?? settings.meta_description ?? 'Builder & Property Consultant in Poonamallee, Mangadu & Kundrathur. Houses for sale, residential land, contract construction, and property guidance.'}
                      onChange={(e) => {
                        setIsSettingsFormDirty(true);
                        setSettingsForm({ ...settingsForm, meta_description: e.target.value });
                      }}
                      placeholder="Builder & Property Consultant in Poonamallee, Mangadu & Kundrathur. Houses for sale, residential land, contract construction, and property guidance."
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 shadow-sm resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-800">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingSettings ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Saving Settings...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} /> <span>Save Website Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Section C: Lead Push Notifications (Mobile & Desktop Notification Bar) */}
            <div className="bg-[#18181b] rounded-3xl border border-zinc-800 p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2.5 text-white">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${notifEnabled ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-md shadow-amber-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                    {notifEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold uppercase tracking-wide text-white flex items-center gap-2">
                      Lead Enquiry Notifications
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      Receive alerts on your mobile notification bar when a client submits an enquiry
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border tracking-wider ${notifEnabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'}`}>
                    {notifEnabled ? '● ACTIVE & ON' : 'OFF'}
                  </span>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={handleToggleNotifications}
                    className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifEnabled ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-md shadow-amber-500/30' : 'bg-zinc-800'}`}
                    role="switch"
                    aria-checked={notifEnabled}
                    title={notifEnabled ? "Turn OFF lead notifications" : "Turn ON lead notifications"}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${notifEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </div>

              {notifStatusMsg && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  <span>{notifStatusMsg}</span>
                </div>
              )}

              {notifErrorMsg && (
                <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <span>{notifErrorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 mt-0.5">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white uppercase tracking-tight">Mobile Notification Bar</div>
                    <div className="text-[11px] text-zinc-400 font-medium leading-relaxed mt-0.5">
                      Alerts appear in your phone status bar with sound, vibration, client name & phone number.
                    </div>
                  </div>
                </div>

                <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 mt-0.5">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white uppercase tracking-tight">One-Tap Direct Access</div>
                    <div className="text-[11px] text-zinc-400 font-medium leading-relaxed mt-0.5">
                      Tapping the notification opens the Admin Portal directly to the Leads tab to call or chat.
                    </div>
                  </div>
                </div>

                <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20 mt-0.5">
                    <Zap size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white uppercase tracking-tight">Real-Time Delivery</div>
                    <div className="text-[11px] text-zinc-400 font-medium leading-relaxed mt-0.5">
                      Delivered via Server-Sent Events (SSE) and Service Worker with zero delay.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section D: Security Data Reset & Physical File Purge (Simplified) */}
            <div className="bg-[#121114] rounded-3xl border border-red-950/40 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2.5 text-white">
                  <div className="w-8 h-8 rounded-xl bg-red-950/50 border border-red-800/40 flex items-center justify-center text-red-400 shrink-0">
                    <Trash2 size={16} />
                  </div>
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-white">
                    SECURITY: DATA RESET & PHYSICAL FILE PURGE
                  </h3>
                </div>
                <span className="text-[10px] font-black bg-red-950/60 text-red-400 px-3 py-1 rounded-full uppercase border border-red-800/40 tracking-wider">
                  DANGER SECURITY
                </span>
              </div>

              {resetStatusMsg && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  <span>{resetStatusMsg}</span>
                </div>
              )}

              {resetErrorMsg && (
                <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <span>{resetErrorMsg}</span>
                </div>
              )}

              {/* SELECT ALL Row */}
              <div
                onClick={() => handleToggleResetAll(!resetSelection.all)}
                className="bg-[#0b0a0d] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all select-none"
              >
                <label className="flex items-center gap-3 cursor-pointer pointer-events-none">
                  <input
                    type="checkbox"
                    checked={resetSelection.all}
                    onChange={() => { }}
                    className="w-4 h-4 accent-red-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-black uppercase tracking-wider text-white">SELECT ALL</span>
                </label>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-950/50 border border-red-800/40 px-2.5 py-0.5 rounded-md">
                  ALL
                </span>
              </div>

              {/* 3x2 Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Properties */}
                <div
                  onClick={() => handleToggleResetItem('properties', !resetSelection.properties)}
                  className={`bg-[#0b0a0d] border rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-all select-none ${resetSelection.properties ? 'border-red-500/60 bg-red-950/10' : 'border-zinc-800/80 hover:border-zinc-700'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={resetSelection.properties}
                    onChange={() => { }}
                    className="w-4 h-4 accent-red-500 rounded cursor-pointer pointer-events-none"
                  />
                  <div className="flex items-center gap-2 pointer-events-none">
                    <Home size={15} className="text-amber-400" />
                    <span className="text-xs font-extrabold text-white">Properties</span>
                    <span className="text-[11px] text-zinc-400 font-semibold">({properties.length})</span>
                  </div>
                </div>

                {/* Land / Plots */}
                <div
                  onClick={() => handleToggleResetItem('land', !resetSelection.land)}
                  className={`bg-[#0b0a0d] border rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-all select-none ${resetSelection.land ? 'border-red-500/60 bg-red-950/10' : 'border-zinc-800/80 hover:border-zinc-700'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={resetSelection.land}
                    onChange={() => { }}
                    className="w-4 h-4 accent-red-500 rounded cursor-pointer pointer-events-none"
                  />
                  <div className="flex items-center gap-2 pointer-events-none">
                    <Map size={15} className="text-teal-400" />
                    <span className="text-xs font-extrabold text-white">Land / Plots</span>
                    <span className="text-[11px] text-zinc-400 font-semibold">({land.length})</span>
                  </div>
                </div>

                {/* Projects */}
                <div
                  onClick={() => handleToggleResetItem('projects', !resetSelection.projects)}
                  className={`bg-[#0b0a0d] border rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-all select-none ${resetSelection.projects ? 'border-red-500/60 bg-red-950/10' : 'border-zinc-800/80 hover:border-zinc-700'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={resetSelection.projects}
                    onChange={() => { }}
                    className="w-4 h-4 accent-red-500 rounded cursor-pointer pointer-events-none"
                  />
                  <div className="flex items-center gap-2 pointer-events-none">
                    <Building size={15} className="text-blue-400" />
                    <span className="text-xs font-extrabold text-white">Projects</span>
                    <span className="text-[11px] text-zinc-400 font-semibold">({projects.length})</span>
                  </div>
                </div>

                {/* Gallery */}
                <div
                  onClick={() => handleToggleResetItem('gallery', !resetSelection.gallery)}
                  className={`bg-[#0b0a0d] border rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-all select-none ${resetSelection.gallery ? 'border-red-500/60 bg-red-950/10' : 'border-zinc-800/80 hover:border-zinc-700'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={resetSelection.gallery}
                    onChange={() => { }}
                    className="w-4 h-4 accent-red-500 rounded cursor-pointer pointer-events-none"
                  />
                  <div className="flex items-center gap-2 pointer-events-none">
                    <ImageIcon size={15} className="text-purple-400" />
                    <span className="text-xs font-extrabold text-white">Gallery</span>
                    <span className="text-[11px] text-zinc-400 font-semibold">({gallery.length})</span>
                  </div>
                </div>

                {/* Feedbacks */}
                <div
                  onClick={() => handleToggleResetItem('feedbacks', !resetSelection.feedbacks)}
                  className={`bg-[#0b0a0d] border rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-all select-none ${resetSelection.feedbacks ? 'border-red-500/60 bg-red-950/10' : 'border-zinc-800/80 hover:border-zinc-700'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={resetSelection.feedbacks}
                    onChange={() => { }}
                    className="w-4 h-4 accent-red-500 rounded cursor-pointer pointer-events-none"
                  />
                  <div className="flex items-center gap-2 pointer-events-none">
                    <Star size={15} className="text-amber-400" />
                    <span className="text-xs font-extrabold text-white">Feedbacks</span>
                    <span className="text-[11px] text-zinc-400 font-semibold">({feedbacks.length})</span>
                  </div>
                </div>

                {/* Leads */}
                <div
                  onClick={() => handleToggleResetItem('leads', !resetSelection.leads)}
                  className={`bg-[#0b0a0d] border rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-all select-none ${resetSelection.leads ? 'border-red-500/60 bg-red-950/10' : 'border-zinc-800/80 hover:border-zinc-700'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={resetSelection.leads}
                    onChange={() => { }}
                    className="w-4 h-4 accent-red-500 rounded cursor-pointer pointer-events-none"
                  />
                  <div className="flex items-center gap-2 pointer-events-none">
                    <Mail size={15} className="text-rose-400" />
                    <span className="text-xs font-extrabold text-white">Leads</span>
                    <span className="text-[11px] text-zinc-400 font-semibold">({leads.length})</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExecuteReset}
                  disabled={isResettingData || !isAnyDataSelectedForReset}
                  className={`font-black text-xs uppercase px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg ${isResettingData || !isAnyDataSelectedForReset
                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-600 opacity-40 cursor-not-allowed pointer-events-none'
                    : 'bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-300 hover:text-white cursor-pointer'
                    }`}
                >
                  <Trash2 size={15} />
                  <span>{isResettingData ? 'RESETTING DATA...' : 'RESET SELECTED DATA (DB & FILES)'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: VIDEOS (HERO & BACKGROUND SECTION SWITCHER) */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            {/* Clickable Section Switcher Buttons */}
            <div className="flex items-center justify-start gap-2">
              <button
                type="button"
                onClick={() => setVideoSectionTab('hero')}
                className={`py-2 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${videoSectionTab === 'hero'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-[#18181b] text-zinc-300 hover:text-white border border-zinc-800'
                  }`}
              >
                <Video size={14} />
                <span>Hero Construction Video</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${videoSectionTab === 'hero' ? 'bg-black/20 text-black' : 'bg-zinc-800 text-amber-400'
                  }`}>
                  {heroVideos.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVideoSectionTab('background')}
                className={`py-2 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${videoSectionTab === 'background'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-[#18181b] text-zinc-300 hover:text-white border border-zinc-800'
                  }`}
              >
                <Layers size={14} />
                <span>Site Background Video</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${videoSectionTab === 'background' ? 'bg-black/20 text-black' : 'bg-zinc-800 text-amber-400'
                  }`}>
                  {bgVideos.length}
                </span>
              </button>
            </div>

            {/* SECTION 1: HERO CONSTRUCTION VIDEO */}
            {videoSectionTab === 'hero' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Upload Form Container */}
                <form onSubmit={(e) => handleVideoUploadSubmit(e, 'hero')} className="bg-[#18181b]/80 p-4 sm:p-5 rounded-2xl border border-zinc-800/80 shadow-md space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-amber-400 flex items-center gap-2">
                        <Upload size={16} className="text-amber-400" /> Upload Construction Video
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Upload video for Hero section timeline & 3D frame extraction.
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      Hero Section
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">Select Hero Video File</label>
                      <input
                        ref={heroFileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          setSelectedHeroVideoFile(e.target.files[0]);
                          setHeroDupError(false);
                        }}
                        className="bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs w-full focus:border-amber-500 cursor-pointer"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                        Rename File {heroDupError && <span className="text-amber-400 font-bold text-xs ml-2">⚠️ File exists! Rename here</span>}
                      </label>
                      <input
                        ref={heroRenameInputRef}
                        type="text"
                        placeholder="House_construction.mp4"
                        value={customHeroVideoName}
                        onChange={(e) => {
                          setCustomHeroVideoName(e.target.value);
                          setHeroDupError(false);
                        }}
                        className={`rounded-xl px-3 py-2 text-xs w-full transition-all text-white ${heroDupError
                          ? 'bg-amber-500/20 border-2 border-amber-500 font-bold text-amber-300'
                          : 'bg-[#09090b] border border-zinc-800'
                          }`}
                      />
                    </div>
                  </div>

                  {selectedHeroVideoFile && selectedHeroVideoFile.size > 4.5 * 1024 * 1024 && (
                    <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 text-xs space-y-2 text-amber-200 animate-fadeIn">
                      <div className="flex items-center gap-2 font-extrabold text-amber-400">
                        <AlertTriangle size={16} />
                        <span>File size is {(selectedHeroVideoFile.size / (1024 * 1024)).toFixed(1)}MB (Vercel limit: 4.5MB)</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Vercel serverless has a 4.5MB direct upload limit. If direct API upload fails, place this file in <code className="bg-black/50 text-amber-300 font-mono px-1.5 py-0.5 rounded border border-amber-500/30">uploads/videos/{customHeroVideoName || selectedHeroVideoFile.name}</code> or <code className="bg-black/50 text-amber-300 font-mono px-1.5 py-0.5 rounded border border-amber-500/30">app/public/videos/{customHeroVideoName || selectedHeroVideoFile.name}</code> and click register:
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleRegisterLocalVideoFile(customHeroVideoName || selectedHeroVideoFile.name, 'hero')}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-3.5 py-1.5 rounded-lg text-[11px] uppercase shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Zap size={14} /> Register from Local / Public Folder
                        </button>
                      </div>
                    </div>
                  )}

                  {(!selectedHeroVideoFile || selectedHeroVideoFile.size <= 4.5 * 1024 * 1024) && (
                    <button
                      type="submit"
                      disabled={isUploadingHeroVideo}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingHeroVideo ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Uploading Video...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> <span>Submit Video</span>
                        </>
                      )}
                    </button>
                  )}
                </form>

                {/* Preview / List Container */}
                <div className="bg-[#18181b]/80 rounded-2xl border border-zinc-800/80 overflow-hidden p-4 sm:p-5 shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold uppercase text-amber-400 flex items-center gap-2">
                        <Video size={16} className="text-amber-400" /> Hero Construction Videos ({heroVideos.length})
                      </h3>
                      <p className="text-[11px] text-zinc-400">Manage uploaded Hero video files.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {isInitialLoading ? (
                      <AdminLoadingSkeleton />
                    ) : heroVideos.length === 0 ? (
                      <div className="text-center py-6 text-xs text-zinc-500 font-medium">
                        No construction videos found. Upload a video above.
                      </div>
                    ) : (
                      heroVideos.map((vid) => {
                        const isVidPrimary = Boolean(vid.is_primary);
                        let vidFrames = [];
                        try {
                          vidFrames = typeof vid.frame_urls === 'string' ? JSON.parse(vid.frame_urls) : (vid.frame_urls || []);
                        } catch (e) {}
                        // Only the active primary video has the 3D frames ready on the site
                        const hasRealFrames = isVidPrimary && Array.isArray(vidFrames) && vidFrames.length > 0;
                        const isClientExtracting = clientExtraction.isExtracting && (clientExtraction.videoId === vid.id || (clientExtraction.videoId === 'uploading' && isVidPrimary));
                        const isServerExtracting = serverExtraction.isExtracting && isVidPrimary && (serverExtraction.videoId ? serverExtraction.videoId === vid.id : true);
                        const isThisVidExtracting = isClientExtracting || isServerExtracting;

                        let currentPct = 0;
                        let statusText = 'No Frames';
                        if (isClientExtracting) {
                          currentPct = clientExtraction.progress;
                          statusText = clientExtraction.status;
                        } else if (isServerExtracting) {
                          currentPct = serverExtraction.progress;
                          statusText = 'Extracting (Server)...';
                        } else if (hasRealFrames) {
                          currentPct = 100;
                          statusText = 'Frames Ready';
                        } else {
                          currentPct = 0;
                          statusText = 'Frames Not Generated';
                        }

                        const radius = 20;
                        const circumference = 2 * Math.PI * radius;
                        const strokeOffset = circumference * (1 - (currentPct / 100));

                        return (
                          <div
                            key={vid.id}
                            className={`p-3.5 sm:p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 transition-all ${
                              isVidPrimary ? 'bg-amber-500/10 border-amber-500/50 shadow-sm' : 'bg-[#09090b] border-zinc-800/80 hover:border-amber-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                                <Video size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-2">
                                  <span className="truncate">{vid.filename}</span>
                                  {isVidPrimary && (
                                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                      <Star size={10} fill="currentColor" /> PRIMARY
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-mono text-zinc-400 truncate mt-1">
                                  {vid.filepath || `uploads/videos/${vid.filename}`} • Updated: {formatLastUpdated(vid.created_at)}
                                </div>
                              </div>
                            </div>

                            {/* Frame Extraction Status / Progress (Image 2 style - Amber/Gold, No Green) */}
                            <div className="flex items-center gap-2.5 shrink-0">
                              {isThisVidExtracting ? (
                                /* 1. Live Extracting State (Image 2 style) */
                                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-amber-500/40 shadow-sm">
                                  <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                                    <svg className="w-10 h-10 -rotate-90 transform" viewBox="0 0 44 44">
                                      <circle cx="22" cy="22" r={radius} className="text-zinc-800" strokeWidth="3.5" stroke="currentColor" fill="transparent" />
                                      <circle
                                        cx="22"
                                        cy="22"
                                        r={radius}
                                        className="text-amber-400 transition-all duration-300 ease-out"
                                        strokeWidth="3.5"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeOffset}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                      />
                                    </svg>
                                    <span className="absolute text-[10px] font-black text-amber-400 tracking-tighter">
                                      {Math.round(currentPct)}%
                                    </span>
                                  </div>
                                  <div className="text-left">
                                    <div className="text-[11px] font-extrabold text-amber-400 flex items-center gap-1.5 leading-none">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
                                      <span className="truncate max-w-[180px]">Extracting</span>
                                    </div>
                                  </div>
                                </div>
                              ) : hasRealFrames ? (
                                /* 2. Frames Ready (Image 2 style - Amber/Gold, No Green) */
                                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-amber-500/40 shadow-sm">
                                  <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                                    <svg className="w-10 h-10 -rotate-90 transform" viewBox="0 0 44 44">
                                      <circle cx="22" cy="22" r={radius} className="text-zinc-800" strokeWidth="3.5" stroke="currentColor" fill="transparent" />
                                      <circle
                                        cx="22"
                                        cy="22"
                                        r={radius}
                                        className="text-amber-400"
                                        strokeWidth="3.5"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={0}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                      />
                                    </svg>
                                    <span className="absolute text-[10px] font-black text-amber-400">100%</span>
                                  </div>
                                  <div className="text-left">
                                    <div className="text-[11px] font-extrabold text-amber-400 leading-none">Frames Ready</div>
                                  </div>
                                </div>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                              {!isVidPrimary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryVideo(vid.id, 'hero')}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/30 transition-all cursor-pointer flex items-center gap-1"
                                  title="Set as Primary Hero Video & Extract Frames"
                                >
                                  <Star size={18} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setVideoRename({ id: vid.id, currentName: vid.filename, newName: vid.filename });
                                  setModalType('rename_video');
                                }}
                                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                                title="Rename Video"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDeleteVideo(vid.id, vid.filename)}
                                className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                                title="Delete Video"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: SITE BACKGROUND VIDEO */}
            {videoSectionTab === 'background' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Upload Form Container */}
                <form onSubmit={(e) => handleVideoUploadSubmit(e, 'background')} className="bg-[#18181b]/80 p-4 sm:p-5 rounded-2xl border border-zinc-800/80 shadow-md space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-amber-400 flex items-center gap-2">
                        <Upload size={16} className="text-amber-400" /> Upload Background Video
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Upload an ambient background video.
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      Site Background
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">Select Background Video File</label>
                      <input
                        ref={bgFileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          setSelectedBgVideoFile(e.target.files[0]);
                          setBgDupError(false);
                        }}
                        className="bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs w-full focus:border-amber-500 cursor-pointer"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                        Rename File {bgDupError && <span className="text-amber-400 font-bold text-xs ml-2">⚠️ File exists! Rename here</span>}
                      </label>
                      <input
                        ref={bgRenameInputRef}
                        type="text"
                        placeholder="Background.mp4"
                        value={customBgVideoName}
                        onChange={(e) => {
                          setCustomBgVideoName(e.target.value);
                          setBgDupError(false);
                        }}
                        className={`rounded-xl px-3 py-2 text-xs w-full transition-all text-white ${bgDupError
                          ? 'bg-amber-500/20 border-2 border-amber-500 font-bold text-amber-300'
                          : 'bg-[#09090b] border border-zinc-800'
                          }`}
                      />
                    </div>
                  </div>

                  {selectedBgVideoFile && selectedBgVideoFile.size > 4.5 * 1024 * 1024 && (
                    <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 text-xs space-y-2 text-amber-200 animate-fadeIn">
                      <div className="flex items-center gap-2 font-extrabold text-amber-400">
                        <AlertTriangle size={16} />
                        <span>File size is {(selectedBgVideoFile.size / (1024 * 1024)).toFixed(1)}MB (Vercel limit: 4.5MB)</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Vercel serverless has a 4.5MB direct upload limit. Place this file in <code className="bg-black/50 text-amber-300 font-mono px-1.5 py-0.5 rounded border border-amber-500/30">videos/{customBgVideoName || selectedBgVideoFile.name}</code> and click register:
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleRegisterLocalVideoFile(customBgVideoName || selectedBgVideoFile.name, 'background')}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-3.5 py-1.5 rounded-lg text-[11px] uppercase shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Zap size={14} /> Register from `videos/` Folder
                        </button>
                      </div>
                    </div>
                  )}

                  {(!selectedBgVideoFile || selectedBgVideoFile.size <= 4.5 * 1024 * 1024) && (
                    <button
                      type="submit"
                      disabled={isUploadingBgVideo}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingBgVideo ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Uploading Video...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> <span>Submit Video</span>
                        </>
                      )}
                    </button>
                  )}
                </form>

                {/* Preview / List Container */}
                <div className="bg-[#18181b]/80 rounded-2xl border border-zinc-800/80 overflow-hidden p-4 sm:p-5 shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold uppercase text-amber-400 flex items-center gap-2">
                        <Video size={16} className="text-amber-400" /> Site Background Videos ({bgVideos.length})
                      </h3>
                      <p className="text-[11px] text-zinc-400">Manage ambient site background videos.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {isUploadingBgVideo && (
                      <div className="p-3.5 sm:p-4 rounded-xl border bg-amber-500/10 border-amber-500/50 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 transition-all">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                            <Video size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-xs sm:text-sm text-white truncate">
                              {customBgVideoName || selectedBgVideoFile?.name || 'Uploading Background Video...'}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-400 truncate mt-1">
                              Uploading video and registering with database...
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <CardPieProgress
                            pct={68}
                            status="uploading"
                            title="Uploading Video"
                            message="Uploading to storage..."
                            showLabel={true}
                          />
                        </div>
                      </div>
                    )}

                    {isInitialLoading ? (
                      <AdminLoadingSkeleton />
                    ) : bgVideos.length === 0 ? (
                      <div className="text-center py-6 text-xs text-zinc-500 font-medium">
                        No background videos found. Upload a video above.
                      </div>
                    ) : (
                      bgVideos.map((vid) => {
                        const isVidPrimary = Boolean(vid.is_primary);
                        return (
                          <div
                            key={vid.id}
                            className={`p-3.5 sm:p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 transition-all ${
                              isVidPrimary ? 'bg-amber-500/10 border-amber-500/50 shadow-sm' : 'bg-[#09090b] border-zinc-800/80 hover:border-amber-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                                <Video size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-2">
                                  <span className="truncate">{vid.filename}</span>
                                  {isVidPrimary && (
                                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                      <Star size={10} fill="currentColor" /> PRIMARY
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-mono text-zinc-400 truncate mt-1">
                                  {vid.filepath || `app/public/videos/${vid.filename}`} • Updated: {formatLastUpdated(vid.created_at)}
                                </div>
                              </div>
                            </div>

                            {/* Percentage Pie Progress - Only primary active background video displays badge */}
                            <div className="flex items-center gap-3 shrink-0">
                              {isVidPrimary && (
                                <CardPieProgress
                                  pct={100}
                                  status="completed"
                                  title="Active Background Video"
                                  message="Default ambient video"
                                  showLabel={true}
                                />
                              )}

                              <div className="flex items-center gap-1 shrink-0">
                                {!isVidPrimary && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetPrimaryVideo(vid.id, 'background')}
                                    className="p-2 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
                                    title="Set as Primary Background Video"
                                  >
                                    <Star size={18} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVideoRename({ id: vid.id, currentName: vid.filename, newName: vid.filename });
                                    setModalType('rename_video');
                                  }}
                                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                                  title="Rename Video"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => requestDeleteVideo(vid.id, vid.filename)}
                                  className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                                  title="Delete Video"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MULTI-STEP PROPERTY / LAND / PROJECT FORMS & MODALS */}
      {modalType && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fadeIn overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget && modalType !== 'confirm_delete') setModalType(null);
          }}
          onWheel={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <div
            className={`bg-[#18181b] rounded-3xl ${modalType === 'service_form' ? 'max-w-4xl lg:max-w-5xl' : 'max-w-3xl'} w-full p-5 sm:p-7 md:p-8 shadow-2xl border border-amber-500/30 relative max-h-[85vh] sm:max-h-[88vh] overflow-y-auto overscroll-contain text-white`}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 z-10"
            >
              <X size={20} />
            </button>

            {/* PROPERTY MULTI-STEP FORM */}
            {modalType === 'property_form' && (
              <form
                onSubmit={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
                }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Property Management Form (Company Developed for Sale)</span>
                  <h3 className="text-lg font-black text-white">
                    {formProp.id ? 'Edit House / Building Property' : 'Add New House / Building Property'}
                  </h3>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-zinc-800 scrollbar-none text-[11px] font-bold uppercase">
                  {['1. Basic', '2. Location', '3. Price', '4. Specs', '5. Construction', '6. Features', '7. Documents & Save'].map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormStep(idx + 1)}
                      className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${formStep === idx + 1
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold'
                        : 'bg-[#09090b] text-zinc-400 border border-zinc-800 hover:text-white'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Step 1: Basic */}
                {formStep === 1 && (
                  <div className="space-y-4 text-xs">
                    {/* 1. FIRST INPUT: Upload Property Images (Multiple, Preview & Reorder) */}
                    <div className="bg-[#121214] p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <label className="block font-black text-amber-400 text-xs uppercase tracking-wide">
                            Upload Property Photos (Cover & Gallery) *
                          </label>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Select multiple photos. Drag & drop any card to reorder. Photo #1 is automatically the Cover.
                          </p>
                        </div>
                        <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                          {propertyImagesList.length} Photos Attached
                        </span>
                      </div>

                      {/* File Selector */}
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-2 active:scale-95 transition-all">
                          <Upload size={15} />
                          <span>Choose Photos (Multiple)</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleSelectMultipleImages}
                            className="hidden"
                          />
                        </label>
                        {propertyUploadProgress.uploading && (
                          <div className="flex-1 bg-zinc-900 border border-amber-500/50 rounded-xl p-2.5 shadow-lg">
                            <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                              <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                <span>Uploading photos to cloud ({propertyUploadProgress.current} / {propertyUploadProgress.total})...</span>
                              </div>
                              <span className="font-mono">{propertyUploadProgress.pct}%</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-300"
                                style={{ width: `${propertyUploadProgress.pct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Photo Previews and Reordering Grid (Drag & Drop) */}
                      {propertyImagesList.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                          {propertyImagesList.map((imgItem, idx) => {
                            const isBeingDragged = draggedImgIdx === idx;
                            const isDragTarget = dragOverImgIdx === idx && !isBeingDragged;

                            return (
                              <div
                                key={imgItem.id || idx}
                                draggable
                                onDragStart={(e) => handleImageDragStart(e, idx)}
                                onDragOver={(e) => handleImageDragOver(e, idx)}
                                onDragLeave={(e) => handleImageDragLeave(e, idx)}
                                onDrop={(e) => handleImageDrop(e, idx)}
                                onDragEnd={handleImageDragEnd}
                                className={`relative rounded-xl overflow-hidden border cursor-grab active:cursor-grabbing select-none transition-all duration-150 flex flex-col ${isBeingDragged
                                  ? 'opacity-30 scale-95 border-dashed border-amber-500 ring-2 ring-amber-500/50'
                                  : isDragTarget
                                    ? 'border-amber-400 ring-2 ring-amber-400 bg-amber-500/20 scale-[1.03] shadow-xl'
                                    : idx === 0
                                      ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-lg bg-black/60'
                                      : 'border-zinc-800 bg-black/60 hover:border-zinc-700'
                                  }`}
                              >
                                <div className="aspect-video w-full overflow-hidden flex items-center justify-center bg-zinc-950 relative pointer-events-none">
                                  <img src={imgItem.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                  {idx === 0 ? (
                                    <span className="absolute top-1.5 left-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                                      <Star size={9} fill="currentColor" /> COVER
                                    </span>
                                  ) : (
                                    <span className="absolute top-1.5 left-1.5 bg-black/80 text-zinc-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-700">
                                      #{idx + 1}
                                    </span>
                                  )}
                                  {imgItem.isNew && (
                                    <span className="absolute bottom-1.5 right-1.5 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow border border-blue-400/40">
                                      Preview
                                    </span>
                                  )}
                                </div>

                                {/* Controls Bar (No arrow buttons: Drag handle indicator, Set Cover button, Remove button) */}
                                <div className="p-1.5 bg-[#18181b] border-t border-zinc-800 flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1 text-zinc-400 pl-0.5">
                                    <GripVertical size={13} className="text-zinc-500" />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Drag</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {idx !== 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPropertyCoverImage(idx);
                                        }}
                                        className="text-[9px] font-black text-amber-400 hover:text-amber-300 px-1.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center gap-0.5"
                                        title="Set as Main Cover Photo"
                                      >
                                        <Star size={9} /> Set Cover
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removePropertyImage(idx);
                                      }}
                                      className="w-6 h-6 rounded bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                                      title="Remove Photo"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border border-dashed border-zinc-800 rounded-xl p-5 text-center text-zinc-500 space-y-1">
                          <ImageIcon size={26} className="mx-auto text-zinc-600 mb-1" />
                          <p className="font-bold text-xs text-zinc-400">No photos uploaded yet</p>
                          <p className="text-[11px] text-zinc-500">Click "Choose Photos" above to select multiple photos. Photo #1 will be your main Cover Photo.</p>
                        </div>
                      )}
                    </div>

                    {/* 2. SECOND INPUT: Property Title (Selectable Input) & Type & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-zinc-400 mb-1">Property Title *</label>
                        <select
                          value={isCustomPropertyTitle ? 'CUSTOM' : (formProp.title || 'Individual House for Sale')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'CUSTOM') {
                              setIsCustomPropertyTitle(true);
                              updateFormProp({ title: '' });
                            } else {
                              setIsCustomPropertyTitle(false);
                              updateFormProp({ title: val });
                            }
                          }}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                          required
                        >
                          {propertyTitleOptions.map((titleOpt) => (
                            <option key={titleOpt} value={titleOpt}>{titleOpt}</option>
                          ))}
                          <option value="CUSTOM">Custom Title... (Enter custom)</option>
                        </select>

                        {isCustomPropertyTitle && (
                          <div className="mt-2 animate-fadeIn">
                            <input
                              type="text"
                              placeholder="Enter custom property title..."
                              value={formProp.title || ''}
                              onChange={(e) => updateFormProp({ title: e.target.value })}
                              className="w-full bg-[#09090b] border border-amber-500 text-white rounded-xl px-3 py-2 font-bold focus:outline-none placeholder-zinc-600"
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Property Type</label>
                        <select
                          value={formProp.type || 'Individual House'}
                          onChange={(e) => updateFormProp({ type: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Individual House">Individual House</option>
                          <option value="Independent House">Independent House</option>
                          <option value="Villa">Villa</option>
                          <option value="Duplex House">Duplex House</option>
                          <option value="Apartment">Apartment</option>
                          <option value="Residential Building">Residential Building</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Listing Status</label>
                        <select
                          value={formProp.status || 'Available'}
                          onChange={(e) => updateFormProp({ status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Available">Available</option>
                          <option value="Under Construction">Under Construction</option>
                          <option value="Sold">Sold</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Location */}
                {formStep === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Service Area Location *</label>
                      <select
                        value={formProp.location || serviceAreaOptions[0] || 'Poonamallee'}
                        onChange={(e) => updateFormProp({ location: e.target.value, area: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500"
                      >
                        {serviceAreaOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-zinc-400">Google Maps Location URL</label>
                        <span className="text-[10px] text-zinc-500 font-semibold">Paste map link or pin directly</span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="url"
                          placeholder="https://maps.google.com/?q=..."
                          value={formProp.maps_url || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val || !val.trim()) {
                              updateFormProp({ maps_url: '', latitude: '', longitude: '' });
                              return;
                            }
                            const coords = parseCoordinates(val);
                            updateFormProp({
                              maps_url: val,
                              latitude: coords ? String(coords.latitude) : '',
                              longitude: coords ? String(coords.longitude) : ''
                            });
                            if (val.includes('goo.gl') || val.includes('maps.app.goo.gl')) {
                              resolveShortGoogleMapsUrl(val).then(res => {
                                if (res && res.latitude && res.longitude) {
                                  updateFormProp({
                                    latitude: String(res.latitude),
                                    longitude: String(res.longitude)
                                  });
                                }
                              });
                            }
                          }}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl pl-3.5 pr-28 py-2.5 focus:outline-none focus:border-amber-500 placeholder-zinc-600 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => openMapPinModal('properties')}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-[11px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
                          title="Pin location on Map"
                        >
                          <MapPin size={13} className="text-black" />
                          <span>Use Map</span>
                        </button>
                      </div>

                      {/* Live Exact Location Map Preview - Only display when maps_url is non-empty */}
                      {Boolean(formProp.maps_url && formProp.maps_url.trim()) && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-zinc-800 bg-[#09090b] p-2 space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-bold">
                              <MapPin size={13} className="text-amber-400" />
                              <span className="text-amber-400 uppercase tracking-wider text-[10px] font-black">Exact Location Map Preview</span>
                            </div>
                            <a
                              href={getGoogleMapsRedirectUrl(formProp.maps_url, formProp.address, formProp.location, formProp.latitude, formProp.longitude)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
                            >
                              <span>Open in Google Maps</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>

                          <div className="w-full h-44 rounded-xl overflow-hidden border border-zinc-800 relative bg-zinc-950 shadow-inner">
                            <iframe
                              title="Property Exact Location Map"
                              src={getGoogleMapsEmbedUrl(formProp.maps_url, formProp.address, formProp.location, formProp.latitude, formProp.longitude)}
                              className="w-full h-full border-0"
                              loading="lazy"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-400 mb-1">Full Address / Landmark</label>
                      <input
                        type="text"
                        placeholder="Near Kovil Street, Poonamallee"
                        value={formProp.address || ''}
                        onChange={(e) => updateFormProp({ address: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Price */}
                {formStep === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Price *</label>
                      {/* Unified connected container: NO spaces between container ₹ 58 Lakhs */}
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500 transition-colors shadow-inner">
                        <span className="bg-[#18181b] border-r border-zinc-800 text-amber-400 font-black px-3.5 py-2.5 text-sm flex items-center justify-center shrink-0 select-none">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formProp.price_amount ?? (formProp.price || '').replace(/[^0-9.]/g, '')}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            const unit = formProp.price_unit || ((formProp.price || '').includes('Crore') ? 'Crores' : (formProp.price || '').includes('Thousand') ? 'Thousands' : 'Lakhs');
                            updateFormProp({
                              price_amount: val,
                              price_unit: unit,
                              price: val ? `₹${val} ${unit}` : ''
                            });
                          }}
                          className="flex-1 bg-transparent border-0 px-3.5 py-2.5 text-sm font-extrabold text-amber-400 placeholder-zinc-600 focus:outline-none"
                          placeholder="e.g. 58"
                        />
                        <select
                          value={formProp.price_unit || ((formProp.price || '').includes('Crore') ? 'Crores' : (formProp.price || '').includes('Thousand') ? 'Thousands' : 'Lakhs')}
                          onChange={(e) => {
                            const unit = e.target.value;
                            const val = formProp.price_amount ?? (formProp.price || '').replace(/[^0-9.]/g, '');
                            updateFormProp({
                              price_unit: unit,
                              price_amount: val,
                              price: val ? `₹${val} ${unit}` : ''
                            });
                          }}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-3.5 py-2.5 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="Lakhs">Lakhs</option>
                          <option value="Thousands">Thousands</option>
                          <option value="Crores">Crores</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Negotiable</label>
                      <select
                        value={formProp.negotiable || 'Yes'}
                        onChange={(e) => updateFormProp({ negotiable: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 4: Specs */}
                {formStep === 4 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Bedrooms</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formProp.bedrooms ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            updateFormProp({ bedrooms: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 3"
                        />
                        <span className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-3 py-2 text-xs flex items-center justify-center shrink-0 select-none">
                          BHK
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Plot Area</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formProp.plot_area ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormProp({ plot_area: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 1000"
                        />
                        <select
                          value={formProp.plot_area_unit || 'sq.ft'}
                          onChange={(e) => updateFormProp({ plot_area_unit: e.target.value })}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-2.5 py-2 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="sq.ft">sq.ft</option>
                          <option value="sq.m">sq.m</option>
                          <option value="Cent">Cent</option>
                          <option value="Ground">Ground</option>
                          <option value="Acre">Acre</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Built-up Area</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formProp.builtup_area ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormProp({ builtup_area: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 1200"
                        />
                        <select
                          value={formProp.builtup_area_unit || 'sq.ft'}
                          onChange={(e) => updateFormProp({ builtup_area_unit: e.target.value })}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-2.5 py-2 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="sq.ft">sq.ft</option>
                          <option value="sq.m">sq.m</option>
                          <option value="Cent">Cent</option>
                          <option value="Ground">Ground</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Construction */}
                {formStep === 5 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Construction Type</label>
                      <select
                        value={formProp.construction_type || 'RCC / Concrete'}
                        onChange={(e) => updateFormProp({ construction_type: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="RCC / Concrete">RCC / Concrete</option>
                        <option value="Frame Structure">Frame Structure</option>
                        <option value="Load Bearing">Load Bearing</option>
                        <option value="Steel & Concrete">Steel & Concrete</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Roof Type</label>
                      <select
                        value={formProp.roof_type || 'RCC Flat Concrete Roof'}
                        onChange={(e) => updateFormProp({ roof_type: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="RCC Flat Concrete Roof">RCC Flat Concrete Roof</option>
                        <option value="Sloped Concrete Roof">Sloped Concrete Roof</option>
                        <option value="Tiled Roof">Tiled Roof</option>
                        <option value="Metal Sheet Roof">Metal Sheet Roof</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Facing</label>
                      <select
                        value={formProp.facing || 'East'}
                        onChange={(e) => updateFormProp({ facing: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                      >
                        <option value="East">East</option>
                        <option value="North">North</option>
                        <option value="South">South</option>
                        <option value="West">West</option>
                        <option value="North-East">North-East</option>
                        <option value="North-West">North-West</option>
                        <option value="South-East">South-East</option>
                        <option value="South-West">South-West</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Road Width</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="e.g. 30"
                          value={formProp.road_width ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormProp({ road_width: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                        />
                        <select
                          value={formProp.road_width_unit || 'ft'}
                          onChange={(e) => updateFormProp({ road_width_unit: e.target.value })}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-3 py-2 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="ft">ft</option>
                          <option value="inch">inch</option>
                          <option value="meter">meter</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Year Built</label>
                      <input
                        type="text"
                        placeholder="e.g. 2024"
                        value={formProp.year_built || ''}
                        onChange={(e) => updateFormProp({ year_built: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>
                  </div>
                )}

                {/* Step 6: Features */}
                {formStep === 6 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold">
                    {[
                      ['compound_wall', 'Compound Wall'],
                      ['gate', 'Dedicated Gate'],
                      ['water_connection', 'Water Connection'],
                      ['eb_connection', 'EB Connection'],
                      ['borewell', 'Borewell'],
                      ['overhead_tank', 'Overhead Tank'],
                      ['sewer_connection', 'Drainage/Sewer Facility'],
                      ['ground_water', 'Good Ground Water'],
                      ['road_access', 'Direct Road Access']
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 p-2.5 bg-[#09090b] rounded-xl border border-zinc-800 cursor-pointer text-white hover:border-amber-500/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={!!formProp[key]}
                          onChange={(e) => updateFormProp({ [key]: e.target.checked })}
                          className="accent-amber-500"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                )}

                {/* Step 7: Documents & Save */}
                {formStep === 7 && (
                  <div className="space-y-4 text-xs">
                    {propertyFormError && (
                      <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
                        <AlertTriangle size={15} className="text-red-400 shrink-0" />
                        <span>{propertyFormError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Patta Status</label>
                        <select
                          value={formProp.patta_status || 'Available'}
                          onChange={(e) => updateFormProp({ patta_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Not Available">Not Available</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">EC (Encumbrance Certificate)</label>
                        <select
                          value={formProp.ec_status || 'Available'}
                          onChange={(e) => updateFormProp({ ec_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Not Available">Not Available</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Approved Building Plan</label>
                        <select
                          value={formProp.approved_plan_status || 'Available'}
                          onChange={(e) => updateFormProp({ approved_plan_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Under Process">Under Process</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Sale Deed Status</label>
                        <select
                          value={formProp.sale_deed_status || 'Available'}
                          onChange={(e) => updateFormProp({ sale_deed_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Clear Title">Clear Title</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Other Documents / Registration Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Approved Plan DTCP No: 128/2023, Building Permit No: 441, Encumbrance Certificate No: 582"
                        value={formProp.other_documents || ''}
                        onChange={(e) => updateFormProp({ other_documents: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-zinc-400">Description / Details</label>
                        <button
                          type="button"
                          onClick={() => {
                            const generated = generatePropertyDescription(formProp);
                            setFormProp(prev => ({ ...prev, description: generated, isDescriptionCustomized: false }));
                          }}
                          className="text-[11px] text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles size={13} /> Auto-Generate from Fields
                        </button>
                      </div>
                      <textarea
                        rows="4"
                        placeholder="Property description automatically generates from selected fields, or you can write your own custom details..."
                        value={formProp.description || ''}
                        onChange={(e) => setFormProp(prev => ({ ...prev, description: e.target.value, isDescriptionCustomized: true }))}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600 leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center gap-6 font-bold pt-2 text-white">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formProp.published}
                          onChange={(e) => updateFormProp({ published: e.target.checked })}
                          className="accent-amber-500"
                        /> Published on Website
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formProp.featured}
                          onChange={(e) => updateFormProp({ featured: e.target.checked })}
                          className="accent-amber-500"
                        /> Mark Featured
                      </label>
                    </div>
                  </div>
                )}

                {/* Form Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  {formStep > 1 ? (
                    <button
                      key="prop-prev-btn"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormStep(s => Math.max(s - 1, 1));
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase transition-colors cursor-pointer"
                    >
                      Previous Step
                    </button>
                  ) : <div />}

                  {formStep < 7 ? (
                    <button
                      key="prop-next-step-btn"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormStep(s => Math.min(s + 1, 7));
                      }}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      key="prop-save-property-btn"
                      type="button"
                      onClick={handleSaveProperty}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Save size={14} /> <span>Save Property</span>
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* LAND MULTI-STEP FORM */}
            {modalType === 'land_form' && (
              <form
                onSubmit={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
                }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Land & Plots Form</span>
                  <h3 className="text-lg font-black text-white">
                    {formLand.id ? 'Edit Land Plot' : 'Add New Residential Land Plot'}
                  </h3>
                </div>

                {/* Step Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-zinc-800 scrollbar-none text-[11px] font-bold uppercase">
                  {['1. Basic & Photos', '2. Location', '3. Price', '4. Area & Dimensions', '5. Utilities & Approvals', '6. Documents & Save'].map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormStep(idx + 1)}
                      className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${formStep === idx + 1 ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold' : 'bg-[#09090b] text-zinc-400 border border-zinc-800 hover:text-white'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Step 1: Basic & Photos */}
                {formStep === 1 && (
                  <div className="space-y-4 text-xs">
                    {/* 1. FIRST INPUT: Multi-Image Upload */}
                    <div className="bg-[#09090b] p-3.5 rounded-2xl border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block font-black text-white text-xs">Land / Plot Photos & Gallery</label>
                          <p className="text-[11px] text-zinc-400">Upload multiple plot photos. Drag & drop to reorder. Photo #1 is the Cover Photo.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-amber-400 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            {landImagesList.length} Attached
                          </span>
                          <label className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black px-3 py-1.5 rounded-xl text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleSelectMultipleLandImages}
                              className="hidden"
                            />
                            <Upload size={13} />
                            <span>Choose Photos</span>
                          </label>
                        </div>
                      </div>

                      {/* Upload Progress Bar Row */}
                      {landUploadProgress.uploading && (
                        <div className="w-full bg-zinc-900 border border-amber-500/50 rounded-xl p-2.5 shadow-lg">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                              <span>Uploading plot photos ({landUploadProgress.current} / {landUploadProgress.total})...</span>
                            </div>
                            <span className="font-mono">{landUploadProgress.pct}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-300"
                              style={{ width: `${landUploadProgress.pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Photo Grid Preview with Drag & Drop */}
                      {landImagesList.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                          {landImagesList.map((imgItem, idx) => {
                            const isBeingDragged = draggedLandImgIdx === idx;
                            const isDragTarget = dragOverLandImgIdx === idx && !isBeingDragged;

                            return (
                              <div
                                key={imgItem.id || idx}
                                draggable
                                onDragStart={(e) => handleLandImageDragStart(e, idx)}
                                onDragOver={(e) => handleLandImageDragOver(e, idx)}
                                onDragLeave={(e) => handleLandImageDragLeave(e, idx)}
                                onDrop={(e) => handleLandImageDrop(e, idx)}
                                onDragEnd={handleLandImageDragEnd}
                                className={`relative rounded-xl overflow-hidden border cursor-grab active:cursor-grabbing select-none transition-all duration-150 flex flex-col ${isBeingDragged
                                  ? 'opacity-30 scale-95 border-dashed border-amber-500 ring-2 ring-amber-500/50'
                                  : isDragTarget
                                    ? 'border-amber-400 ring-2 ring-amber-400 bg-amber-500/20 scale-[1.03] shadow-xl'
                                    : idx === 0
                                      ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-lg bg-black/60'
                                      : 'border-zinc-800 bg-black/60 hover:border-zinc-700'
                                  }`}
                              >
                                <div className="aspect-video w-full overflow-hidden flex items-center justify-center bg-zinc-950 relative pointer-events-none">
                                  <img src={imgItem.url} alt={`Plot photo ${idx + 1}`} className="w-full h-full object-cover" />
                                  {idx === 0 ? (
                                    <span className="absolute top-1.5 left-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                                      <Star size={9} fill="currentColor" /> COVER
                                    </span>
                                  ) : (
                                    <span className="absolute top-1.5 left-1.5 bg-black/80 text-zinc-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-700">
                                      #{idx + 1}
                                    </span>
                                  )}
                                  {imgItem.isNew && (
                                    <span className="absolute bottom-1.5 right-1.5 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow border border-blue-400/40">
                                      Preview
                                    </span>
                                  )}
                                </div>

                                {/* Controls Bar (Drag handle indicator, Set Cover button, Remove button) */}
                                <div className="p-1.5 bg-[#18181b] border-t border-zinc-800 flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1 text-zinc-400 pl-0.5">
                                    <GripVertical size={13} className="text-zinc-500" />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Drag</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {idx !== 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLandCoverImage(idx);
                                        }}
                                        className="text-[9px] font-black text-amber-400 hover:text-amber-300 px-1.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center gap-0.5"
                                        title="Set as Main Cover Photo"
                                      >
                                        <Star size={9} /> Set Cover
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeLandImage(idx);
                                      }}
                                      className="w-6 h-6 rounded bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                                      title="Remove Photo"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border border-dashed border-zinc-800 rounded-xl p-5 text-center text-zinc-500 space-y-1">
                          <ImageIcon size={26} className="mx-auto text-zinc-600 mb-1" />
                          <p className="font-bold text-xs text-zinc-400">No photos uploaded yet</p>
                          <p className="text-[11px] text-zinc-500">Click "Choose Photos" above to select multiple photos. Photo #1 will be your main Cover Photo.</p>
                        </div>
                      )}
                    </div>

                    {/* 2. SECOND INPUT: Land Title (Selectable Input) & Type & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-zinc-400 mb-1">Land Title *</label>
                        <select
                          value={isCustomLandTitle ? 'CUSTOM' : (formLand.title || 'DTCP Approved Residential Plot')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'CUSTOM') {
                              setIsCustomLandTitle(true);
                              updateFormLand({ title: '' });
                            } else {
                              setIsCustomLandTitle(false);
                              updateFormLand({ title: val });
                            }
                          }}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                          required
                        >
                          {landTitleOptions.map((titleOpt) => (
                            <option key={titleOpt} value={titleOpt}>{titleOpt}</option>
                          ))}
                          <option value="CUSTOM">Custom Title... (Enter custom)</option>
                        </select>

                        {isCustomLandTitle && (
                          <div className="mt-2 animate-fadeIn">
                            <input
                              type="text"
                              placeholder="Enter custom land plot title..."
                              value={formLand.title || ''}
                              onChange={(e) => updateFormLand({ title: e.target.value })}
                              className="w-full bg-[#09090b] border border-amber-500 text-white rounded-xl px-3 py-2 font-bold focus:outline-none placeholder-zinc-600"
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Land Type</label>
                        <select
                          value={formLand.land_type || 'Residential Plot'}
                          onChange={(e) => updateFormLand({ land_type: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Residential Plot">Residential Plot</option>
                          <option value="Commercial Plot">Commercial Plot</option>
                          <option value="Gated Community Plot">Gated Community Plot</option>
                          <option value="Villa Plot">Villa Plot</option>
                          <option value="Corner Plot">Corner Plot</option>
                          <option value="Agricultural Land">Agricultural Land</option>
                          <option value="Industrial Plot">Industrial Plot</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Listing Status</label>
                        <select
                          value={formLand.status || 'Available'}
                          onChange={(e) => updateFormLand({ status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Available">Available</option>
                          <option value="Under Negotiation">Under Negotiation</option>
                          <option value="Sold">Sold</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Location */}
                {formStep === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Service Area Location *</label>
                      <select
                        value={formLand.location || serviceAreaOptions[0] || 'Poonamallee'}
                        onChange={(e) => updateFormLand({ location: e.target.value, area: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500"
                      >
                        {serviceAreaOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-zinc-400">Google Maps Location URL</label>
                        <span className="text-[10px] text-zinc-500 font-semibold">Paste map link or pin directly</span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="url"
                          placeholder="https://maps.google.com/?q=..."
                          value={formLand.maps_url || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val || !val.trim()) {
                              updateFormLand({ maps_url: '', latitude: '', longitude: '' });
                              return;
                            }
                            const coords = parseCoordinates(val);
                            updateFormLand({
                              maps_url: val,
                              latitude: coords ? String(coords.latitude) : '',
                              longitude: coords ? String(coords.longitude) : ''
                            });
                            if (val.includes('goo.gl') || val.includes('maps.app.goo.gl')) {
                              resolveShortGoogleMapsUrl(val).then(res => {
                                if (res && res.latitude && res.longitude) {
                                  updateFormLand({
                                    latitude: String(res.latitude),
                                    longitude: String(res.longitude)
                                  });
                                }
                              });
                            }
                          }}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl pl-3.5 pr-28 py-2.5 focus:outline-none focus:border-amber-500 placeholder-zinc-600 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => openMapPinModal('land')}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-[11px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
                          title="Pin location on Map"
                        >
                          <MapPin size={13} className="text-black" />
                          <span>Use Map</span>
                        </button>
                      </div>

                      {/* Live Exact Location Map Preview - Only display when maps_url is non-empty */}
                      {Boolean(formLand.maps_url && formLand.maps_url.trim()) && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-zinc-800 bg-[#09090b] p-2 space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-bold">
                              <MapPin size={13} className="text-amber-400" />
                              <span className="text-amber-400 uppercase tracking-wider text-[10px] font-black">Exact Location Map Preview</span>
                            </div>
                            <a
                              href={getGoogleMapsRedirectUrl(formLand.maps_url, formLand.address, formLand.location, formLand.latitude, formLand.longitude)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
                            >
                              <span>Open in Google Maps</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>

                          <div className="w-full h-44 rounded-xl overflow-hidden border border-zinc-800 relative bg-zinc-950 shadow-inner">
                            <iframe
                              title="Land Exact Location Map"
                              src={getGoogleMapsEmbedUrl(formLand.maps_url, formLand.address, formLand.location, formLand.latitude, formLand.longitude)}
                              className="w-full h-full border-0"
                              loading="lazy"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-400 mb-1">Full Address / Landmark</label>
                      <input
                        type="text"
                        placeholder="Near Kovil Street, Poonamallee"
                        value={formLand.address || ''}
                        onChange={(e) => updateFormLand({ address: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Price */}
                {formStep === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Total Price *</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500 transition-colors shadow-inner">
                        <span className="bg-[#18181b] border-r border-zinc-800 text-amber-400 font-black px-3.5 py-2.5 text-sm flex items-center justify-center shrink-0 select-none">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formLand.price_amount ?? (formLand.total_price || formLand.price || '').replace(/[^0-9.]/g, '')}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            const unit = formLand.price_unit || ((formLand.total_price || formLand.price || '').includes('Crore') ? 'Crores' : (formLand.total_price || formLand.price || '').includes('Thousand') ? 'Thousands' : 'Lakhs');
                            updateFormLand({
                              price_amount: val,
                              price_unit: unit,
                              total_price: val ? `₹${val} ${unit}` : '',
                              price: val ? `₹${val} ${unit}` : ''
                            });
                          }}
                          className="flex-1 bg-transparent border-0 px-3.5 py-2.5 text-sm font-extrabold text-amber-400 placeholder-zinc-600 focus:outline-none"
                          placeholder="e.g. 32"
                        />
                        <select
                          value={formLand.price_unit || ((formLand.total_price || formLand.price || '').includes('Crore') ? 'Crores' : (formLand.total_price || formLand.price || '').includes('Thousand') ? 'Thousands' : 'Lakhs')}
                          onChange={(e) => {
                            const unit = e.target.value;
                            const val = formLand.price_amount ?? (formLand.total_price || formLand.price || '').replace(/[^0-9.]/g, '');
                            updateFormLand({
                              price_unit: unit,
                              price_amount: val,
                              total_price: val ? `₹${val} ${unit}` : '',
                              price: val ? `₹${val} ${unit}` : ''
                            });
                          }}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-3.5 py-2.5 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="Lakhs">Lakhs</option>
                          <option value="Thousands">Thousands</option>
                          <option value="Crores">Crores</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Negotiable</label>
                      <select
                        value={formLand.negotiable || 'Yes'}
                        onChange={(e) => updateFormLand({ negotiable: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Price per sq.ft (Optional)</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <span className="bg-[#18181b] border-r border-zinc-800 text-amber-400 font-black px-3 py-2 text-xs flex items-center justify-center shrink-0 select-none">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formLand.price_per_sqft ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormLand({ price_per_sqft: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 2650"
                        />
                        <span className="bg-[#18181b] border-l border-zinc-800 text-zinc-400 font-bold px-3 py-2 text-xs flex items-center justify-center shrink-0 select-none">
                          / sq.ft
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Area & Dimensions */}
                {formStep === 4 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Plot Area *</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formLand.plot_area ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormLand({ plot_area: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 1200"
                          required
                        />
                        <select
                          value={formLand.plot_area_unit || 'sq.ft'}
                          onChange={(e) => updateFormLand({ plot_area_unit: e.target.value })}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-2.5 py-2 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="sq.ft">sq.ft</option>
                          <option value="sq.m">sq.m</option>
                          <option value="Cent">Cent</option>
                          <option value="Ground">Ground</option>
                          <option value="Acre">Acre</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Plot Length (ft)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formLand.length ?? ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          updateFormLand({ length: val, frontage: val && formLand.width ? `${val}x${formLand.width}` : formLand.frontage });
                        }}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                        placeholder="e.g. 40"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Plot Width (ft)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formLand.width ?? ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          updateFormLand({ width: val, frontage: formLand.length && val ? `${formLand.length}x${val}` : formLand.frontage });
                        }}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                        placeholder="e.g. 30"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Facing</label>
                      <select
                        value={formLand.facing || 'East'}
                        onChange={(e) => updateFormLand({ facing: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                      >
                        <option value="East">East</option>
                        <option value="North">North</option>
                        <option value="South">South</option>
                        <option value="West">West</option>
                        <option value="North-East">North-East</option>
                        <option value="North-West">North-West</option>
                        <option value="South-East">South-East</option>
                        <option value="South-West">South-West</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Road Width</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="e.g. 30"
                          value={formLand.road_width ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormLand({ road_width: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                        />
                        <select
                          value={formLand.road_width_unit || 'ft'}
                          onChange={(e) => updateFormLand({ road_width_unit: e.target.value })}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-3 py-2 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="ft">ft</option>
                          <option value="inch">inch</option>
                          <option value="meter">meter</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Road Type</label>
                      <select
                        value={formLand.road_type || 'Tar Road'}
                        onChange={(e) => updateFormLand({ road_type: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="Tar Road">Tar Road</option>
                        <option value="Concrete Road">Concrete Road</option>
                        <option value="Paved Road">Paved Road</option>
                        <option value="Gravel Road">Gravel Road</option>
                        <option value="Mud Road">Mud Road</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Corner Plot</label>
                      <select
                        value={formLand.corner_plot || 'No'}
                        onChange={(e) => updateFormLand({ corner_plot: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes (Corner Plot)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 5: Utilities & Approvals */}
                {formStep === 5 && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Approval Status *</label>
                      <select
                        value={formLand.approval_status || 'DTCP Approved'}
                        onChange={(e) => updateFormLand({ approval_status: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="DTCP Approved">DTCP Approved</option>
                        <option value="CMDA Approved">CMDA Approved</option>
                        <option value="Panchayat Approved">Panchayat Approved</option>
                        <option value="RERA Approved">RERA Approved</option>
                        <option value="Unapproved / Patta Land">Unapproved / Patta Land</option>
                        <option value="Not Provided">Not Provided</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-bold pt-2">
                      {[
                        ['eb_available', 'EB Power Line Available'],
                        ['water_available', 'Drinking Water Facility'],
                        ['drainage_available', 'Drainage / Sewerage System'],
                        ['borewell_available', 'Potable Sweet Ground Water'],
                        ['gated_community', 'Gated Community Boundary'],
                        ['street_lights', 'Street Lights Installed']
                      ].map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 p-2.5 bg-[#09090b] rounded-xl border border-zinc-800 cursor-pointer text-white hover:border-amber-500/40 transition-colors">
                          <input
                            type="checkbox"
                            checked={!!formLand[key]}
                            onChange={(e) => updateFormLand({ [key]: e.target.checked })}
                            className="accent-amber-500"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 6: Documents & Save */}
                {formStep === 6 && (
                  <div className="space-y-4 text-xs">
                    {landFormError && (
                      <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
                        <AlertTriangle size={15} className="text-red-400 shrink-0" />
                        <span>{landFormError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Patta Status</label>
                        <select
                          value={formLand.patta_status || 'Available'}
                          onChange={(e) => updateFormLand({ patta_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Under Process">Under Process</option>
                          <option value="Not Available">Not Available</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">EC (Encumbrance Certificate)</label>
                        <select
                          value={formLand.ec_status || 'Available'}
                          onChange={(e) => updateFormLand({ ec_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Clear EC">Clear EC</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Parent Documents</label>
                        <select
                          value={formLand.parent_documents_status || 'Available'}
                          onChange={(e) => updateFormLand({ parent_documents_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Verified">Verified</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Approval Order Copy</label>
                        <select
                          value={formLand.approval_documents_status || 'Available'}
                          onChange={(e) => updateFormLand({ approval_documents_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Under Process">Under Process</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-zinc-400 mb-1">Sale Deed Status</label>
                        <select
                          value={formLand.sale_deed_status || 'Available'}
                          onChange={(e) => updateFormLand({ sale_deed_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Clear Title">Clear Title</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Other Documents / Registration Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. DTCP Approval Order No: 154/2023, Survey No: 284/1B"
                        value={formLand.other_documents || ''}
                        onChange={(e) => updateFormLand({ other_documents: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-zinc-400">Description / Details</label>
                        <button
                          type="button"
                          onClick={() => {
                            const generated = generateLandDescription(formLand);
                            setFormLand(prev => ({ ...prev, description: generated, isDescriptionCustomized: false }));
                          }}
                          className="text-[11px] text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles size={13} /> Auto-Generate from Fields
                        </button>
                      </div>
                      <textarea
                        rows="4"
                        placeholder="Plot description automatically generates from selected fields, or you can write your own custom details..."
                        value={formLand.description || ''}
                        onChange={(e) => setFormLand(prev => ({ ...prev, description: e.target.value, isDescriptionCustomized: true }))}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600 leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center gap-6 font-bold pt-2 text-white">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formLand.published}
                          onChange={(e) => updateFormLand({ published: e.target.checked })}
                          className="accent-amber-500"
                        /> Published on Website
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formLand.featured}
                          onChange={(e) => updateFormLand({ featured: e.target.checked })}
                          className="accent-amber-500"
                        /> Mark Featured
                      </label>
                    </div>
                  </div>
                )}

                {/* Form Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  {formStep > 1 ? (
                    <button
                      key="land-prev-btn"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormStep(s => Math.max(s - 1, 1));
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase transition-colors cursor-pointer"
                    >
                      Previous Step
                    </button>
                  ) : <div />}

                  {formStep < 6 ? (
                    <button
                      key="land-next-step-btn"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormStep(s => Math.min(s + 1, 6));
                      }}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      key="land-save-land-btn"
                      type="button"
                      onClick={handleSaveLand}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Save size={14} /> <span>Save Land Plot</span>
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* PROJECT MULTI-STEP FORM */}
            {modalType === 'project_form' && (
              <form
                onSubmit={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
                }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Construction Project Form</span>
                  <h3 className="text-lg font-black text-white">
                    {formProj.id ? 'Edit Construction Project' : 'Add New Construction Project'}
                  </h3>
                </div>

                {/* Step Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-zinc-800 scrollbar-none text-[11px] font-bold uppercase">
                  {['1. Basic & Photos', '2. Location', '3. Specs & Dimensions', '4. Scope of Work', '5. Details & Save'].map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormStep(idx + 1)}
                      className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${formStep === idx + 1 ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold' : 'bg-[#09090b] text-zinc-400 border border-zinc-800 hover:text-white'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Step 1: Basic & Photos */}
                {formStep === 1 && (
                  <div className="space-y-4 text-xs">
                    {/* 1. Multi-Image Upload */}
                    <div className="bg-[#09090b] p-3.5 rounded-2xl border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block font-black text-white text-xs">Project Photos & Gallery</label>
                          <p className="text-[11px] text-zinc-400">Upload multiple project photos. Drag & drop to reorder. Photo #1 is the Cover Photo.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-amber-400 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            {projectImagesList.length} Attached
                          </span>
                          <label className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black px-3 py-1.5 rounded-xl text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleSelectMultipleProjectImages}
                              className="hidden"
                            />
                            <Upload size={13} />
                            <span>Choose Photos</span>
                          </label>
                        </div>
                      </div>

                      {/* Upload Progress Bar Row */}
                      {projectUploadProgress.uploading && (
                        <div className="w-full bg-zinc-900 border border-amber-500/50 rounded-xl p-2.5 shadow-lg">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                              <span>Uploading project photos ({projectUploadProgress.current} / {projectUploadProgress.total})...</span>
                            </div>
                            <span className="font-mono">{projectUploadProgress.pct}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-300"
                              style={{ width: `${projectUploadProgress.pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Photo Grid Preview with Drag & Drop */}
                      {projectImagesList.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                          {projectImagesList.map((imgItem, idx) => {
                            const isBeingDragged = draggedProjImgIdx === idx;
                            const isDragTarget = dragOverProjImgIdx === idx && !isBeingDragged;

                            return (
                              <div
                                key={imgItem.id || idx}
                                draggable
                                onDragStart={(e) => handleProjImageDragStart(e, idx)}
                                onDragOver={(e) => handleProjImageDragOver(e, idx)}
                                onDragLeave={(e) => handleProjImageDragLeave(e, idx)}
                                onDrop={(e) => handleProjImageDrop(e, idx)}
                                onDragEnd={handleProjImageDragEnd}
                                className={`relative rounded-xl overflow-hidden border cursor-grab active:cursor-grabbing select-none transition-all duration-150 flex flex-col ${isBeingDragged
                                  ? 'opacity-30 scale-95 border-dashed border-amber-500 ring-2 ring-amber-500/50'
                                  : isDragTarget
                                    ? 'border-amber-400 ring-2 ring-amber-400 bg-amber-500/20 scale-[1.03] shadow-xl'
                                    : idx === 0
                                      ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-lg bg-black/60'
                                      : 'border-zinc-800 bg-black/60 hover:border-zinc-700'
                                  }`}
                              >
                                <div className="aspect-video w-full overflow-hidden flex items-center justify-center bg-zinc-950 relative pointer-events-none">
                                  <img src={imgItem.url} alt={`Project photo ${idx + 1}`} className="w-full h-full object-cover" />
                                  {idx === 0 ? (
                                    <span className="absolute top-1.5 left-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                                      <Star size={9} fill="currentColor" /> COVER
                                    </span>
                                  ) : (
                                    <span className="absolute top-1.5 left-1.5 bg-black/80 text-zinc-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-700">
                                      #{idx + 1}
                                    </span>
                                  )}
                                  {imgItem.isNew && (
                                    <span className="absolute bottom-1.5 right-1.5 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow border border-blue-400/40">
                                      Preview
                                    </span>
                                  )}
                                </div>

                                {/* Controls Bar (Drag handle indicator, Set Cover button, Remove button) */}
                                <div className="p-1.5 bg-[#18181b] border-t border-zinc-800 flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1 text-zinc-400 pl-0.5">
                                    <GripVertical size={13} className="text-zinc-500" />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Drag</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {idx !== 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setProjectCoverImage(idx);
                                        }}
                                        className="text-[9px] font-black text-amber-400 hover:text-amber-300 px-1.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center gap-0.5"
                                        title="Set as Main Cover Photo"
                                      >
                                        <Star size={9} /> Set Cover
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeProjectImage(idx);
                                      }}
                                      className="w-6 h-6 rounded bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                                      title="Remove Photo"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border border-dashed border-zinc-800 rounded-xl p-5 text-center text-zinc-500 space-y-1">
                          <ImageIcon size={26} className="mx-auto text-zinc-600 mb-1" />
                          <p className="font-bold text-xs text-zinc-400">No photos uploaded yet</p>
                          <p className="text-[11px] text-zinc-500">Click "Choose Photos" above to select multiple photos. Photo #1 will be your main Cover Photo.</p>
                        </div>
                      )}
                    </div>

                    {/* 2. Project Name / Title (Selectable Input) & Type & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-zinc-400 mb-1">Project Name / Title *</label>
                        <select
                          value={isCustomProjectTitle ? 'CUSTOM' : (formProj.name || formProj.title || 'Individual Villa Construction')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'CUSTOM') {
                              setIsCustomProjectTitle(true);
                              updateFormProj({ name: '', title: '' });
                            } else {
                              setIsCustomProjectTitle(false);
                              updateFormProj({ name: val, title: val });
                            }
                          }}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                          required
                        >
                          {projectTitleOptions.map((titleOpt) => (
                            <option key={titleOpt} value={titleOpt}>{titleOpt}</option>
                          ))}
                          <option value="CUSTOM">Custom Title... (Enter custom)</option>
                        </select>

                        {isCustomProjectTitle && (
                          <div className="mt-2 animate-fadeIn">
                            <input
                              type="text"
                              placeholder="Enter custom construction project name..."
                              value={formProj.name || formProj.title || ''}
                              onChange={(e) => updateFormProj({ name: e.target.value, title: e.target.value })}
                              className="w-full bg-[#09090b] border border-amber-500 text-white rounded-xl px-3 py-2 font-bold focus:outline-none placeholder-zinc-600"
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Project Category / Type</label>
                        <select
                          value={formProj.project_type || 'Contract Construction'}
                          onChange={(e) => updateFormProj({ project_type: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Contract Construction">Contract Construction</option>
                          <option value="Individual House">Individual House</option>
                          <option value="Villa">Villa</option>
                          <option value="Duplex House">Duplex House</option>
                          <option value="Residential Building">Residential Building</option>
                          <option value="Commercial Building">Commercial Building</option>
                          <option value="Renovation & Remodeling">Renovation & Remodeling</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Project Status</label>
                        <select
                          value={formProj.status || 'Completed'}
                          onChange={(e) => updateFormProj({ status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Completed">Completed</option>
                          <option value="Under Construction">Ongoing (Under Construction)</option>
                          <option value="Planning & Approvals">Started (Planning & Approvals)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Location */}
                {formStep === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Service Area Location *</label>
                      <select
                        value={formProj.location || serviceAreaOptions[0] || 'Poonamallee'}
                        onChange={(e) => updateFormProj({ location: e.target.value, area: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500"
                      >
                        {serviceAreaOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-zinc-400">Google Maps Location URL</label>
                        <span className="text-[10px] text-zinc-500 font-semibold">Paste map link or pin directly</span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="url"
                          placeholder="https://maps.google.com/?q=..."
                          value={formProj.maps_url || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val || !val.trim()) {
                              updateFormProj({ maps_url: '', latitude: '', longitude: '' });
                              return;
                            }
                            const coords = parseCoordinates(val);
                            updateFormProj({
                              maps_url: val,
                              latitude: coords ? String(coords.latitude) : '',
                              longitude: coords ? String(coords.longitude) : ''
                            });
                            if (val.includes('goo.gl') || val.includes('maps.app.goo.gl')) {
                              resolveShortGoogleMapsUrl(val).then(res => {
                                if (res && res.latitude && res.longitude) {
                                  updateFormProj({
                                    latitude: String(res.latitude),
                                    longitude: String(res.longitude)
                                  });
                                }
                              });
                            }
                          }}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl pl-3.5 pr-28 py-2.5 focus:outline-none focus:border-amber-500 placeholder-zinc-600 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => openMapPinModal('projects')}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-[11px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
                          title="Pin location on Map"
                        >
                          <MapPin size={13} className="text-black" />
                          <span>Use Map</span>
                        </button>
                      </div>

                      {/* Live Exact Location Map Preview - Only display when maps_url is non-empty */}
                      {Boolean(formProj.maps_url && formProj.maps_url.trim()) && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-zinc-800 bg-[#09090b] p-2 space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-bold">
                              <MapPin size={13} className="text-amber-400" />
                              <span className="text-amber-400 uppercase tracking-wider text-[10px] font-black">Exact Location Map Preview</span>
                            </div>
                            <a
                              href={getGoogleMapsRedirectUrl(formProj.maps_url, formProj.address, formProj.location, formProj.latitude, formProj.longitude)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
                            >
                              <span>Open in Google Maps</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>

                          <div className="w-full h-44 rounded-xl overflow-hidden border border-zinc-800 relative bg-zinc-950 shadow-inner">
                            <iframe
                              title="Project Exact Location Map"
                              src={getGoogleMapsEmbedUrl(formProj.maps_url, formProj.address, formProj.location, formProj.latitude, formProj.longitude)}
                              className="w-full h-full border-0"
                              loading="lazy"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-400 mb-1">Full Address / Landmark</label>
                      <input
                        type="text"
                        placeholder="Near Kovil Street, Poonamallee"
                        value={formProj.address || ''}
                        onChange={(e) => updateFormProj({ address: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Specs & Dimensions */}
                {formStep === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Built-up Area</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formProj.builtup_area ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormProj({ builtup_area: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 1500"
                        />
                        <select
                          value={formProj.builtup_area_unit || 'sq.ft'}
                          onChange={(e) => updateFormProj({ builtup_area_unit: e.target.value })}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-2.5 py-2 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="sq.ft">sq.ft</option>
                          <option value="sq.m">sq.m</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Plot Area</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formProj.plot_area ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormProj({ plot_area: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 1200"
                        />
                        <select
                          value={formProj.plot_area_unit || 'sq.ft'}
                          onChange={(e) => updateFormProj({ plot_area_unit: e.target.value })}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-2.5 py-2 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="sq.ft">sq.ft</option>
                          <option value="sq.m">sq.m</option>
                          <option value="Cent">Cent</option>
                          <option value="Ground">Ground</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Floors</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formProj.floors ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            updateFormProj({ floors: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 2"
                        />
                        <span className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-3 py-2 text-xs flex items-center justify-center shrink-0 select-none">
                          Floors
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Bedrooms</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formProj.bedrooms ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            updateFormProj({ bedrooms: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 3"
                        />
                        <span className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-3 py-2 text-xs flex items-center justify-center shrink-0 select-none">
                          BHK
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Bathrooms</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 3"
                        value={formProj.bathrooms ?? ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          updateFormProj({ bathrooms: val });
                        }}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Completion Year / Date</label>
                      <input
                        type="text"
                        placeholder="e.g. 2024 or Aug 2024"
                        value={formProj.completion_date || formProj.actual_completion_date || ''}
                        onChange={(e) => updateFormProj({ completion_date: e.target.value, actual_completion_date: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Start Date / Year (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 2023 or Jan 2023"
                        value={formProj.start_date || ''}
                        onChange={(e) => updateFormProj({ start_date: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Scope of Work */}
                {formStep === 4 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold">
                    {[
                      ['rcc_structure', 'RCC Framed Structure'],
                      ['concrete_roof', 'Reinforced Concrete Roof'],
                      ['compound_wall', 'Compound Wall'],
                      ['gate', 'Dedicated Gate'],
                      ['parking', 'Vehicle Parking'],
                      ['water_connection', 'Water Line Connection'],
                      ['electrical_work', 'Electrical & Modular Switches'],
                      ['plumbing', 'Plumbing & Sanitaryware'],
                      ['painting', 'Exterior & Interior Painting'],
                      ['interior_work', 'Interior Woodwork & Modular Kitchen']
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 p-2.5 bg-[#09090b] rounded-xl border border-zinc-800 cursor-pointer text-white hover:border-amber-500/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={!!formProj[key]}
                          onChange={(e) => updateFormProj({ [key]: e.target.checked })}
                          className="accent-amber-500"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                )}

                {/* Step 5: Details & Save */}
                {formStep === 5 && (
                  <div className="space-y-4 text-xs">
                    {projectFormError && (
                      <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
                        <AlertTriangle size={15} className="text-red-400 shrink-0" />
                        <span>{projectFormError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Special Features / Highlights</label>
                      <input
                        type="text"
                        placeholder="e.g. Teak wood main door, Italian marble flooring, solar water heater"
                        value={formProj.special_features || ''}
                        onChange={(e) => updateFormProj({ special_features: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-zinc-400">Description / Overview</label>
                        <button
                          type="button"
                          onClick={() => {
                            const generated = generateProjectDescription(formProj);
                            setFormProj(prev => ({ ...prev, description: generated, overview: generated, isDescriptionCustomized: false }));
                          }}
                          className="text-[11px] text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles size={13} /> Auto-Generate from Fields
                        </button>
                      </div>
                      <textarea
                        rows="4"
                        placeholder="Project overview automatically generates from selected specs, or you can write your own custom details..."
                        value={formProj.description || formProj.overview || ''}
                        onChange={(e) => setFormProj(prev => ({ ...prev, description: e.target.value, overview: e.target.value, isDescriptionCustomized: true }))}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600 leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center gap-6 font-bold pt-2 text-white">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formProj.published}
                          onChange={(e) => updateFormProj({ published: e.target.checked })}
                          className="accent-amber-500"
                        /> Published on Website
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formProj.featured}
                          onChange={(e) => updateFormProj({ featured: e.target.checked })}
                          className="accent-amber-500"
                        /> Mark Featured
                      </label>
                    </div>
                  </div>
                )}

                {/* Form Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  {formStep > 1 ? (
                    <button
                      key="proj-prev-btn"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormStep(s => Math.max(s - 1, 1));
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase transition-colors cursor-pointer"
                    >
                      Previous Step
                    </button>
                  ) : <div />}

                  {formStep < 5 ? (
                    <button
                      key="proj-next-step-btn"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormStep(s => Math.min(s + 1, 5));
                      }}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      key="proj-save-project-btn"
                      type="button"
                      onClick={handleSaveProject}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Save size={14} /> <span>Save Construction Project</span>
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* GALLERY UPLOAD / EDIT FORM */}
            {modalType === 'gallery_form' && (
              <form onSubmit={handleSaveGallery} className="space-y-6">
                <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Gallery Photo Form</span>
                    <h3 className="text-lg font-black text-white">
                      {formGal.id ? 'Edit Gallery Photo' : 'Upload Gallery Photos'}
                    </h3>
                  </div>
                  {galleryFilesList.length > 0 && (
                    <span className="text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-1 rounded-full">
                      {galleryFilesList.length} photo{galleryFilesList.length !== 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>

                <div className="space-y-4 text-xs">
                  {/* File Selection Drop Area */}
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1.5">
                      Select Gallery Image File*
                    </label>
                    <div className="relative border-2 border-dashed border-zinc-700 hover:border-amber-500/60 rounded-2xl p-6 text-center bg-[#0e0e11] hover:bg-[#141418] transition-all group">
                      <input
                        type="file"
                        multiple={!formGal.id}
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const files = Array.from(e.target.files);
                            const newItems = files.map((file, i) => ({
                              id: `gal-file-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
                              file,
                              previewUrl: URL.createObjectURL(file),
                              name: file.name,
                              size: (file.size / 1024).toFixed(1) + ' KB'
                            }));
                            if (formGal.id) {
                              setGalleryFilesList(newItems.slice(0, 1));
                              setFormGal(prev => ({ ...prev, image: newItems[0].previewUrl }));
                            } else {
                              setGalleryFilesList(prev => [...prev, ...newItems]);
                            }
                          }
                          e.target.value = '';
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                          <Upload size={22} />
                        </div>
                        <div>
                          <span className="font-extrabold text-white text-xs">Click or drag & drop multiple photos here</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multiple Images Preview Grid */}
                  {galleryFilesList.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <span>Preview All Images ({galleryFilesList.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setGalleryFilesList([])}
                          className="text-[10px] text-red-400 hover:text-red-300 font-bold hover:underline"
                        >
                          Clear Selection
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1.5 bg-[#09090b] rounded-2xl border border-zinc-800 scrollbar-thin">
                        {galleryFilesList.map((item, idx) => {
                          const isBeingDragged = draggedGalIdx === idx;
                          const isDragTarget = dragOverGalIdx === idx && !isBeingDragged;

                          return (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={(e) => handleGalDragStart(e, idx)}
                              onDragOver={(e) => handleGalDragOver(e, idx)}
                              onDragLeave={(e) => handleGalDragLeave(e, idx)}
                              onDrop={(e) => handleGalDrop(e, idx)}
                              onDragEnd={handleGalDragEnd}
                              className={`relative group rounded-xl overflow-hidden border select-none transition-all duration-150 flex flex-col cursor-grab active:cursor-grabbing ${
                                isBeingDragged
                                  ? 'opacity-30 scale-95 border-dashed border-amber-500 ring-2 ring-amber-500/50'
                                  : isDragTarget
                                  ? 'border-amber-400 ring-2 ring-amber-400 bg-amber-500/20 scale-[1.03] shadow-xl'
                                  : 'border-zinc-800 bg-black/70 hover:border-amber-500/50 shadow-sm'
                              }`}
                            >
                              <div className="aspect-video w-full overflow-hidden flex items-center justify-center bg-zinc-950 relative pointer-events-none">
                                <img
                                  src={item.previewUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <span className="absolute top-1.5 left-1.5 bg-black/80 text-zinc-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-700">
                                  #{idx + 1}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGalleryFilesList(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors shadow z-10 cursor-pointer"
                                title="Remove photo"
                              >
                                <X size={12} />
                              </button>

                              {/* Controls Bar */}
                              <div className="p-1.5 bg-[#18181b]/95 border-t border-zinc-800 flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 text-zinc-400 pl-0.5 min-w-0">
                                  <GripVertical size={12} className="text-zinc-500 shrink-0" />
                                  <span className="truncate text-[10px] font-bold text-white" title={item.name}>{item.name}</span>
                                </div>
                                <span className="text-[9px] text-zinc-400 font-medium shrink-0">{item.size}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : formGal.image ? (
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Current Image Preview</label>
                      <div className="w-full h-52 rounded-xl overflow-hidden bg-black/60 border border-zinc-800 p-1">
                        <img src={formGal.image} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setModalType(null);
                      setGalleryFilesList([]);
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Save size={14} />
                    <span>
                      {galleryFilesList.length > 1
                        ? `Save ${galleryFilesList.length} Gallery Photos`
                        : 'Save Gallery Photo'}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* TESTIMONIAL MODAL FORM */}
            {modalType === 'testimonial_form' && (
              <form onSubmit={handleSaveTestimonial} className="space-y-4">
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Client Review Form</span>
                  <h3 className="text-lg font-black text-white">
                    {formTestimonial.id ? 'Edit Testimonial' : 'Add New Testimonial'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Client / Family Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh & Family"
                      value={formTestimonial.client_name}
                      onChange={(e) => setFormTestimonial({ ...formTestimonial, client_name: e.target.value })}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Location / Area</label>
                    <input
                      type="text"
                      placeholder="e.g. Poonamallee"
                      value={formTestimonial.location}
                      onChange={(e) => setFormTestimonial({ ...formTestimonial, location: e.target.value })}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-zinc-400 mb-1">Star Rating</label>
                    <select
                      value={formTestimonial.rating || 5}
                      onChange={(e) => setFormTestimonial({ ...formTestimonial, rating: parseInt(e.target.value) || 5 })}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                    >
                      <option value={5}>★★★★★ (5 Stars - Excellent)</option>
                      <option value={4}>★★★★☆ (4 Stars - Very Good)</option>
                      <option value={3}>★★★☆☆ (3 Stars - Good)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-zinc-400 mb-1">Testimonial Quote / Review Text *</label>
                    <textarea
                      rows="3"
                      placeholder="Write client experience or review quote..."
                      value={formTestimonial.quote}
                      onChange={(e) => setFormTestimonial({ ...formTestimonial, quote: e.target.value })}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                  <button type="button" onClick={() => setModalType(null)} className="bg-zinc-800 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase cursor-pointer">Cancel</button>
                  <button
                    type="submit"
                    disabled={isSavingTestimonial}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingTestimonial ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Saving Testimonial...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} /> <span>Save Testimonial</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* SERVICE FORM MODAL */}
            {modalType === 'service_form' && (
              <form onSubmit={handleSaveService} className="space-y-6">
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Services Configuration</span>
                  <h3 className="text-lg font-black text-white">
                    {formService.id ? `Edit Service Details: ${formService.title || ''}` : 'Add New Service Offering'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Configure all service information. Every detail is fully editable and synchronised directly with public website.
                  </p>
                </div>

                {/* 2-Column Core Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
                  {/* Left Column: Card Details & Badges */}
                  <div className="space-y-3.5 bg-[#121214] p-4 rounded-2xl border border-zinc-800/80">
                    <div className="text-[11px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 pb-1 border-b border-zinc-800">
                      <Building size={13} /> Card Details & Identification
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-300 mb-1">Service Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Houses for Sale"
                        value={formService.title}
                        onChange={(e) => setFormService({ ...formService, title: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Subtitle / Tagline</label>
                        <input
                          type="text"
                          placeholder="e.g. Prime Residential Living"
                          value={formService.subtitle}
                          onChange={(e) => setFormService({ ...formService, subtitle: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Card Ribbon Badge</label>
                        <input
                          type="text"
                          placeholder="e.g. Ready to Move / 100% Legal"
                          value={formService.badge}
                          onChange={(e) => setFormService({ ...formService, badge: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Service Icon</label>
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                          {renderIconByName(formService.icon_name, 20)}
                        </div>
                        <select
                          value={formService.icon_name}
                          onChange={(e) => setFormService({ ...formService, icon_name: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                        >
                          <option value="Home">Home (Houses & Villas)</option>
                          <option value="MapPin">MapPin (Land / Plots)</option>
                          <option value="HardHat">HardHat (Contract Construction)</option>
                          <option value="Users">Users (Property Consultant)</option>
                          <option value="FileText">FileText (Documentation Support)</option>
                          <option value="Compass">Compass (Planning & Advisory)</option>
                          <option value="Building">Building (Commercial / Flats)</option>
                          <option value="ShieldCheck">ShieldCheck (Trust & Clear Titles)</option>
                          <option value="Star">Star (Premium Offering)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-zinc-300">Homepage Card Summary *</label>
                        <span className="text-[10px] text-zinc-500">Short summary shown on homepage</span>
                      </div>
                      <textarea
                        rows="3"
                        placeholder="Short card summary displayed directly on the main website service card..."
                        value={formService.description}
                        onChange={(e) => setFormService({ ...formService, description: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                        required
                      />
                    </div>
                  </div>

                  {/* Right Column: Deep Overview & Highlights */}
                  <div className="space-y-3.5 bg-[#121214] p-4 rounded-2xl border border-zinc-800/80">
                    <div className="text-[11px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 pb-1 border-b border-zinc-800">
                      <FileText size={13} /> Deep Overview & Inclusions
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-zinc-300">Comprehensive Overview</label>
                        <span className="text-[10px] text-zinc-500">In-depth modal description</span>
                      </div>
                      <textarea
                        rows="4"
                        placeholder="Comprehensive in-depth description displayed when a visitor clicks 'Explore' on the service card..."
                        value={formService.overview}
                        onChange={(e) => setFormService({ ...formService, overview: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-zinc-300">Key Highlights & Inclusions</label>
                        <span className="text-[10px] text-amber-400 font-semibold">1 bullet per line</span>
                      </div>
                      <textarea
                        rows="5"
                        placeholder={"100% Vastu Compliant Layouts\nCMDA & DTCP Approved Plots\nClear Parent Deed Verification\nOn-Time Delivery Guarantee"}
                        value={formService.highlights}
                        onChange={(e) => setFormService({ ...formService, highlights: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none font-mono text-[11px] leading-relaxed"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Type each inclusion on a new line. They will display as checklist bullets on the website.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full Width Section 1: Concrete Deliverables */}
                <div className="bg-[#121214] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div>
                      <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                        <ShieldCheck size={14} /> Concrete Deliverables ({(formService.deliverables || []).length})
                      </h4>
                      <p className="text-[10.5px] text-zinc-400">
                        Tangible documents, blueprints, or guarantees provided to the client.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormService(prev => ({
                        ...prev,
                        deliverables: [...(prev.deliverables || []), { title: '', desc: '' }]
                      }))}
                      className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 font-bold px-2.5 py-1 rounded-lg text-[11px] uppercase flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus size={12} /> Add Deliverable
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(formService.deliverables || []).length === 0 ? (
                      <div className="text-center py-3 text-[11px] text-zinc-500">
                        No deliverables added. Click "+ Add Deliverable" to add one.
                      </div>
                    ) : (
                      (formService.deliverables || []).map((deliv, dIdx) => (
                        <div key={dIdx} className="bg-[#09090b] border border-zinc-800/90 rounded-xl p-2.5 flex flex-col sm:flex-row gap-2 sm:items-center">
                          <input
                            type="text"
                            placeholder="Deliverable Title (e.g. Architectural Blueprints)"
                            value={deliv.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormService(prev => ({
                                ...prev,
                                deliverables: prev.deliverables.map((item, i) => i === dIdx ? { ...item, title: val } : item)
                              }));
                            }}
                            className="bg-[#121214] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold sm:w-1/3"
                          />
                          <input
                            type="text"
                            placeholder="Deliverable Description (e.g. 2D working drawings and 3D elevation renders)"
                            value={deliv.desc}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormService(prev => ({
                                ...prev,
                                deliverables: prev.deliverables.map((item, i) => i === dIdx ? { ...item, desc: val } : item)
                              }));
                            }}
                            className="bg-[#121214] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 sm:flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormService(prev => ({
                                ...prev,
                                deliverables: prev.deliverables.filter((_, i) => i !== dIdx)
                              }));
                            }}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer self-end sm:self-auto"
                            title="Remove Deliverable"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Full Width Section 2: Step-by-Step Process Workflow */}
                <div className="bg-[#121214] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <div className="border-b border-zinc-800 pb-2">
                    <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                      <Compass size={14} /> 4-Step Execution Workflow
                    </h4>
                    <p className="text-[10.5px] text-zinc-400">
                      Step-by-step roadmap displayed in the Service Explore modal.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {([0, 1, 2, 3]).map((stepIdx) => {
                      const stepItem = (formService.process_steps && formService.process_steps[stepIdx]) || {
                        step: `0${stepIdx + 1}`,
                        title: '',
                        desc: ''
                      };

                      return (
                        <div key={stepIdx} className="bg-[#09090b] border border-zinc-800/90 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono">
                              Step 0{stepIdx + 1}
                            </span>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-1">Step Title</label>
                            <input
                              type="text"
                              placeholder={stepIdx === 0 ? 'Consultation' : stepIdx === 1 ? 'Site Inspection' : stepIdx === 2 ? 'Planning & Legal' : 'Handover'}
                              value={stepItem.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormService(prev => {
                                  const steps = [...(prev.process_steps || [])];
                                  while (steps.length < 4) {
                                    steps.push({ step: `0${steps.length + 1}`, title: '', desc: '' });
                                  }
                                  steps[stepIdx] = { ...steps[stepIdx], step: `0${stepIdx + 1}`, title: val };
                                  return { ...prev, process_steps: steps };
                                });
                              }}
                              className="w-full bg-[#121214] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-1">Step Details</label>
                            <textarea
                              rows="2"
                              placeholder="Brief summary of this step..."
                              value={stepItem.desc}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormService(prev => {
                                  const steps = [...(prev.process_steps || [])];
                                  while (steps.length < 4) {
                                    steps.push({ step: `0${steps.length + 1}`, title: '', desc: '' });
                                  }
                                  steps[stepIdx] = { ...steps[stepIdx], step: `0${stepIdx + 1}`, desc: val };
                                  return { ...prev, process_steps: steps };
                                });
                              }}
                              className="w-full bg-[#121214] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-amber-500 resize-none leading-snug"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2.5 rounded-xl text-xs uppercase cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingService}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isSavingService ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Saving Service...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} /> <span>Save Service Details</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STAT FORM MODAL */}
            {modalType === 'stat_form' && (
              <form onSubmit={handleSaveStat} className="space-y-4">
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Milestone Counter Form</span>
                  <h3 className="text-lg font-black text-white">
                    {formStat.id ? 'Edit Milestone Stat' : 'Add New Milestone Stat'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Stat Value *</label>
                    <input
                      type="text"
                      placeholder="e.g. 40+"
                      value={formStat.value}
                      onChange={(e) => setFormStat({ ...formStat, value: e.target.value })}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-amber-400 focus:outline-none focus:border-amber-500 font-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Stat Label *</label>
                    <input
                      type="text"
                      placeholder="e.g. HOMES BUILT"
                      value={formStat.label}
                      onChange={(e) => setFormStat({ ...formStat, label: e.target.value })}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Icon</label>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                        {renderIconByName(formStat.icon_name, 20)}
                      </div>
                      <select
                        value={formStat.icon_name}
                        onChange={(e) => setFormStat({ ...formStat, icon_name: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Home">Home</option>
                        <option value="MapPin">MapPin</option>
                        <option value="HardHat">HardHat</option>
                        <option value="Users">Users</option>
                        <option value="Building">Building</option>
                        <option value="ShieldCheck">ShieldCheck</option>
                        <option value="Star">Star</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                  <button type="button" onClick={() => setModalType(null)} className="bg-zinc-800 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase cursor-pointer">Cancel</button>
                  <button
                    type="submit"
                    disabled={isSavingStat}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingStat ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Saving Stat...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} /> <span>Save Stat</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* RENAME VIDEO MODAL */}
            {modalType === 'rename_video' && (
              <form onSubmit={handleRenameVideoSubmit} className="space-y-4">
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Video Action</span>
                  <h3 className="text-lg font-black text-white">Rename Video File</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Current Filename & Path</label>
                  <div className="text-xs font-mono font-bold bg-[#09090b] border border-zinc-800 p-2.5 rounded-xl text-amber-300 break-all">
                    uploads/videos/{videoRename.currentName}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">New Filename (.mp4)</label>
                  <input
                    type="text"
                    value={videoRename.newName}
                    onChange={(e) => setVideoRename({ ...videoRename, newName: e.target.value })}
                    className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                  <button type="button" onClick={() => setModalType(null)} className="bg-zinc-800 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase">Cancel</button>
                  <button type="submit" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5">
                    <Save size={14} /> Save New Name
                  </button>
                </div>
              </form>
            )}

            {/* SECURITY DATA RESET CONFIRMATION MODAL */}
            {modalType === 'confirm_reset' && (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-3 text-red-400 border-b border-zinc-800 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-950/60 border border-red-800/50 flex items-center justify-center shrink-0 shadow-inner">
                    <AlertTriangle size={22} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                      SECURITY DATA RESET CONFIRMATION
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-semibold">
                      Irreversible Data & Physical File Purge
                    </p>
                  </div>
                </div>

                <div className="space-y-3 bg-[#09090b] p-4 rounded-2xl border border-zinc-800/80 text-xs">
                  <p className="font-extrabold text-red-400 uppercase tracking-wider text-[11px]">
                    You are about to PERMANENTLY PURGE:
                  </p>
                  <ul className="space-y-1.5 text-zinc-200 font-bold text-xs pl-1">
                    {resetSelection.properties && <li className="flex items-center gap-2 text-amber-300">• Properties (Houses & physical image files)</li>}
                    {resetSelection.land && <li className="flex items-center gap-2 text-teal-300">• Land / Plots (Plots & physical image files)</li>}
                    {resetSelection.projects && <li className="flex items-center gap-2 text-blue-300">• Projects (Projects & physical image files)</li>}
                    {resetSelection.gallery && <li className="flex items-center gap-2 text-purple-300">• Gallery (Showcase photos & physical files)</li>}
                    {resetSelection.feedbacks && <li className="flex items-center gap-2 text-amber-400">• Client Feedbacks</li>}
                    {resetSelection.leads && <li className="flex items-center gap-2 text-rose-300">• Customer Leads</li>}
                  </ul>

                  <p className="text-zinc-400 text-[11px] leading-relaxed pt-2 border-t border-zinc-800/80 font-semibold">
                    This will delete the selected records from the database AND permanently remove uploaded physical image files from disk.
                  </p>
                  <p className="text-amber-400/90 text-[10.5px] font-extrabold">
                    (Videos and Frame assets are strictly preserved).
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-5 py-2.5 rounded-xl text-xs uppercase transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isResettingData}
                    onClick={async () => {
                      await performActualReset();
                      setModalType(null);
                    }}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-red-900/30 transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isResettingData ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Purging Data...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={15} /> Yes, Purge Selected Data
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {modalType === 'confirm_delete' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle size={30} />
                </div>
                <h3 className="text-lg font-black text-white">Confirm Deletion</h3>
                <p className="text-xs text-zinc-300 font-medium px-4">{deleteConfig.title}</p>
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setModalType(null)}
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 font-bold px-5 py-2.5 rounded-xl text-xs uppercase cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={async () => {
                      setIsDeleting(true);
                      try {
                        if (deleteConfig.onConfirm) {
                          await deleteConfig.onConfirm();
                        }
                      } catch (err) {
                        console.error('Delete error:', err);
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-60 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={14} />
                        <span>Yes, Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAP PIN PICKER MODAL */}
      {mapPinModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#141417] border border-zinc-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <MapPin size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Pin Location on Map</h3>
                  <p className="text-[10px] text-zinc-400">Enter Google Maps URL or detect your current GPS location.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMapPinModal(prev => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* GPS Detection & Select from Map shortcuts */}
            <div className="flex flex-wrap gap-2 items-center justify-between bg-[#09090b] p-3 rounded-2xl border border-zinc-800">
              <button
                type="button"
                onClick={handleDetectGpsLocation}
                disabled={mapPinModal.isDetecting}
                className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {mapPinModal.isDetecting ? (
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Compass size={14} />
                )}
                <span>Detect My Device GPS</span>
              </button>

            </div>

            {mapPinModal.detectMsg && (
              <div className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400">
                {mapPinModal.detectMsg}
              </div>
            )}

            {/* Interactive Touch-to-Pin Google Map (Amazon / Flipkart Style) */}
            {showInteractiveMap && (
              <div className="space-y-1.5">
                <InteractiveGoogleMapPicker
                  latitude={mapPinModal.latitude}
                  longitude={mapPinModal.longitude}
                  address={mapPinModal.address}
                  location={mapPinModal.location}
                  onChange={(lat, lng) => {
                    setMapPinModal(prev => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng
                    }));
                  }}
                  onConfirmPin={(lat, lng) => {
                    const newUrl = `https://maps.google.com/?q=${lat},${lng}`;
                    setMapPinModal(prev => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng,
                      tempUrl: newUrl
                    }));
                  }}
                />
              </div>
            )}

            {/* Input URL */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-zinc-400">Google Maps URL or Link</label>
              <input
                type="text"
                placeholder="https://maps.google.com/?q=..."
                value={mapPinModal.tempUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  const coords = parseCoordinates(val);
                  setMapPinModal(prev => ({
                    ...prev,
                    tempUrl: val,
                    latitude: coords ? String(coords.latitude) : prev.latitude,
                    longitude: coords ? String(coords.longitude) : prev.longitude
                  }));
                  if (val.includes('goo.gl') || val.includes('maps.app.goo.gl')) {
                    resolveShortGoogleMapsUrl(val).then(res => {
                      if (res && res.latitude && res.longitude) {
                        setMapPinModal(prev => ({
                          ...prev,
                          latitude: String(res.latitude),
                          longitude: String(res.longitude),
                          detectMsg: `Resolved location: ${res.latitude}, ${res.longitude}`
                        }));
                      }
                    });
                  }
                }}
                className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>



            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setMapPinModal(prev => ({ ...prev, isOpen: false }))}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPinnedLocation}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Check size={14} />
                <span>Apply Location</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

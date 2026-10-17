import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, BedDouble, Maximize, Phone, MessageSquare, ChevronLeft, ChevronRight, X, CheckCircle2, Home, Send, Sparkles, Calendar, ShieldCheck, ArrowRight, Share2, ArrowLeft, Navigation, ExternalLink } from 'lucide-react';
import Navbar from './Navbar.jsx';
import ItemFeedbackSection from './ItemFeedbackSection.jsx';
import { useSiteData, resolveAssetUrl } from '../hooks/useSiteData.jsx';
import { getGoogleMapsEmbedUrl, getGoogleMapsRedirectUrl, hasMapInput } from '../utils/mapUtils.js';

const PropertyDetailPage = ({ modalItem, modalType, onClose, isModal = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { properties, land, settings } = useSiteData();

  const thumbnailContainerRef = useRef(null);
  const thumbRefs = useRef([]);

  // Scroll to top on page load (only for standalone page, not modal)
  useEffect(() => {
    if (!isModal) {
      window.scrollTo(0, 0);
    }
  }, [isModal]);

  // Lock background scrolling when opened as modal overlay
  useEffect(() => {
    if (isModal) {
      if (typeof window !== 'undefined' && window.lenis) {
        window.lenis.stop();
      }
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        if (typeof window !== 'undefined' && window.lenis) {
          window.lenis.start();
        }
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      };
    }
  }, [isModal]);

  // Retrieve item from props (modal) or router state or URL query param (?id=...&type=...) or fallback
  const searchParams = new URLSearchParams(location.search);
  const paramId = searchParams.get('id');
  const paramType = searchParams.get('type');
  const passedItem = modalItem || location.state?.item;
  const isPassedLand = (modalType === 'land') || location.state?.type === 'land' || paramType === 'land' || passedItem?.land_type || passedItem?.total_price;
  const itemsPool = isPassedLand ? land : properties;
  const activeItem = passedItem || (paramId && itemsPool ? itemsPool.find(i => String(i.id) === String(paramId)) : null) || (properties && properties.length > 0 ? properties[0] : (land && land.length > 0 ? land[0] : null));
  const isLand = isPassedLand || (activeItem && (activeItem.land_type || activeItem.total_price));

  // Additional gallery images for item
  const rawImages = [];
  if (activeItem?.cover_image) rawImages.push(activeItem.cover_image);
  if (activeItem?.image && !rawImages.includes(activeItem.image)) rawImages.push(activeItem.image);
  if (Array.isArray(activeItem?.images)) {
    activeItem.images.forEach(img => {
      const u = typeof img === 'string' ? img : (img?.image_url || img?.url);
      if (u && !rawImages.includes(u)) rawImages.push(u);
    });
  }
  const validImages = rawImages.filter(url => url && !url.includes('logo') && url !== '/house/completed-house.jpg');

  const [activeImage, setActiveImage] = useState(validImages[0] || activeItem?.image || '');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  const hasMap = hasMapInput(activeItem?.maps_url, activeItem?.latitude, activeItem?.longitude);
  const mapEmbedUrl = getGoogleMapsEmbedUrl(activeItem?.maps_url, activeItem?.address, activeItem?.location || activeItem?.area, activeItem?.latitude, activeItem?.longitude);
  const mapRedirectUrl = getGoogleMapsRedirectUrl(activeItem?.maps_url, activeItem?.address, activeItem?.location || activeItem?.area, activeItem?.latitude, activeItem?.longitude);

  const handleSharePage = async () => {
    const propTitle = activeItem?.title || (isLand ? 'Residential Plot' : 'Individual House');
    const loc = activeItem?.location || activeItem?.area || 'Poonamallee, Chennai';
    const price = activeItem?.price || activeItem?.total_price || '';

    // Clean BHK without duplicates (e.g. "3 BHK BHK" -> "3 BHK")
    let bhk = '';
    if (activeItem?.bedrooms && activeItem.bedrooms !== 'N/A') {
      const bStr = String(activeItem.bedrooms).replace(/\s*bhk/gi, '').trim();
      bhk = bStr ? `${bStr} BHK` : '';
    }

    // Get Promoter dynamically from database settings
    const promoterName = settings?.site_title || settings?.company_name || 'SK Builders & Property Consultant';

    // Dynamically get baseUrl from browser
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${baseUrl}/property-details?id=${activeItem?.id || ''}&type=${isLand ? 'land' : 'property'}`;

    // Clean normal share format matching Image 3 (Rich Preview card with blue link)
    const shareTitle = `${propTitle}${bhk ? ` (${bhk})` : ''} | ${promoterName}`;
    const shareText = `${propTitle}${bhk ? ` (${bhk})` : ''} - ${loc}${price ? ` | ${price}` : ''}\n${promoterName}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {}
    }
    try {
      // Normal clean link sharing like Image 3
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch (err) {}
  };

  const handleBack = () => {
    if (isModal && onClose) {
      onClose();
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/#properties', { state: { scrollTo: 'properties', immediate: true } });
    }
  };

  useEffect(() => {
    if (validImages.length > 0 && (!activeImage || !validImages.includes(activeImage))) {
      setActiveImage(validImages[0]);
    }
  }, [activeItem]);

  // Auto-scroll active thumbnail into view when switching activeImage
  useEffect(() => {
    if (!activeImage || validImages.length <= 1) return;
    const activeIdx = validImages.indexOf(activeImage);
    if (activeIdx !== -1 && thumbRefs.current[activeIdx]) {
      thumbRefs.current[activeIdx].scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [activeImage, validImages]);

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Lock body scroll when Lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen]);

  const handleOpenLightbox = (imgUrl) => {
    setLightboxImg(imgUrl || activeImage || activeItem?.image);
    setIsLightboxOpen(true);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (validImages.length <= 1) return;
    const currentIdx = validImages.indexOf(activeImage || validImages[0]);
    const prevIdx = (currentIdx - 1 + validImages.length) % validImages.length;
    setActiveImage(validImages[prevIdx]);
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (validImages.length <= 1) return;
    const currentIdx = validImages.indexOf(activeImage || validImages[0]);
    const nextIdx = (currentIdx + 1) % validImages.length;
    setActiveImage(validImages[nextIdx]);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone) {
      setSubmitError('Name and phone number are required.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactForm.name,
          phone: contactForm.phone,
          email: contactForm.email || '',
          notes: `Inquiry for ${isLand ? 'Land' : 'Property'}: ${activeItem?.title || 'Unknown'} - ${contactForm.message || ''}`
        })
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setContactForm({ name: '', phone: '', email: '', message: '' });
      } else {
        setSubmitError('Failed to send inquiry. Please try calling directly.');
      }
    } catch (err) {
      setSubmitError('Network error. Please call or WhatsApp directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeItem) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Home size={48} className="text-amber-400 mb-4 animate-bounce" />
          <h2 className="text-2xl font-black mb-2">Property Not Found</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-md">The requested property or land plot record could not be loaded.</p>
          <button
            onClick={() => navigate('/#properties')}
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider"
          >
            ← Return to Properties
          </button>
        </div>
      </div>
    );
  }

  const priceDisplay = activeItem.price || activeItem.total_price || 'Price on Request';
  const typeDisplay = activeItem.type || activeItem.land_type || (isLand ? 'Residential Plot' : 'Individual House');
  const locationDisplay = activeItem.location || activeItem.area || 'Poonamallee, Chennai';
  const sizeDisplay = activeItem.builtup_area
    ? `${activeItem.builtup_area} ${activeItem.builtup_area_unit || 'sq.ft'}`
    : (activeItem.plot_area ? `${activeItem.plot_area} ${activeItem.plot_area_unit || 'sq.ft'}` : 'Contact for dimensions');

  const phoneNum = settings?.phone || '';
  const waNum = settings?.whatsapp_number || '';

  const contentNode = (
    <>
      {/* Top Header & Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 bg-white/10 hover:bg-amber-500 hover:text-black text-white px-4 py-2 rounded-full font-bold text-xs transition-all w-fit cursor-pointer"
        >
          <ChevronLeft size={16} /> {isModal ? 'Close & Return to Properties' : 'Back to Properties Showcase'}
        </button>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
            activeItem.status === 'Completed' || activeItem.status === 'Ready'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {activeItem.status || 'Available for Purchase'}
          </span>
          <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest bg-zinc-900/80 px-3 py-1 rounded-full border border-white/10">
            {typeDisplay}
          </span>
          {isModal && (
            <button
              onClick={handleBack}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all ml-1 cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

        {/* Main Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Image Gallery & Specs (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Main Featured Image Gallery Card - ONLY IMAGES */}
            <div className="gold-specular-card bg-[#121216] p-3 sm:p-4 rounded-3xl border border-white/15 shadow-2xl relative overflow-hidden group">
              <div className="relative h-72 sm:h-[480px] md:h-[520px] lg:h-[560px] w-full rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                {validImages.length > 0 ? (
                  <img
                    src={resolveAssetUrl(activeImage || validImages[0])}
                    alt={activeItem.title}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                    onClick={() => handleOpenLightbox(activeImage || validImages[0])}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1c1c20] to-[#0a0a0c] flex items-center justify-center text-amber-400">
                    <Home size={64} className="text-amber-400/80" />
                  </div>
                )}
                
                {/* Left & Right Arrow Navigation for Multiple Images */}
                {validImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/70 hover:bg-amber-500 hover:text-black text-white backdrop-blur-md border border-white/20 hover:border-amber-400 flex items-center justify-center transition-all cursor-pointer shadow-xl z-20 active:scale-95 group/btn"
                      aria-label="Previous Image"
                      title="Previous Image"
                    >
                      <ChevronLeft size={20} className="transition-transform group-hover/btn:-translate-x-0.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/70 hover:bg-amber-500 hover:text-black text-white backdrop-blur-md border border-white/20 hover:border-amber-400 flex items-center justify-center transition-all cursor-pointer shadow-xl z-20 active:scale-95 group/btn"
                      aria-label="Next Image"
                      title="Next Image"
                    >
                      <ChevronRight size={20} className="transition-transform group-hover/btn:translate-x-0.5" />
                    </button>
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full text-[10px] font-black z-10">
                      {Math.max(1, validImages.indexOf(activeImage || validImages[0]) + 1)} / {validImages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails Row - ONLY PHOTOS */}
              {validImages.length > 1 && (
                <div
                  ref={thumbnailContainerRef}
                  className="flex gap-3 overflow-x-auto pt-3 scrollbar-none p-1 scroll-smooth"
                >
                  {validImages.map((imgUrl, idx) => (
                    <img
                      key={idx}
                      ref={el => (thumbRefs.current[idx] = el)}
                      src={resolveAssetUrl(imgUrl)}
                      alt={`Property Photo ${idx + 1}`}
                      onClick={() => setActiveImage(imgUrl)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 object-cover rounded-xl border-2 cursor-pointer transition-all ${
                        activeImage === imgUrl ? 'border-amber-400 scale-105 shadow-lg' : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Title & Key Highlights Card */}
            <div className="gold-specular-card bg-[#121216] p-6 sm:p-8 rounded-3xl border border-white/15 shadow-xl space-y-6">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <MapPin size={14} /> {locationDisplay}
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
                  {activeItem.title}
                </h1>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">
                  {priceDisplay}
                </div>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                {activeItem.bedrooms && activeItem.bedrooms !== 'N/A' && (
                  <div className="bg-[#18181c] p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <BedDouble size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Bedrooms</span>
                      <span className="text-sm font-extrabold text-white">{activeItem.bedrooms} BHK</span>
                    </div>
                  </div>
                )}

                <div className="bg-[#18181c] p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Maximize size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Dimensions / Area</span>
                    <span className="text-sm font-extrabold text-white">{sizeDisplay}</span>
                  </div>
                </div>

                <div className="bg-[#18181c] p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Legal Approval</span>
                    <span className="text-sm font-extrabold text-white">DTCP / RERA Cleared</span>
                  </div>
                </div>
              </div>

              {/* Detailed Description */}
              {activeItem.description && (
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <h3 className="text-sm font-black uppercase text-amber-400 tracking-wider">Property Details & Specifications</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line font-medium">
                    {activeItem.description}
                  </p>
                </div>
              )}
            </div>

            {/* Exact Location & Google Map Preview Card - Only rendered when map input is provided */}
            {hasMap && mapEmbedUrl && (
              <div className="gold-specular-card bg-[#121216] p-6 sm:p-7 rounded-3xl border border-white/15 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Property Exact Location Map</h3>
                    <p className="text-xs text-zinc-400 font-medium">
                      {activeItem?.address || activeItem?.landmark || activeItem?.location || activeItem?.area || 'Poonamallee, Chennai'}
                    </p>
                  </div>
                </div>

                {/* Clickable Map Preview iframe */}
                <div
                  onClick={() => window.open(mapRedirectUrl, '_blank')}
                  className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-white/10 group cursor-pointer bg-black/80 shadow-inner"
                  title="Click to open Google Maps for this exact location"
                >
                  <iframe
                    title="Exact Property Location Map Preview"
                    src={mapEmbedUrl}
                    className="w-full h-full border-0 pointer-events-none"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors flex items-end p-3 pointer-events-none">
                    <div className="bg-black/85 backdrop-blur-md border border-amber-500/40 text-amber-400 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 group-hover:border-amber-400 group-hover:scale-105 transition-all shadow-xl">
                      <MapPin size={14} className="text-amber-400" />
                      <span>Click to open interactive Google Maps for this location ↗</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Direct Contact & Inquiry Form (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Quick Action Buttons */}
            <div className="gold-specular-card bg-[#121216] p-6 rounded-3xl border border-white/15 shadow-xl space-y-3.5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" /> Consult With Builder
              </h3>

              <a
                href={`tel:${phoneNum}`}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                <Phone size={16} /> Call Builder ({phoneNum})
              </a>

              {waNum && (
                <a
                  href={`https://wa.me/91${waNum}?text=${encodeURIComponent(`Hi, I am interested in property: ${activeItem.title} (${priceDisplay})`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  <MessageSquare size={16} /> WhatsApp Inquiry
                </a>
              )}

              {/* Share Property Details Button */}
              <button
                type="button"
                onClick={handleSharePage}
                className="w-full bg-[#1c1c22] hover:bg-[#25252c] border border-white/15 hover:border-amber-400/50 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Share2 size={15} className="text-amber-400" />
                <span>{shareCopied ? 'Link Copied to Clipboard!' : 'Share'}</span>
              </button>
            </div>

            {/* Buyer Inquiry Form */}
            <div className="gold-specular-card bg-[#121216] p-6 rounded-3xl border border-white/15 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Schedule Site Visit & Inquiry
              </h3>

              {submitSuccess ? (
                <div className="bg-emerald-500/20 border border-emerald-500/40 p-4 rounded-2xl text-emerald-300 text-xs font-bold text-center space-y-2">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
                  <p>Inquiry received! Our construction team will contact you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3">
                  {submitError && (
                    <div className="bg-red-500/20 border border-red-500/40 p-3 rounded-xl text-red-300 text-xs font-bold text-center">
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1">Your Name *</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Enter full name"
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="Enter mobile number"
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1">Message (Optional)</label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Ask for site visit date or pricing breakdown..."
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 h-20 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-black font-black py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Submit Property Inquiry'}
                  </button>
                </form>
              )}
            </div>

            {/* Client Reviews & Feedback Section - Positioned next to Inquire Form */}
            <ItemFeedbackSection
              altId={String(activeItem.id)}
              itemType={isLand ? 'land' : 'property'}
              itemTitle={activeItem.title || (isLand ? 'Residential Land' : 'Individual House')}
            />

          </div>

        </div>
    </>
  );

  const lightboxNode = isLightboxOpen && (
    <div
      className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn cursor-pointer select-none"
      onClick={() => setIsLightboxOpen(false)}
    >
      <div
        className="relative max-w-[90vw] max-h-[85vh] w-auto h-auto p-1.5 sm:p-2 bg-[#121216] border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.95)] flex items-center justify-center cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button floating top right of container */}
        <button
          onClick={() => setIsLightboxOpen(false)}
          className="absolute -top-3 -right-3 z-30 w-8 h-8 rounded-full bg-zinc-900 border border-amber-500/50 text-white hover:text-amber-400 hover:border-amber-400 flex items-center justify-center transition-all cursor-pointer shadow-xl"
          title="Close Image"
        >
          <X size={16} />
        </button>

        {/* Tight Square / Rectangle Image View */}
        <img
          src={resolveAssetUrl(lightboxImg || activeImage)}
          alt="High-Res Property Preview"
          className="max-w-[85vw] max-h-[80vh] w-auto h-auto object-contain rounded-xl select-none"
        />
      </div>
    </div>
  );

  if (isModal) {
    if (typeof document === 'undefined') return null;
    return createPortal(
      <div
        className="fixed inset-0 z-[99999] bg-[#09090b]/95 backdrop-blur-xl overflow-y-auto overscroll-contain animate-fadeIn text-white selection:bg-amber-500 selection:text-black"
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 relative">
          {contentNode}
        </div>
        {lightboxNode}
      </div>,
      document.body
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-24 sm:py-28 relative z-10 space-y-8">
        {contentNode}
      </main>
      {lightboxNode}
    </div>
  );
};

export default PropertyDetailPage;

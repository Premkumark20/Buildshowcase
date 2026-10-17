import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Home, MapPin, HardHat, Users, FileText, Compass, ArrowRight, X, CheckCircle2, Sparkles, ShieldCheck, Clock } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteData } from '../hooks/useSiteData.js';
import AnimatedCounter from './AnimatedCounter.jsx';

gsap.registerPlugin(ScrollTrigger);

const iconMap = {
  Home: <Home size={24} className="text-amber-400" />,
  MapPin: <MapPin size={24} className="text-amber-400" />,
  HardHat: <HardHat size={24} className="text-amber-400" />,
  Users: <Users size={24} className="text-amber-400" />,
  FileText: <FileText size={24} className="text-amber-400" />,
  Compass: <Compass size={24} className="text-amber-400" />
};

const serviceDetails = {
  'Houses for Sale': {
    subtitle: 'Ready-to-Move & Luxury Custom Individual Villas',
    overview: 'Premium independent villas and houses engineered with rigorous architectural standards. Every house is designed for lifelong durability, optimal natural lighting, 100% Vasthu harmony, and excellent connectivity in Chennai’s prime growth corridors.',
    highlights: [
      '100% Vasthu Compliant Custom Floor Plans',
      'DTCP & CMDA Approved Clear Marketable Titles',
      'Dedicated Borewell & Sweet Groundwater',
      'Branded Electrical, Plumbing & Sanitary Fittings',
      'Covered Car Parking & Compound Wall with Designer Gate',
      'Immediate Sub-Registrar Office Registration'
    ],
    deliverables: [
      { title: 'Independent Patta', desc: 'Direct revenue patta in home buyer’s name upon registration.' },
      { title: 'Structural Warranty', desc: 'Certified RCC framing and foundation warranty for peace of mind.' },
      { title: 'Bank Loan Assistance', desc: 'Approved by SBI, HDFC, ICICI, and major banks with up to 85% funding.' }
    ],
    process: [
      { step: '01', title: 'Site Inspection', desc: 'Guided physical visit to inspect villas, localities, and construction quality.' },
      { step: '02', title: 'Legal Verification', desc: 'Complete 30-year parent deed and encumbrance certificate verification.' },
      { step: '03', title: 'Loan & Agreement', desc: 'Fast bank sanction and transparent sale agreement with zero hidden charges.' },
      { step: '04', title: 'Registration & Handover', desc: 'Clear sub-registrar registration and traditional house-warming key handover.' }
    ],
    badge: '100% Quality Assured'
  },
  'Lands for Sale': {
    subtitle: 'DTCP & CMDA Approved Residential Plots',
    overview: 'High-appreciation residential plots and gated layout communities in fast-developing belts like Poonamallee, Kundrathur, and Mangadu. Ideal for immediate dream home construction or solid, appreciating land investment.',
    highlights: [
      'DTCP & CMDA Approved Layouts with Clear Approvals',
      'Wide 30ft & 40ft Blacktop Tar Roads',
      'Sweet Potable Groundwater at 30-40 Feet',
      'EB Electricity Line & Street Lighting Ready',
      'Clearly Demarcated Boundary Stones',
      'Surrounded by Reputed Schools, Hospitals & Transit'
    ],
    deliverables: [
      { title: 'Clear Marketable Title', desc: 'Clean legal background with flawless encumbrance history.' },
      { title: 'High ROI Appreciation', desc: 'Positioned in prime metro expansion and orbital road corridors.' },
      { title: 'Instant Building Permit', desc: 'Ready for immediate municipal plan sanction and construction.' }
    ],
    process: [
      { step: '01', title: 'Plot Selection Tour', desc: 'Explore plot dimensions, facing (East/North), and corner availability.' },
      { step: '02', title: 'Document Verification', desc: 'Full scrutiny of layout approval numbers, FMB sketches, and legal clearance.' },
      { step: '03', title: 'Fast-Track Bank Loan', desc: 'Plot purchase + composite construction loans facilitated via leading banks.' },
      { step: '04', title: 'Direct Registration', desc: 'Seamless deed registration and on-the-spot physical possession handover.' }
    ],
    badge: 'High Investment Growth'
  },
  'Contract House Construction': {
    subtitle: 'Turnkey Architectural Design & Custom Building',
    overview: 'We construct your dream house on your plot with end-to-end turnkey responsibility — from architectural 2D/3D elevations, soil testing, structural column framing, brickwork, to luxury interior and exterior finishing.',
    highlights: [
      'Custom 2D Architectural & 3D Elevation Models',
      'Structural Engineer Certified Column Footings',
      'Tier-1 Brands: UltraTech Cement & Tata / JSW Steel',
      'First-Class Red Clay Bricks / Solid Concrete Blocks',
      'Teakwood Main Doors & Branded UPVC Windows',
      'Stage-by-Stage Milestone Photo & Video Progress'
    ],
    deliverables: [
      { title: 'Itemized BOQ Cost Sheet', desc: 'Fixed square-foot pricing with zero surprise cost escalation.' },
      { title: 'On-Time Handover Guarantee', desc: 'Strict milestone calendar with scheduled completion commitments.' },
      { title: '5-Year Structural Warranty', desc: 'Long-term structural assurance backed by certified civil engineers.' }
    ],
    process: [
      { step: '01', title: 'Soil Test & Architecture', desc: 'Site soil bearing assessment and customized 2D/3D plan designing.' },
      { step: '02', title: 'Estimation & Approvals', desc: 'Transparent material specifications and municipal building plan permit.' },
      { step: '03', title: 'Milestone Execution', desc: 'Civil foundation, lintel, roof slab, plastering, plumbing & electrical.' },
      { step: '04', title: 'Final Finishing & Handover', desc: 'Paint finish, fixtures testing, deep cleaning, and ceremonial key handover.' }
    ],
    badge: 'Turnkey Excellence'
  },
  'Property Consultant': {
    subtitle: 'Honest Local Guidance & Strategic Investment Advisory',
    overview: 'Over a decade of deep local real estate experience across Chennai. We assist home buyers, land owners, and NRI investors in identifying authentic property deals, negotiating fair market values, and avoiding legal pitfalls.',
    highlights: [
      'Micro-Market Price Trend Analysis',
      'Direct Builder & Landowner Negotiations',
      'Unbiased Second Opinion on Property Deals',
      'Resale & Distress Property Opportunities',
      'Rental Yield & Capital Appreciation Forecast',
      'Zero Hidden Surcharges or Misleading Claims'
    ],
    deliverables: [
      { title: 'Comparative Market Valuation', desc: 'Accurate square foot valuation report based on authentic registry sales.' },
      { title: 'Risk Assessment Checklist', desc: 'Zoning, flood risk elevation, and future government alignment checks.' },
      { title: 'Strategic Deal Closure', desc: 'End-to-end guidance from preliminary offer to deed execution.' }
    ],
    process: [
      { step: '01', title: 'Goal Assessment', desc: 'Understanding your exact budget, timeline, location, and family requirements.' },
      { step: '02', title: 'Curated Shortlist', desc: 'Vetting genuine properties that match your financial and legal criteria.' },
      { step: '03', title: 'Negotiation & Valuation', desc: 'Leveraging market comps to achieve the most competitive purchase price.' },
      { step: '04', title: 'Safe Transaction Closing', desc: 'Supervising token agreements, payment schedules, and registry closing.' }
    ],
    badge: '10+ Years Trust'
  },
  'Documentation Support': {
    subtitle: 'Comprehensive Legal Scrutiny & Government Liaisoning',
    overview: 'Real estate paperwork can be daunting and fraught with risk. Our seasoned legal documentation team inspects title provenance, handles revenue department transfers, and obtains government approvals with absolute diligence.',
    highlights: [
      '30-Year Encumbrance Certificate (EC) Audit',
      'Parent Deed & Link Document Provenance',
      'Revenue Patta Transfer & Chitta Extracts',
      'Building Plan Approvals & DTCP / CMDA Clearance',
      'Guideline Value & Stamp Duty Calculation',
      'Legal Heirs & Settlement Deed Examination'
    ],
    deliverables: [
      { title: 'Senior Advocate Legal Opinion', desc: 'Formal written title search report from certified property advocates.' },
      { title: 'Patta & Revenue Records', desc: 'Government revenue name transfer smoothly processed to your name.' },
      { title: 'Certified Document Copies', desc: 'Retrieved verified duplicates from Sub-Registrar archives where needed.' }
    ],
    process: [
      { step: '01', title: 'Document Collection', desc: 'Gathering deed copies, tax receipts, layout orders, and survey records.' },
      { step: '02', title: 'Registry Search', desc: 'Thorough online and offline sub-registrar ledger inspection for encumbrances.' },
      { step: '03', title: 'Legal Clearance Report', desc: 'Detailed title clearance report pinpointing any clauses or red flags.' },
      { step: '04', title: 'Govt Department Liaison', desc: 'Expediting Patta, Town Planning, and Revenue department documentation.' }
    ],
    badge: '100% Legal Protection'
  },
  'Construction Consultation': {
    subtitle: 'Structural Engineering & Cost Optimization Advisory',
    overview: 'Save money and prevent structural flaws before pouring a single bucket of concrete. Our qualified civil engineers provide site feasibility visits, structural design reviews, itemized cost estimations, and quality audits.',
    highlights: [
      'Site Feasibility & Soil Bearing Advisory',
      'Itemized Quantity Surveying & Material BOQ',
      'Independent Structural Quality Audits',
      'Waterproofing & Anti-Termite Treatment Plans',
      'Contractor Quotation Comparison & Vetting',
      'Budget Cost Optimization (Save 15-20% Wastage)'
    ],
    deliverables: [
      { title: 'Comprehensive BOQ Estimation', desc: 'Exact breakdown of steel, cement, sand, bricks, and labor costs.' },
      { title: 'Civil Audit Report', desc: 'Technical inspection checklist covering column alignment, curing, and mix ratios.' },
      { title: 'Architectural Optimization', desc: 'Value-engineering suggestions for higher usable carpet area.' }
    ],
    process: [
      { step: '01', title: 'Initial Consultation', desc: 'Discussion of plot specifics, client vision, and preliminary budget limits.' },
      { step: '02', title: 'Site Inspection', desc: 'Physical check of soil, road levels, water table, and neighboring structures.' },
      { step: '03', title: 'Engineering & BOQ Analysis', desc: 'Formulating exact quantity schedules, structural calculations, and timeline.' },
      { step: '04', title: 'Execution Monitoring', desc: 'Periodic site quality audits during crucial slab casting and foundation phases.' }
    ],
    badge: 'Expert Engineering'
  }
};

const defaultServices = [
  { id: 1, title: 'Houses for Sale', icon_name: 'Home', description: 'Individual 2BHK/3BHK villa houses built with high engineering standards in Poonamallee & Kundrathur.' },
  { id: 2, title: 'Lands for Sale', icon_name: 'MapPin', description: 'DTCP/CMDA approved residential plot layouts ready for immediate house construction.' },
  { id: 3, title: 'Contract House Construction', icon_name: 'HardHat', description: 'Custom contract construction from 2D/3D architectural plan, foundation to final key handover.' },
  { id: 4, title: 'Property Consultant', icon_name: 'Users', description: 'Expert local guidance for plot selection, valuation, transparent pricing and property legal checks.' },
  { id: 5, title: 'Documentation Support', icon_name: 'FileText', description: 'Complete legal verification assistance including Patta, EC, Parent Deeds & municipal approvals.' },
  { id: 6, title: 'Construction Consultation', icon_name: 'Compass', description: 'Technical site inspection, structural estimation, material guidance and cost optimization.' }
];

const defaultStats = [
  { icon_name: 'Home', value: '40+', label: 'Homes Built' },
  { icon_name: 'MapPin', value: '75+', label: 'Plots Sold' },
  { icon_name: 'Users', value: '150+', label: 'Property Deals' },
  { icon_name: 'Users', value: '100+', label: 'Happy Families' }
];

const Services = () => {
  const sectionRef = useRef(null);
  const pinContainerRef = useRef(null);
  const headerRef = useRef(null);
  const cardsContainerRef = useRef(null);
  const statsStripRef = useRef(null);

  const [statsActive, setStatsActive] = useState(false);
  const [activeServiceModal, setActiveServiceModal] = useState(null);
  const { services, stats: dbStats } = useSiteData();

  // Lock background scroll when service modal is open
  useEffect(() => {
    if (activeServiceModal) {
      if (typeof window !== 'undefined' && window.lenis) {
        window.lenis.stop();
      }
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      if (typeof window !== 'undefined' && window.lenis) {
        window.lenis.start();
      }
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      if (typeof window !== 'undefined' && window.lenis) {
        window.lenis.start();
      }
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [activeServiceModal]);

  const safeServices = (Array.isArray(services) && services.length > 0)
    ? services
    : defaultServices;

  const activeStats = (Array.isArray(dbStats) && dbStats.length > 0)
    ? dbStats
    : defaultStats;

  // Dynamic Counter Trigger via IntersectionObserver for Mobile & Desktop
  useEffect(() => {
    const statsEl = statsStripRef.current;
    if (!statsEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStatsActive(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(statsEl);
    return () => observer.disconnect();
  }, []);

  // Scroll-Scrubbed Animation Engine (Desktop only)
  useEffect(() => {
    const section = sectionRef.current;
    const pinContainer = pinContainerRef.current;
    const header = headerRef.current;
    const cardsContainer = cardsContainerRef.current;
    const statsStrip = statsStripRef.current;

    if (!section || !pinContainer || !cardsContainer) return;

    const mm = gsap.matchMedia();

    // 1. DESKTOP: Pinned Section Timeline Engine with Smooth 2-Way Scrub (Up & Down)
    mm.add('(min-width: 769px)', () => {
      const cards = Array.from(cardsContainer.children);

      // Pre-set elements hidden initially so they never bleed through while scrolling earlier sections
      if (header) gsap.set(header, { opacity: 0, y: -25 });
      if (cards.length > 0) gsap.set(cards, { opacity: 0, y: 55, rotateX: 20, scale: 0.9 });
      if (statsStrip) gsap.set(statsStrip, { opacity: 0, y: 35, scale: 0.95 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: pinContainer,
          start: 'top top',
          end: '+=2600',
          scrub: 1.5,
          anticipatePin: 1,
          pinSpacing: true,
          refreshPriority: 7,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (self.progress >= 0.35) {
              setStatsActive(true);
            } else {
              setStatsActive(false);
            }
          },
        },
      });

      // 0. Header reveal
      if (header) {
        tl.fromTo(
          header,
          { opacity: 0, y: -25 },
          { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out' },
          0
        );
      }

      // 1. STEP 1: Sequential 3D card flip & rise up
      tl.fromTo(
        cards,
        { opacity: 0, y: 55, rotateX: 20, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          stagger: 0.06,
          duration: 0.45,
          ease: 'power2.out',
        },
        0.08
      );

      // 2. STEP 2: NEXT, Stats Strip slides up, glows and illuminates
      if (statsStrip) {
        tl.fromTo(
          statsStrip,
          { opacity: 0, y: 35, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.35,
            ease: 'back.out(1.4)',
          },
          0.50
        );
      }
    });

    // 2. MOBILE: Simple static view
    mm.add('(max-width: 768px)', () => {
      if (header) gsap.set(header, { clearProps: 'all' });
      if (cardsContainer?.children) {
        gsap.set(Array.from(cardsContainer.children), { clearProps: 'all' });
      }
      if (statsStrip) gsap.set(statsStrip, { clearProps: 'all' });
    });

    requestAnimationFrame(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });

    return () => {
      mm.revert();
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section ref={sectionRef} id="services" className="relative z-10 w-full bg-transparent text-white overflow-hidden scroll-mt-16 sm:scroll-mt-20">
      {/* Stage Container (Pinned on desktop only) */}
      <div ref={pinContainerRef} className="w-full min-h-0 sm:min-h-screen h-auto sm:h-screen overflow-hidden flex flex-col justify-center items-center py-8 sm:py-20 relative">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-amber-500/10 rounded-full blur-[180px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col justify-center">
          {/* Section Heading */}
          <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-3 sm:mb-8">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              What We Do
            </h2>
            <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-amber-500 to-amber-300 mx-auto rounded-full mt-1.5 sm:mt-2.5 shadow-sm shadow-amber-500/50"></div>
            <p className="text-zinc-400 text-[11px] sm:text-sm mt-1.5 sm:mt-2.5 font-medium">
              End-to-end real estate solutions designed for individual home buyers, plot investors and land owners.
            </p>
          </div>

          {/* 2 COLUMNS ON MOBILE / 6 COLUMNS ON DESKTOP: Vertical Rectangle Cards */}
          <div ref={cardsContainerRef} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-3.5 sm:mb-6">
            {safeServices.map((srv, idx) => {
              const icon = iconMap[srv.icon_name] || iconMap.Home;
              return (
                <div
                  key={srv.id || idx}
                  onClick={() => setActiveServiceModal(srv)}
                  className="gold-specular-card rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between group relative min-h-[160px] sm:min-h-[220px]"
                >
                  <div className="specular-glare" />

                  <div className="relative z-10">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2 sm:mb-3.5 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-amber-600 transition-colors duration-300 shadow-md">
                      {React.cloneElement(icon, {
                        className: 'transition-colors duration-300 group-hover:text-black w-4 h-4 sm:w-5 sm:h-5'
                      })}
                    </div>
                    <h3 className="text-[11.5px] sm:text-sm font-extrabold text-white mb-1 leading-snug group-hover:text-amber-300 transition-colors line-clamp-2">
                      {srv.title}
                    </h3>
                    <p className="text-zinc-400 text-[9.5px] sm:text-[10.5px] leading-tight mb-2 font-medium line-clamp-2 sm:line-clamp-3">
                      {srv.description}
                    </p>
                  </div>
                  <div className="relative z-10">
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-wider group-hover:gap-2 transition-all">
                      Explore <ArrowRight size={10} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full-Width Obsidian Gold Stats Strip with Dynamic Countable Animation */}
          <div
            ref={statsStripRef}
            className="w-full bg-[#121216]/90 sm:backdrop-blur-2xl text-white border border-amber-500/40 rounded-xl sm:rounded-2xl p-3 sm:py-5 sm:px-6 shadow-2xl relative z-10"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-0 divide-y-0 lg:divide-x divide-white/10">
              {activeStats.map((st, i) => {
                const icon = iconMap[st.icon_name] || iconMap.Home;
                const valueStr = st.value || st.number || '0';
                return (
                  <div
                    key={st.id || i}
                    className={`flex items-center justify-center gap-2 sm:gap-3.5 ${
                      i !== 0 ? 'lg:px-6' : 'lg:pr-6'
                    }`}
                  >
                    <div className="p-1.5 sm:p-2.5 bg-amber-500/15 border border-amber-500/35 rounded-lg sm:rounded-xl shrink-0 shadow-md">
                      {React.cloneElement(icon, {
                        className: 'text-amber-400 w-4 h-4 sm:w-5 sm:h-5'
                      })}
                    </div>
                    <div>
                      <div className="text-base sm:text-2xl lg:text-3xl font-black text-white leading-none tracking-tight">
                        <AnimatedCounter targetString={valueStr} trigger={statsActive} />
                      </div>
                      <div className="text-[9.5px] sm:text-[11px] font-bold text-amber-300 mt-0.5 sm:mt-1 uppercase tracking-wider">
                        {st.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Service Detail Modal Drawer - Dynamic Rich Details */}
      {activeServiceModal && (() => {
        const title = activeServiceModal.title || 'Houses for Sale';
        const fallback = serviceDetails[title] || {
          subtitle: 'Professional Real Estate & Construction Solutions',
          overview: activeServiceModal.description || 'Comprehensive solutions tailored for home buyers, plot investors, and property owners.',
          highlights: [
            '100% Legal & DTCP/CMDA Compliance',
            'Experienced Architectural & Civil Engineering',
            'Transparent Pricing with No Hidden Charges',
            'Dedicated Relationship Manager',
            'Fast Approvals & Documentation Support',
            'Uncompromising Quality Assurance'
          ],
          deliverables: [
            { title: 'Verified Documentation', desc: 'Legally certified ownership and compliance paperwork.' },
            { title: 'Dedicated Support', desc: 'Continuous guidance from consultation through completion.' },
            { title: 'Quality Guarantee', desc: 'Highest engineering and construction standards delivered.' }
          ],
          process: [
            { step: '01', title: 'Consultation', desc: 'In-depth assessment of your goals, plot or budget requirements.' },
            { step: '02', title: 'Site Inspection', desc: 'Physical verification and technical engineering survey.' },
            { step: '03', title: 'Planning & Legal', desc: 'Design drafting, document audits, and transparent agreement.' },
            { step: '04', title: 'Execution & Handover', desc: 'Flawless milestone execution with full handover.' }
          ],
          badge: 'Verified Service'
        };

        // Parse dynamic database fields if available
        let dynamicHighlights = null;
        if (activeServiceModal.highlights) {
          if (Array.isArray(activeServiceModal.highlights)) {
            dynamicHighlights = activeServiceModal.highlights;
          } else if (typeof activeServiceModal.highlights === 'string') {
            try {
              const p = JSON.parse(activeServiceModal.highlights);
              if (Array.isArray(p)) dynamicHighlights = p;
            } catch (e) {
              dynamicHighlights = activeServiceModal.highlights.split('\n').map(s => s.trim()).filter(Boolean);
            }
          }
        }

        let dynamicDeliverables = null;
        if (activeServiceModal.deliverables) {
          if (Array.isArray(activeServiceModal.deliverables)) {
            dynamicDeliverables = activeServiceModal.deliverables;
          } else if (typeof activeServiceModal.deliverables === 'string') {
            try {
              const p = JSON.parse(activeServiceModal.deliverables);
              if (Array.isArray(p)) dynamicDeliverables = p;
            } catch (e) {}
          }
        }

        let dynamicProcess = null;
        if (activeServiceModal.process_steps) {
          if (Array.isArray(activeServiceModal.process_steps)) {
            dynamicProcess = activeServiceModal.process_steps;
          } else if (typeof activeServiceModal.process_steps === 'string') {
            try {
              const p = JSON.parse(activeServiceModal.process_steps);
              if (Array.isArray(p)) dynamicProcess = p;
            } catch (e) {}
          }
        }

        const details = {
          subtitle: activeServiceModal.subtitle || fallback.subtitle,
          overview: activeServiceModal.overview || activeServiceModal.description || fallback.overview,
          badge: activeServiceModal.badge || fallback.badge,
          highlights: (dynamicHighlights && dynamicHighlights.length > 0) ? dynamicHighlights : fallback.highlights,
          deliverables: (dynamicDeliverables && dynamicDeliverables.length > 0) ? dynamicDeliverables : fallback.deliverables,
          process: (dynamicProcess && dynamicProcess.length > 0) ? dynamicProcess : fallback.process
        };

        const handleInquireClick = () => {
          const selectedTitle = activeServiceModal.title;
          setActiveServiceModal(null);
          // Auto-select service in Contact form
          window.dispatchEvent(new CustomEvent('select-service', { detail: { service: selectedTitle } }));
          setTimeout(() => {
            const contactEl = document.getElementById('contact');
            if (contactEl) {
              if (window.lenis) {
                window.lenis.scrollTo(contactEl, { offset: -65 });
              } else {
                contactEl.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }, 60);
        };

        if (typeof document === 'undefined') return null;

        return createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden animate-fadeIn"
            onClick={() => setActiveServiceModal(null)}
            data-lenis-prevent="true"
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
              className="relative max-w-2xl w-full my-auto max-h-[85vh] sm:max-h-[82vh] bg-[#121216] rounded-3xl border border-amber-500/35 text-white shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar (Always Visible) */}
              <div className="shrink-0 p-4 sm:p-6 pb-4 border-b border-white/10 flex items-start justify-between gap-4 bg-[#121216]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-lg shrink-0">
                    {iconMap[activeServiceModal.icon_name] || iconMap.Home}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9.5px] font-black uppercase text-amber-400 tracking-widest bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                        {details.badge || 'SERVICE OVERVIEW'}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {activeServiceModal.title}
                    </h3>
                    <p className="text-xs text-amber-300 font-bold mt-0.5">
                      {details.subtitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveServiceModal(null)}
                  className="p-2 bg-white/10 hover:bg-amber-500 hover:text-black rounded-full transition-all text-white shrink-0 cursor-pointer"
                  aria-label="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Scrollable Body (Independent Y-Axis Smooth Scroll) */}
              <div
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 sm:space-y-6 scrollbar-thin scrollbar-thumb-amber-500/40 scrollbar-track-transparent"
                style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
                data-lenis-prevent="true"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                {/* Overview Text */}
                <div className="bg-[#18181f]/80 p-4 rounded-2xl border border-white/10">
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-medium">
                    {details.overview || activeServiceModal.description}
                  </p>
                </div>

                {/* Key Highlights & Inclusions */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" /> Key Features & Inclusions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {details.highlights.map((h, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 bg-black/40 border border-white/10 p-2.5 sm:p-3 rounded-xl text-xs text-zinc-200 font-semibold hover:border-amber-500/40 transition-colors"
                      >
                        <CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What We Deliver */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-amber-400" /> What We Deliver
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {details.deliverables.map((d, idx) => (
                      <div
                        key={idx}
                        className="bg-[#18181f] border border-amber-500/20 p-3 rounded-xl space-y-1"
                      >
                        <div className="text-xs font-black text-white">{d.title}</div>
                        <p className="text-[11px] text-zinc-400 font-medium leading-snug">{d.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Execution Process Steps */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-400" /> How We Work (Our Process)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {details.process.map((p, idx) => (
                      <div
                        key={idx}
                        className="bg-black/35 border border-white/10 p-3 rounded-xl flex items-start gap-3"
                      >
                        <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                          {p.step}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white mb-0.5">{p.title}</div>
                          <p className="text-[11px] text-zinc-400 font-medium leading-snug">{p.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Sticky Bottom Action Footer (Always Visible) */}
              <div className="shrink-0 p-4 sm:p-5 border-t border-white/10 bg-[#0e0e12] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-left text-[11px] text-zinc-400 font-medium">
                  Have questions about <span className="text-white font-bold">{activeServiceModal.title}</span>?
                </div>
                <button
                  type="button"
                  onClick={handleInquireClick}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Inquire For This Service →</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </section>
  );
};

export default Services;

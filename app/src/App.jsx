import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ConstructionStory from './components/ConstructionStory.jsx';
import WhyChooseUs from './components/WhyChooseUs.jsx';
import Gallery from './components/Gallery.jsx';
import Services from './components/Services.jsx';
import FeaturedProperties from './components/FeaturedProperties.jsx';
import Projects from './components/Projects.jsx';
import ContactCTA from './components/ContactCTA.jsx';
import Footer from './components/Footer.jsx';
import MobileQuickActions from './components/MobileQuickActions.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import FeedbackPage from './components/FeedbackPage.jsx';
import PropertyDetailPage from './components/PropertyDetailPage.jsx';
import ProjectDetailPage from './components/ProjectDetailPage.jsx';
import AllPropertiesPage from './components/AllPropertiesPage.jsx';
import AllProjectsPage from './components/AllProjectsPage.jsx';
import MouseInteractiveBg from './components/MouseInteractiveBg.jsx';
import AnimatedSectionDivider from './components/AnimatedSectionDivider.jsx';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initScrollReveals } from './animations/reveal.js';
import { SiteDataProvider } from './hooks/useSiteData.jsx';

gsap.registerPlugin(ScrollTrigger);

const MainSite = () => {
  const location = useLocation();

  const [activePropertyModal, setActivePropertyModal] = useState(null);
  const [activeProjectModal, setActiveProjectModal] = useState(null);

  // Synchronously compute targetId so initial render does not flash home on reload
  const hashId = typeof window !== 'undefined' && window.location.hash ? window.location.hash.replace('#', '') : null;
  const storedSection = typeof window !== 'undefined' ? sessionStorage.getItem('activeSiteSection') : null;
  const routeTarget = location.state?.scrollTo;
  const targetId = routeTarget || hashId || (storedSection && storedSection !== 'home' ? storedSection : null);

  const [isReady, setIsReady] = useState(() => {
    return !targetId || targetId === 'home';
  });

  // Redirect to admin portal if hash specifies admin or leads
  useLayoutEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash.toLowerCase();
      if (h.includes('lead')) {
        window.location.replace('/admin#leads');
      } else if (h.includes('admin')) {
        window.location.replace('/admin?login=true');
      }
    }
  }, []);

  useLayoutEffect(() => {
    if (targetId && targetId !== 'home') {
      const el = document.getElementById(targetId);
      if (el) {
        const navbarHeight = 65;
        const rect = el.getBoundingClientRect();
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetTop = rect.top + currentScrollTop - navbarHeight;
        window.scrollTo({ top: Math.max(0, targetTop), behavior: 'instant' });
      }
      setIsReady(true);
    }
  }, [targetId]);

  useEffect(() => {
    initScrollReveals();

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    let lenisInstance = null;
    let updateLenis = null;
    let onRefresh = null;

    ScrollTrigger.defaults({ anticipatePin: 1 });

    if (!isMobile) {
      // Initialize Lenis Smooth Momentum Scroll Engine for Desktop
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.0,
        syncTouch: false,
      });
      lenisInstance = lenis;
      if (typeof window !== 'undefined') {
        window.lenis = lenis;
      }

      lenis.on('scroll', ScrollTrigger.update);

      updateLenis = (time) => {
        lenis.raf(time * 1000);
      };

      gsap.ticker.add(updateLenis);
      gsap.ticker.lagSmoothing(0);

      onRefresh = () => {
        lenis.resize();
        if (targetId && targetId !== 'home' && isInitialTargetScroll) {
          performScrollTo(true);
        }
      };
      ScrollTrigger.addEventListener('refresh', onRefresh);
    }

    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    let isInitialTargetScroll = Boolean(targetId && targetId !== 'home');

    const handleUserInteraction = () => {
      isInitialTargetScroll = false;
    };
    window.addEventListener('wheel', handleUserInteraction, { passive: true, once: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true, once: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true, once: true });

    const performScrollTo = (immediate = true) => {
      if (!targetId || targetId === 'home') {
        setIsReady(true);
        return;
      }
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;
      const navbarHeight = 65;
      const rect = targetEl.getBoundingClientRect();
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetTop = rect.top + currentScrollTop - navbarHeight;

      if (lenisInstance) {
        lenisInstance.scrollTo(targetEl, { offset: -navbarHeight, immediate });
      }
      window.scrollTo({ top: Math.max(0, targetTop), behavior: immediate ? 'instant' : 'smooth' });

      if (window.history.replaceState) {
        window.history.replaceState(null, '', `#${targetId}`);
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('activeSiteSection', targetId);
      }
      setIsReady(true);
    };

    if (targetId && targetId !== 'home') {
      // Instantly position at target on manual reload and back navigation
      performScrollTo(true);
      requestAnimationFrame(() => performScrollTo(true));
      setTimeout(() => performScrollTo(true), 60);
      setTimeout(() => performScrollTo(true), 160);
      setTimeout(() => performScrollTo(true), 350);
      setTimeout(() => performScrollTo(true), 650);
      setTimeout(() => performScrollTo(true), 1000);
      setTimeout(() => {
        performScrollTo(true);
        isInitialTargetScroll = false;
      }, 1500);
    }

    const timer = setTimeout(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      if (targetId && targetId !== 'home') performScrollTo(true);
    }, 180);

    // Track active visible section and sync hash and sessionStorage
    const handleScrollHash = () => {
      if (isInitialTargetScroll) return;
      const sectionIds = ['home', 'about', 'gallery', 'services', 'properties', 'projects', 'contact'];
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPosition = currentScrollTop + 250;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const sec = document.getElementById(sectionIds[i]);
        if (sec) {
          const rect = sec.getBoundingClientRect();
          const secTop = rect.top + currentScrollTop;
          if (scrollPosition >= secTop) {
            const activeId = sectionIds[i];
            const expectedHash = `#${activeId}`;
            if (window.location.hash !== expectedHash) {
              window.history.replaceState(null, '', expectedHash);
            }
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('activeSiteSection', activeId);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScrollHash, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScrollHash);
      window.removeEventListener('wheel', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      if (onRefresh) {
        ScrollTrigger.removeEventListener('refresh', onRefresh);
      }
      if (updateLenis) {
        gsap.ticker.remove(updateLenis);
      }
      if (lenisInstance) {
        lenisInstance.destroy();
        if (typeof window !== 'undefined' && window.lenis === lenisInstance) {
          window.lenis = null;
        }
      }
    };
  }, [location]);

  return (
    <div
      className="font-sans text-white bg-transparent antialiased selection:bg-amber-500 selection:text-black overflow-x-hidden w-full relative transition-opacity duration-200"
      style={{ opacity: isReady ? 1 : 0 }}
    >
      <MouseInteractiveBg />
      <Navbar />
      <main className="w-full overflow-x-hidden relative z-10 bg-transparent">
        {/* 1. HOME — Hero Scrubbing */}
        <ConstructionStory />

        <AnimatedSectionDivider />

        {/* 2. ABOUT US — Why Choose Us & What Our Clients Say */}
        <WhyChooseUs />

        <AnimatedSectionDivider />

        {/* 3. GALLERY — Continuous Showcase Marquee */}
        <Gallery />

        <AnimatedSectionDivider />

        {/* 4. OUR SERVICES — What We Do */}
        <Services />

        <AnimatedSectionDivider />

        {/* 5. PROPERTIES — Featured Properties */}
        <FeaturedProperties onOpenProperty={(item, type) => setActivePropertyModal({ item, type })} />

        <AnimatedSectionDivider />

        {/* 6. PROJECTS — SEE HOW IT TAKES SHAPE */}
        <Projects onOpenProject={(item) => setActiveProjectModal(item)} />

        <AnimatedSectionDivider />

        {/* 7. CONTACT US — Have a Property in Mind */}
        <ContactCTA />
      </main>
      <Footer />
      <MobileQuickActions />

      {/* Property Detail Full-Screen Overlay Modal (Zero page reload / Zero moving to home) */}
      {activePropertyModal && (
        <PropertyDetailPage
          isModal={true}
          modalItem={activePropertyModal.item}
          modalType={activePropertyModal.type}
          onClose={() => setActivePropertyModal(null)}
        />
      )}

      {/* Project Detail Full-Screen Overlay Modal (Zero page reload / Zero moving to home) */}
      {activeProjectModal && (
        <ProjectDetailPage
          isModal={true}
          modalItem={activeProjectModal}
          onClose={() => setActiveProjectModal(null)}
        />
      )}
    </div>
  );
};

const ManifestManager = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const isAdmin = location.pathname.startsWith('/admin') || window.location.hash.includes('admin');
    const targetManifest = isAdmin ? '/manifest-admin.json' : '/manifest-main.json';
    let link = document.querySelector("link[rel='manifest']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    const currentHref = link.getAttribute('href') || '';
    if (!currentHref.startsWith(targetManifest)) {
      link.setAttribute('href', targetManifest);
    }
  }, [location.pathname]);

  return null;
};


function App() {
  return (
    <SiteDataProvider>
      <ManifestManager />
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/property-details" element={<PropertyDetailPage />} />
        <Route path="/project-details" element={<ProjectDetailPage />} />
        <Route path="/all-properties" element={<AllPropertiesPage />} />
        <Route path="/all-projects" element={<AllProjectsPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<MainSite />} />
      </Routes>
    </SiteDataProvider>
  );
}

export default App;

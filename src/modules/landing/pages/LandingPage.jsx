import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../../shared/services/API';
import { SEO } from '../../../shared';


import logo from '../../../assets/landing/logo-removebg-preview.svg';
import discoverSvg from '../../../assets/landing/discover.svg';
import card1 from '../../../assets/landing/card1.svg';
import card2 from '../../../assets/landing/card2.svg';
import card3 from '../../../assets/landing/card3.svg';
import line1 from '../../../assets/landing/line1.svg';
import line2 from '../../../assets/landing/line2.svg';
import line3 from '../../../assets/landing/line3.svg';

const RevealOnScroll = ({ children, className = '' }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const base = 'transition-all duration-700 ease-out will-change-transform';
  const hidden = 'opacity-0 translate-y-8';
  const shown = 'opacity-100 translate-y-0';

  return (
    <div ref={ref} className={`${base} ${visible ? shown : hidden} ${className}`}>
      {children}
    </div>
  );
};

const ScrollStretchedBrandText = () => {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const container = containerRef.current;
    const text = textRef.current;
    if (!wrapper || !container || !text) return;

    let targetScaleY = 0;
    let currentScaleY = 0;
    let targetTranslateY = -80;
    let currentTranslateY = -80;
    let rAFId = null;
    let isRunning = false;

    const updateHeights = () => {
      const unscaledHeight = text.offsetHeight;
      const computedStyle = window.getComputedStyle(container);
      const padding = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);

      wrapper.style.height = `${unscaledHeight * 2 + padding}px`;

      container.style.height = `${unscaledHeight * Math.max(1, currentScaleY) + padding}px`;
    };

    const animate = () => {
      const diffScaleY = targetScaleY - currentScaleY;
      const diffTranslateY = targetTranslateY - currentTranslateY;

      if (Math.abs(diffScaleY) < 0.001 && Math.abs(diffTranslateY) < 0.05) {
        currentScaleY = targetScaleY;
        currentTranslateY = targetTranslateY;
        text.style.transform = `translateY(${currentTranslateY}px) scaleY(${currentScaleY})`;

        const unscaledHeight = text.offsetHeight;
        const computedStyle = window.getComputedStyle(container);
        const padding = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
        container.style.height = `${unscaledHeight * Math.max(1, currentScaleY) + padding}px`;

        isRunning = false;
        return;
      }

      currentScaleY += diffScaleY * 1;
      currentTranslateY += diffTranslateY * 1;
      text.style.transform = `translateY(${currentTranslateY}px) scaleY(${currentScaleY})`;

      const unscaledHeight = text.offsetHeight;
      const computedStyle = window.getComputedStyle(container);
      const padding = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
      container.style.height = `${unscaledHeight * Math.max(1, currentScaleY) + padding}px`;

      rAFId = requestAnimationFrame(animate);
    };

    const handleScroll = () => {
      const viewportHeight = window.innerHeight;
      const currentScroll = window.scrollY;

      const maxScroll = document.documentElement.scrollHeight - viewportHeight;

      const rect = wrapper.getBoundingClientRect();
      const wrapperTop = rect.top + currentScroll;
      const startScroll = wrapperTop - viewportHeight + 1;
      const endScroll = maxScroll;

      let progress = 0;
      if (endScroll > startScroll) {
        progress = (currentScroll - startScroll) / (endScroll - startScroll);
        progress = Math.max(0, Math.min(1, progress));
      } else {
        progress = 1;
      }

      // Apply smoothstep easing to start/end transitions smoothly
      const easedProgress = progress * progress * (3 - 2 * progress);

      targetScaleY = easedProgress * 1.85;
      targetTranslateY = (1 - easedProgress) * -80;

      if (!isRunning) {
        isRunning = true;
        rAFId = requestAnimationFrame(animate);
      }
    };

    const handleResize = () => {
      updateHeights();
      handleScroll();
    };

    updateHeights();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (rAFId) {
        cancelAnimationFrame(rAFId);
      }
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="max-w-full relative w-full overflow-hidden"
    >
      <div
        ref={containerRef}
        className="absolute top-0 left-0 w-full flex flex-col justify-start items-center pt-10 pb-0 text-center"
      >
        <h2
          ref={textRef}
          style={{
            transform: 'translateY(-80px) scaleY(0)',
            transformOrigin: 'top center',
          }}
          className="text-[16vw] md:text-[20vw] font-black tracking-[-0.08em] uppercase leading-[0.55] text-[#1E2022] select-none font-sans inline-block w-full"
        >
          SPACEHUB
        </h2>
      </div>
    </div>
  );
};



const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const scrollToSection = (sectionId) => {
    const id = sectionId === 'features' ? 'Features' : sectionId;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleMenuClick = (section) => {
    setIsMenuOpen(false);
    if (section === 'login') {
      navigate('/login');
    } else {
      scrollToSection(section);
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setTimeout(() => {
          scrollToSection(hash);
        }, 100);
      }
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    const handleAnchorClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (anchor && anchor.getAttribute('href') !== '#') {
        const href = anchor.getAttribute('href');
        const hash = href.slice(1);
        if (hash) {
          e.preventDefault();
          scrollToSection(hash);
          window.history.pushState(null, '', href);
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage('');
    if (!email.trim()) {
      setSubmitMessage('Please enter your email address');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setSubmitMessage('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    const sendEmailUrl = BASE_URL ? `${BASE_URL}dashboard/send-email` : 'https://spacehub.monu14.me/api/v1/dashboard/send-email';
    try {
      const response = await fetch(sendEmailUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email.trim(),
          subject: 'Welcome to SpaceHub',
          message: `Hey ${email.split('@')[0].trim},

 Welcome to Spacehub! 🌌 We’re stoked to have you join our growing community of explorers, creators, and curious minds.

Spacehub is all about connecting people who love to share ideas, build cool things, and hang out in a chill, positive space. Whether you’re here to chat, collaborate, or just vibe with others who get you — you’re in the right place.`
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage('Thank you! We\'ve sent you a welcome email.');
        setEmail('');
      } else {
        setSubmitMessage(data?.message || data?.error || 'Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSubmitMessage('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const landingSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://www.spacehubx.me/#website',
        url: 'https://www.spacehubx.me/',
        name: 'SpaceHUB',
        description: 'A unified workspace for teams to chat, share, and build together.',
        inLanguage: 'en-US',
      },
      {
        '@type': 'Organization',
        '@id': 'https://www.spacehubx.me/#organization',
        name: 'SpaceHUB',
        url: 'https://www.spacehubx.me/',
        logo: 'https://www.spacehubx.me/favicon.png',

        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+91-7037123786',
          contactType: 'customer support',
          email: 'hello@spacehub.com',
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'SpaceHUB',
        operatingSystem: 'All',
        applicationCategory: 'BusinessApplication',
        'offers': {
          '@type': 'Offer',

          price: '0',
          priceCurrency: 'USD',
        },
        description: 'Work smarter together with organized chat rooms, voice spaces, and shared workspaces.',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#f3f3f3] text-gray-900">
      <SEO
        title="Unified Team Workspace & Collaboration Platform"
        description="Work smarter together with organized chat rooms, voice spaces, and shared workspaces. SpaceHUB brings your team, projects, and files together under one connected platform."
        keywords="SpaceHUB, team workspace, real-time messaging, group chat, team collaboration, voice chat, workspace software"
        jsonLd={landingSchema}
      />


      {/* HEADER */}
      <header className="w-full sticky top-0 left-0 px-4 sm:px-10 py-4 sm:py-6 flex items-center justify-between bg-white rounded-b-lg shadow-sm z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              try {
                window.location.assign('/');
              } catch {
                navigate('/');
              }
            }}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img src={logo} alt="SpaceHUB logo" className="w-8 h-8 sm:w-10 sm:h-10" />
          </button>
          <span className="text-lg sm:text-xl font-bold text-gray-800">SPACEHUB</span>
        </div>

        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={() => !isMenuOpen && setIsMenuOpen(true)}
          className={`md:hidden p-2 text-gray-700 hover:text-gray-900 transition-colors ${isMenuOpen ? 'invisible pointer-events-none' : ''
            }`}
          aria-label="Open menu"
          disabled={isMenuOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-10">
          {/* <a href="#Features" className="text-gray-700 hover:text-gray-900 transition-colors">Features</a> */}
          <a href="#Contact" className="text-gray-700 hover:text-gray-900 transition-colors">Contact</a>
          <a href="#About" className="text-gray-700 hover:text-gray-900 transition-colors">About</a>
        </nav>
        <Link to="/login" className="hidden md:block bg-gradient-to-r from-red-500 to-blue-600 text-white px-4 sm:px-6 py-2 rounded-sm font-medium transition-all text-sm sm:text-base">
          Login
        </Link>
      </header>

      {/* Mobile Hamburger Menu */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-[70%] max-w-sm bg-white z-50 md:hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="SpaceHub" className="w-8 h-8" />
                  <span className="text-lg font-semibold text-gray-800">SPACEHUB</span>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <nav className="flex-1 p-4 space-y-4">
              {/* <button
                onClick={() => handleMenuClick('Features')}
                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-300 rounded-md transition-colors font-medium"
              >
                Features
              </button> */}
              <button
                onClick={() => handleMenuClick('About')}
                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-300 rounded-md transition-colors font-medium"
              >
                About
              </button>
              <button
                onClick={() => handleMenuClick('Contact')}
                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-300 rounded-md transition-colors font-medium"
              >
                Contact
              </button>
              <button
                onClick={() => handleMenuClick('login')}
                className="w-full text-left px-4 py-3 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors"
              >
                Login
              </button>
            </nav>
          </div>
        </>
      )}

      {/* MAIN CONTENT LANDMARK */}
      <main id="main-content">
        {/* HERO SECTION / FEATURES */}

      <section
        id="Home"
        className="w-full min-h-[37rem] sm:min-h-screen py-8 sm:py-12 lg:py-16 relative px-4 sm:px-6"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cline x1='0' y1='40' x2='80' y2='40' stroke='%23D4D4D8' stroke-width='1' stroke-dasharray='4 4' /%3E%3Cline x1='40' y1='0' x2='40' y2='80' stroke='%23D4D4D8' stroke-width='1' stroke-dasharray='4 4' /%3E%3Cpath d='M37 40 h6 M40 37 v6' stroke='%23A1A1AA' stroke-width='1' /%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '80px 80px',
        }}
      >
        <RevealOnScroll className="text-center relative z-10 max-w-5xl mx-auto">
          <div className="relative bg-transparent p-8 sm:px-12 md:px-16 lg:px-26 max-w-5xl mx-auto mt-10">
            {/* Border lines extending past corners
            <div className="absolute top-0 -left-6 -right-6 h-[2px] bg-purple-600/80"></div>
            <div className="absolute bottom-0 -left-6 -right-6 h-[2px] bg-purple-600/80"></div>
            <div className="absolute left-0 -top-6 -bottom-6 w-[2px] bg-purple-600/80"></div>
            <div className="absolute right-0 -top-6 -bottom-6 w-[2px] bg-purple-600/80"></div> */}

            {/* Corner square markers
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-purple-600 border border-white z-10"></div>
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-purple-600 border border-white z-10"></div>
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-purple-600 border border-white z-10"></div>
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-purple-600 border border-white z-10"></div> */}

            <div className="inline-block relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-blue-600 rounded-md p-0.5">
                <div className="bg-red-100 rounded-md h-full w-full"></div>
              </div>

              <div className="relative bg-red-100 rounded-md px-4 sm:px-6 py-2 m-1">
                <p className="text-gray-800 font-medium text-sm sm:text-base">Connect your team and collaborate seamlessly</p>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-[500] text-gray-900 mb-4 sm:mb-6 leading-normal mt-10">
              A unified workspace for teams to{' '}
              <span className="bg-gradient-to-r from-orange-400 to-purple-600 bg-clip-text text-transparent">
                chat, share, and build
              </span>{' '}
              together
            </h1>

            <p className="text-base font-[500] sm:text-lg text-gray-700 max-w-4xl mx-auto px-4">
              Work smarter together with organized chat rooms, voice spaces, and shared workspaces.
            </p>
            <p className="text-base font-[500] sm:text-lg text-gray-700 mb-6 sm:mb-8 max-w-4xl mx-auto px-4">
              Bring your team, projects, and files together under one connected platform.
            </p>

            <Link
              to="/signup"
              className="inline-block bg-gradient-to-r from-red-500 to-blue-600 text-white px-3 sm:px-5 py-5 rounded-md font-semibold text-base sm:text-lg transition-all"
            >
              Get started
            </Link>
          </div>
        </RevealOnScroll>
      </section>

      {/* DISCOVER SECTION */}
      <section id="About" className="max-w-screen relative mb-7 sm:mb-[13rem]">
        <RevealOnScroll>
          <img src={discoverSvg} alt="Discover SpaceHUB real-time team chat and collaboration features" width="1200" height="675" decoding="async" className="w-full mx-auto h-auto" loading="lazy" />
        </RevealOnScroll>

        {/* LINE 1 DECORATION */}
        <img
          src={line1}
          alt=""
          aria-hidden="true"
          width="800"
          height="100"
          decoding="async"
          className="absolute hidden lg:block left-1/2 transform -translate-x-1/2 bottom-[-19.8rem] sm:bottom-[-19.8rem] w-[85%] sm:w-[70%] max-w-5xl object-contain pointer-events-none"
          loading="lazy"
        />
      </section>

      {/* JOIN YOUR WORKSPACE SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-0">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <RevealOnScroll className="order-2 lg:order-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Join your workspace</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">Step Into Your Workspace</p>
            <div className="bg-zinc-200 p-4 sm:p-6 rounded-lg shadow-md">
              <p className="text-black text-sm sm:text-base">
                SPACEHUB begins with your own workspace — a dedicated digital environment where you and your team can collaborate seamlessly. Create your SPACEHUB, invite your members, and shape how your team communicates, shares files, and achieves goals together.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll className="text-center order-1 lg:order-2">
            <img src={card1} alt="SpaceHUB digital workspace preview for team collaboration" width="600" height="400" decoding="async" className="w-full h-full object-cover rounded-md" loading="lazy" />
          </RevealOnScroll>
        </div>

        {/* LINE 2 DECORATION */}
        <img
          src={line2}
          alt=""
          aria-hidden="true"
          width="800"
          height="100"
          decoding="async"
          className="absolute hidden lg:block left-1/2 transform -translate-x-1/2 bottom-[-6rem] sm:bottom-[-8rem] w-[85%] sm:w-[70%] max-w-5xl object-contain pointer-events-none"
          loading="lazy"
        />
      </section>

      {/* JOIN THE BUZZ SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-0">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <RevealOnScroll className="text-center order-1 lg:order-1">
            <img src={card2} alt="Real-time team chat channels and direct messaging interface" width="600" height="400" decoding="async" className="w-full h-full object-cover rounded-md" loading="lazy" />
          </RevealOnScroll>

          <RevealOnScroll className="order-2 lg:order-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Join the buzz!</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">Where Conversations Come Alive</p>
            <div className="bg-zinc-200 p-4 sm:p-6 rounded-lg shadow-md">
              <p className="text-black text-sm sm:text-base">
                Every great idea starts with a conversation. Inside SPACEHUB, chat rooms and direct messages let your team exchange thoughts instantly and organize discussions by projects or topics.
              </p>
            </div>
          </RevealOnScroll>
        </div>

        {/* LINE 3 DECORATION */}
        <img
          src={line3}
          alt=""
          aria-hidden="true"
          width="800"
          height="100"
          decoding="async"
          className="absolute hidden lg:block left-1/2 transform -translate-x-1/2 bottom-[-6rem] sm:bottom-[-8rem] w-[85%] sm:w-[70%] max-w-5xl object-contain pointer-events-none"
          loading="lazy"
        />
      </section>

      {/* COLLABORATE & GROW SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <RevealOnScroll className="order-2 lg:order-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Collaborate & Grow</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">Share. Build. Create Together.</p>
            <div className="bg-zinc-200 p-4 sm:p-6 rounded-lg shadow-md">
              <p className="text-black text-sm sm:text-base">
                SPACEHUB empowers your team to collaborate effortlessly. Share files, voice ideas in real-time, and manage tasks — all within one connected platform. As your team contributes, your SPACEHUB expands — representing progress, innovation, and teamwork in motion.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll className="text-center order-1 lg:order-2">
            <img src={card3} alt="Seamless file sharing, voice spaces, and workspace growth" width="600" height="400" decoding="async" className="w-full h-full object-cover rounded-md" loading="lazy" />
          </RevealOnScroll>
        </div>
      </section>


      </main>

      {/* FOOTER */}

      <footer id="Contact" className="bg-[#F8F9FA] pt-8 text-gray-900 border-t border-gray-200/50">
        <div className="max-w-full mx-auto">
          <RevealOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 px-4 sm:px-6 lg:px-8">

              {/* Stay in the loop */}
              <div className="md:col-span-5 flex flex-col space-y-4">
                <h3 className="text-xl font-bold text-[#1E2022]">Stay in the loop!</h3>
                <p className="text-sm text-gray-600 max-w-sm leading-relaxed">
                  Get the latest updates, features, and community stories straight to your inbox.
                </p>
                <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-gray-900 placeholder-gray-400 text-sm transition-all"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-[#1E2022] hover:bg-black text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Subscribe'}
                  </button>
                </form>
                {submitMessage && (
                  <p className={`text-sm ${submitMessage.includes('Thank you') ? 'text-green-600' : 'text-red-600'}`}>
                    {submitMessage}
                  </p>
                )}
              </div>

              {/* Quick Links */}
              <div className="md:col-span-3 md:col-start-7 flex flex-col space-y-4">
                <h3 className="text-base font-bold text-[#1E2022]">Quick links</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#Home" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Home</a>
                  </li>
                  <li>
                    <a href="#About" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">About</a>
                  </li>
                  <li>
                    <a href="#Contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
                  </li>
                </ul>
              </div>

              {/* Contact Us */}
              <div className="md:col-span-3 flex flex-col space-y-4">
                <h3 className="text-base font-bold text-[#1E2022]">Contact us</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <a href="mailto:vishwajeetrajput282@gmail.com" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">hello@spacehub.com</a>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.157-.44.009-.927.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25Z" />
                    </svg>
                    <a href="tel:+917037123786" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">+91 7037123786</a>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0Z" />
                    </svg>
                    <span className="text-sm text-gray-600">Ghaziabad, Uttar Pradesh, INDIA</span>
                  </li>
                </ul>
              </div>

            </div>
          </RevealOnScroll>


          {/* Huge Spacehub brand text */}
          <ScrollStretchedBrandText />

          {/* Divider */}
          <div className="px-4 sm:px-6 lg:px-8">
            <hr className="border-t border-gray-200/80" />
          </div>
          {/* Bottom Copyright & Terms */}
          <RevealOnScroll className="flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-xs font-semibold tracking-tight text-gray-500 uppercase py-5 px-4 sm:px-6 lg:px-8">
            <p>© 2025 SPACEHUB. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
            </div>
          </RevealOnScroll>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage

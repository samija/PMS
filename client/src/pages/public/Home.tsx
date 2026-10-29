import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  Wrench,
  ArrowRight,
  MapPin,
  Shield,
  BarChart3,
  Bell,
  FileText,
  ChevronDown,
  Star,
  Zap,
  Globe,
  CheckCircle2,
  Play,
  ArrowUpRight,
  Phone,
  Mail,
} from 'lucide-react';
import { listingAPI } from '../../services/api';

/* ─── Hooks ─── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Counter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─── Visual Components ─── */
function Orb({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} style={style} />;
}

function GeometricPattern({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="ethioGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 0L40 20L20 40L0 20Z" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.3" />
          <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.2" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#ethioGrid)" />
    </svg>
  );
}

/* ─── Image URLs (Unsplash – Ethiopian & African architecture/real estate) ─── */
const IMG = {
  hero: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop&q=80',
  building1: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop&q=80',
  building2: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop&q=80',
  interior1: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop&q=80',
  interior2: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop&q=80',
  aerial: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&h=400&fit=crop&q=80',
  modern: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop&q=80',
  apartment: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop&q=80',
  kitchen: 'https://images.unsplash.com/photo-1600566753086-00f18f6b6637?w=600&h=400&fit=crop&q=80',
  pool: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop&q=80',
  lobby: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop&q=80',
};

export default function Home() {
  const { data: featuredData } = useQuery({
    queryKey: ['featured-listings'],
    queryFn: () => listingAPI.getFeatured(),
  });
  const featuredListings = featuredData?.data?.data || [];

  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const s1 = useInView();
  const s2 = useInView();
  const s3 = useInView();
  const s4 = useInView();
  const s5 = useInView();
  const s6 = useInView();

  const features = [
    {
      icon: Building2,
      title: 'Property Hub',
      desc: 'Manage unlimited properties with floor-based dynamic pricing, unit tracking, and real-time vacancy monitoring.',
      color: 'from-amber-500 to-orange-600',
    },
    {
      icon: Users,
      title: 'Tenant Lifecycle',
      desc: 'From application to move-out. Digital leases, identity verification, document management — all in one place.',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: CreditCard,
      title: 'Smart Payments',
      desc: 'Collect rent via Chapa, Telebirr, or bank transfer. Auto-reminders, receipts, and payment calendars built in.',
      color: 'from-violet-500 to-purple-600',
    },
    {
      icon: Wrench,
      title: 'Maintenance Flow',
      desc: 'Tenants submit requests, you assign and track. Priority levels, status updates, and completion tracking.',
      color: 'from-rose-500 to-pink-600',
    },
    {
      icon: Shield,
      title: 'Security & Guards',
      desc: 'Guard shift management, attendance tracking, and incident reporting for gated properties.',
      color: 'from-sky-500 to-blue-600',
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      desc: 'Occupancy rates, revenue trends, payment performance — data-driven decisions at your fingertips.',
      color: 'from-amber-600 to-yellow-500',
    },
  ];

  return (
    <div className="bg-stone-950 text-white overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        .font-display { font-family: 'DM Serif Display', serif; }
        .font-body { font-family: 'Outfit', sans-serif; }

        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(60px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(217, 119, 6, 0.3); } 50% { box-shadow: 0 0 50px rgba(217, 119, 6, 0.5); } }
        @keyframes grain { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-5%, -10%); } 50% { transform: translate(12%, 9%); } 90% { transform: translate(-1%, 7%); } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes reveal { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0% 0 0); } }

        .animate-up { animation: slideUp 0.8s ease-out forwards; }
        .animate-scale { animation: scaleIn 0.6s ease-out forwards; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .delay-5 { animation-delay: 0.5s; }

        .stagger > * { opacity: 0; }
        .stagger.visible > * { animation: slideUp 0.7s ease-out forwards; }
        .stagger.visible > *:nth-child(1) { animation-delay: 0s; }
        .stagger.visible > *:nth-child(2) { animation-delay: 0.1s; }
        .stagger.visible > *:nth-child(3) { animation-delay: 0.15s; }
        .stagger.visible > *:nth-child(4) { animation-delay: 0.2s; }
        .stagger.visible > *:nth-child(5) { animation-delay: 0.25s; }
        .stagger.visible > *:nth-child(6) { animation-delay: 0.3s; }

        .grain::before {
          content: ''; position: fixed; top: -50%; left: -50%; right: -50%; bottom: -50%;
          width: 200%; height: 200%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          animation: grain 8s steps(10) infinite; pointer-events: none; z-index: 100; opacity: 0.35;
        }

        .text-gradient {
          background: linear-gradient(135deg, #f59e0b, #d97706, #b45309, #f59e0b);
          background-size: 200% 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.06); }
        .glass-light { background: rgba(255,255,255,0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08); }

        .card-hover { transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .card-hover:hover { transform: translateY(-8px); box-shadow: 0 25px 60px -12px rgba(217, 119, 6, 0.12); }
        .card-hover:hover .card-icon { transform: scale(1.1) rotate(-5deg); }
        .card-icon { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }

        .img-reveal { animation: reveal 1.2s ease-out forwards; }

        .btn-shine { position: relative; overflow: hidden; }
        .btn-shine::after {
          content: ''; position: absolute; top: -50%; left: -60%; width: 20%; height: 200%;
          background: rgba(255,255,255,0.15); transform: rotate(25deg); transition: left 0.6s;
        }
        .btn-shine:hover::after { left: 120%; }

        .photo-grid-item { transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .photo-grid-item:hover { transform: scale(1.03); z-index: 10; }
        .photo-grid-item:hover img { filter: brightness(1.1); }
      `}</style>

      <div className="grain" />

      {/* ══════════════════════════════════════════════════════
          HERO — Full-bleed image + overlay
      ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Hero background image */}
        <div className="absolute inset-0">
          <img
            src={IMG.hero}
            alt=""
            className="w-full h-full object-cover"
            style={{ transform: `scale(1.1) translateY(${scrollY * 0.15}px)` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/90 to-stone-950/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/40" />
          <GeometricPattern className="absolute inset-0 w-full h-full text-amber-500/5" />
        </div>

        <Orb className="w-[600px] h-[600px] bg-amber-600/8 top-[-200px] right-[-100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="max-w-3xl">
            <div className="animate-up opacity-0" style={{ animationFillMode: 'forwards' }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-amber-400 text-sm font-body font-medium mb-8">
                <Zap className="w-4 h-4" />
                Ethiopia's #1 Property Management Platform
              </div>
            </div>

            <h1
              className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[0.9] tracking-tight animate-up opacity-0 delay-1"
              style={{ animationFillMode: 'forwards' }}
            >
              Property Management, <span className="text-gradient">Reimagined</span>{' '}
              <span className="italic text-stone-400">for Ethiopia</span>
            </h1>

            <p
              className="font-body text-lg sm:text-xl text-stone-300 max-w-xl leading-relaxed mt-8 animate-up opacity-0 delay-2"
              style={{ animationFillMode: 'forwards' }}
            >
              From Bole to Bahir Dar — collect rent, manage tenants, track maintenance, and grow your portfolio. All
              from one beautiful dashboard.
            </p>

            <div
              className="flex flex-wrap gap-4 mt-10 animate-up opacity-0 delay-3"
              style={{ animationFillMode: 'forwards' }}
            >
              <Link
                to="/register"
                className="btn-shine inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 rounded-2xl font-body font-bold text-lg hover:from-amber-400 hover:to-orange-500 transition-all duration-300 shadow-xl shadow-amber-600/25"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/listings"
                className="inline-flex items-center gap-3 px-8 py-4 glass-light rounded-2xl font-body font-medium text-lg text-white hover:bg-white/10 transition-all duration-300"
              >
                <Play className="w-5 h-5 fill-white" />
                See How It Works
              </Link>
            </div>

            {/* Trust markers */}
            <div
              className="flex flex-wrap items-center gap-8 mt-14 animate-up opacity-0 delay-4"
              style={{ animationFillMode: 'forwards' }}
            >
              {[
                { val: 500, suf: '+', label: 'Properties' },
                { val: 2000, suf: '+', label: 'Tenants' },
                { val: 98, suf: '%', label: 'Collection Rate' },
                { val: 15, suf: '+', label: 'Cities' },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-4">
                  {i > 0 && <div className="w-px h-10 bg-stone-700 hidden sm:block" />}
                  <div className="font-body">
                    <div className="text-2xl font-bold text-white">
                      <Counter end={s.val} suffix={s.suf} />
                    </div>
                    <div className="text-[11px] text-stone-500 uppercase tracking-wider">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
          <ChevronDown className="w-6 h-6 text-stone-500" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          LOGO BAR / TRUST
      ══════════════════════════════════════════════════════ */}
      <section className="py-12 border-y border-white/5 bg-stone-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 font-body text-stone-600 text-sm">
            <span className="text-stone-500 uppercase tracking-widest text-xs">Integrated with</span>
            <span className="text-lg font-semibold text-stone-500">Chapa</span>
            <span className="text-lg font-semibold text-stone-500">Telebirr</span>
            <span className="text-lg font-semibold text-stone-500">SantimPay</span>
            <span className="text-lg font-semibold text-stone-500">Cloudinary</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PHOTO SHOWCASE
      ══════════════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden">
        <div
          ref={s1.ref}
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${s1.inView ? 'opacity-100' : 'opacity-0 translate-y-10'}`}
        >
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl text-white">
              Beautiful Properties, <span className="italic text-stone-400">Beautiful Management</span>
            </h2>
            <p className="font-body text-stone-400 mt-4 text-lg max-w-lg mx-auto">
              From luxury apartments to residential compounds — Enderase handles them all.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="col-span-2 row-span-2 photo-grid-item rounded-2xl overflow-hidden relative group">
              <img
                src={IMG.modern}
                alt="Modern luxury home"
                className="w-full h-full object-cover min-h-[300px] sm:min-h-[400px] transition-all duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                <div className="font-body text-xs uppercase tracking-wider text-amber-400 mb-1">Featured</div>
                <div className="font-display text-xl sm:text-2xl text-white">Luxury Villas</div>
              </div>
            </div>
            <div className="photo-grid-item rounded-2xl overflow-hidden relative group">
              <img
                src={IMG.interior1}
                alt="Modern interior"
                className="w-full h-full object-cover min-h-[140px] sm:min-h-[190px] transition-all duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 to-transparent" />
            </div>
            <div className="photo-grid-item rounded-2xl overflow-hidden relative group">
              <img
                src={IMG.building1}
                alt="Office tower"
                className="w-full h-full object-cover min-h-[140px] sm:min-h-[190px] transition-all duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 to-transparent" />
            </div>
            <div className="photo-grid-item rounded-2xl overflow-hidden relative group">
              <img
                src={IMG.kitchen}
                alt="Modern kitchen"
                className="w-full h-full object-cover min-h-[140px] sm:min-h-[190px] transition-all duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 to-transparent" />
            </div>
            <div className="photo-grid-item rounded-2xl overflow-hidden relative group">
              <img
                src={IMG.pool}
                alt="Pool area"
                className="w-full h-full object-cover min-h-[140px] sm:min-h-[190px] transition-all duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════ */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-stone-900/30 to-stone-950" />
        <Orb className="w-[500px] h-[500px] bg-amber-600/5 top-[20%] right-[-10%]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            ref={s2.ref}
            className={`transition-all duration-1000 ${s2.inView ? 'opacity-100' : 'opacity-0 translate-y-10'}`}
          >
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-amber-400 text-xs font-body font-medium uppercase tracking-widest mb-6">
                  <Globe className="w-3.5 h-3.5" /> Platform Features
                </div>
                <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-tight">
                  Six powerful modules, <span className="italic text-stone-400">one platform</span>
                </h2>
              </div>
              <p className="font-body text-stone-400 text-lg max-w-md">
                Every tool a property owner needs — designed with Ethiopian landlords in mind.
              </p>
            </div>
          </div>

          <div
            ref={s3.ref}
            className={`stagger ${s3.inView ? 'visible' : ''} grid sm:grid-cols-2 lg:grid-cols-3 gap-5`}
          >
            {features.map((f) => (
              <div key={f.title} className="card-hover glass rounded-2xl p-8 group relative overflow-hidden">
                <div
                  className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${f.color} opacity-[0.04] rounded-bl-full group-hover:opacity-[0.08] transition-opacity duration-700`}
                />
                <div
                  className={`card-icon inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} mb-6 shadow-lg`}
                >
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display text-xl text-white mb-3">{f.title}</h3>
                <p className="font-body text-stone-400 text-sm leading-relaxed">{f.desc}</p>
                <ArrowUpRight className="w-5 h-5 text-stone-600 group-hover:text-amber-400 mt-6 transition-colors duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          DASHBOARD PREVIEW — Side by side with image
      ══════════════════════════════════════════════════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/15 via-stone-950 to-stone-950" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            ref={s4.ref}
            className={`grid lg:grid-cols-2 gap-16 items-center transition-all duration-1000 ${s4.inView ? 'opacity-100' : 'opacity-0 translate-y-10'}`}
          >
            {/* Left — Image + floating cards */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/40">
                <img
                  src={IMG.lobby}
                  alt="Modern building lobby"
                  className="w-full h-[500px] object-cover"
                  loading="lazy"
                />
              </div>

              {/* Floating revenue card */}
              <div
                className="absolute -bottom-6 -right-4 sm:-right-8 glass-light rounded-2xl p-5 shadow-2xl shadow-black/30 max-w-[240px]"
                style={{ animation: 'float 7s ease-in-out infinite' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-body text-stone-400 uppercase tracking-wider">Monthly Revenue</div>
                    <div className="text-lg font-body font-bold text-white">ETB 2.4M</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-body font-medium">
                  <ArrowUpRight className="w-3 h-3" /> 12% from last month
                </div>
              </div>

              {/* Floating occupancy card */}
              <div
                className="absolute -top-4 -left-2 sm:-left-6 glass-light rounded-2xl p-4 shadow-2xl shadow-black/30"
                style={{ animation: 'float 5s ease-in-out infinite 0.5s' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-[3px] border-amber-400 flex items-center justify-center">
                    <span className="font-body font-bold text-amber-400 text-sm">94%</span>
                  </div>
                  <div>
                    <div className="text-sm font-body font-semibold text-white">Occupancy</div>
                    <div className="text-[10px] font-body text-stone-400">186 of 198 units</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Content */}
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-amber-400 text-xs font-body font-medium uppercase tracking-widest mb-6">
                  Dashboard Preview
                </div>
                <h2 className="font-display text-4xl sm:text-5xl text-white leading-tight">
                  Your entire portfolio, <span className="text-gradient">at a glance</span>
                </h2>
                <p className="font-body text-stone-400 text-lg mt-4 leading-relaxed">
                  Revenue analytics, occupancy tracking, payment status, maintenance queue — everything you need to make
                  confident decisions about your properties.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: BarChart3, text: 'Real-time revenue and occupancy analytics' },
                  { icon: Bell, text: 'Automated payment reminders and notifications' },
                  { icon: FileText, text: 'Digital lease agreements with e-signatures' },
                  { icon: Shield, text: 'Identity verification and document management' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-amber-600/10 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-600/20 transition-colors">
                      <item.icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="font-body text-stone-300">{item.text}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/register"
                className="btn-shine inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 rounded-2xl font-body font-bold text-lg hover:from-amber-400 hover:to-orange-500 transition-all duration-300 shadow-xl shadow-amber-600/20"
              >
                Try the Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-stone-900/20 to-stone-950" />
        <GeometricPattern className="absolute inset-0 w-full h-full text-amber-500/[0.03]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            ref={s5.ref}
            className={`transition-all duration-1000 ${s5.inView ? 'opacity-100' : 'opacity-0 translate-y-10'}`}
          >
            <div className="text-center max-w-2xl mx-auto mb-20">
              <h2 className="font-display text-4xl sm:text-5xl text-white">
                Up and running in <span className="text-gradient">3 minutes</span>
              </h2>
              <p className="font-body text-stone-400 mt-4 text-lg">
                No training required. If you can use WhatsApp, you can use Enderase.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Add Your Properties',
                  desc: 'Enter property details, define units with floor-based pricing. Upload photos and go live in minutes.',
                  icon: Building2,
                  img: IMG.building2,
                },
                {
                  step: '02',
                  title: 'Onboard Tenants',
                  desc: 'Invite tenants via email or phone. They verify identity, sign leases digitally, and start paying online.',
                  icon: Users,
                  img: IMG.interior2,
                },
                {
                  step: '03',
                  title: 'Manage & Grow',
                  desc: 'Track payments, handle maintenance requests, analyze performance. Scale from 1 to 100 properties.',
                  icon: BarChart3,
                  img: IMG.aerial,
                },
              ].map((item, i) => (
                <div key={item.step} className="relative group">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-24 left-[60%] w-[80%] border-t border-dashed border-stone-700/50 pointer-events-none" />
                  )}
                  <div className="glass rounded-2xl overflow-hidden card-hover">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent" />
                      <div className="absolute top-4 left-4 font-display text-5xl text-amber-500/20">{item.step}</div>
                    </div>
                    <div className="p-6">
                      <div className="w-10 h-10 rounded-xl bg-amber-600/10 flex items-center justify-center mb-4 -mt-12 relative z-10 border border-stone-800">
                        <item.icon className="w-5 h-5 text-amber-400" />
                      </div>
                      <h3 className="font-display text-xl text-white mb-2">{item.title}</h3>
                      <p className="font-body text-stone-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════ */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 via-stone-950 to-orange-600/10" />
        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <div className="glass-light rounded-3xl p-10 sm:p-16 text-center">
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-12">
              Trusted by property owners across Ethiopia
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: 500, suffix: '+', label: 'Properties Managed' },
                { value: 12, suffix: 'M+', label: 'ETB Collected' },
                { value: 15, suffix: '+', label: 'Cities Covered' },
                { value: 99.9, suffix: '%', label: 'Uptime' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-4xl sm:text-5xl text-gradient">
                    <Counter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="font-body text-xs text-stone-500 mt-2 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════ */}
      <section className="relative py-32">
        <Orb className="w-[400px] h-[400px] bg-violet-600/5 bottom-[10%] left-[-5%]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            ref={s6.ref}
            className={`transition-all duration-1000 ${s6.inView ? 'opacity-100' : 'opacity-0 translate-y-10'}`}
          >
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl sm:text-5xl text-white">Loved by property owners</h2>
              <p className="font-body text-stone-400 mt-4 text-lg">Real stories from real Ethiopian landlords</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Abebe Kebede',
                  role: 'Property Owner',
                  city: 'Addis Ababa',
                  quote:
                    'I used to chase tenants for rent every month. Now payments come in automatically through Chapa. Enderase saved my sanity and my time.',
                  properties: 12,
                  img: IMG.building1,
                },
                {
                  name: 'Tigist Haile',
                  role: 'Real Estate Investor',
                  city: 'Hawassa',
                  quote:
                    'The maintenance tracking alone is worth it. My tenants are happier, properties in better shape, and I have the analytics to prove it.',
                  properties: 8,
                  img: IMG.interior1,
                },
                {
                  name: 'Dawit Mekonnen',
                  role: 'Building Manager',
                  city: 'Bahir Dar',
                  quote:
                    'Managing 3 buildings with 60+ units was chaos before Enderase. Now I handle everything from my phone during coffee.',
                  properties: 3,
                  img: IMG.apartment,
                },
              ].map((t) => (
                <div key={t.name} className="glass rounded-2xl overflow-hidden card-hover group">
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={t.img}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent" />
                  </div>
                  <div className="p-6 -mt-8 relative z-10">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="font-body text-stone-300 leading-relaxed text-sm">"{t.quote}"</p>
                    <div className="mt-6 flex items-center gap-4 pt-4 border-t border-white/5">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-body font-bold text-stone-950 text-sm flex-shrink-0">
                        {t.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <div className="font-body font-semibold text-white text-sm">{t.name}</div>
                        <div className="font-body text-xs text-stone-500">
                          {t.role}, {t.city} · {t.properties} properties
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURED LISTINGS
      ══════════════════════════════════════════════════════ */}
      {featuredListings.length > 0 && (
        <section className="relative py-32">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-12">
              <div>
                <h2 className="font-display text-4xl text-white">Featured Properties</h2>
                <p className="font-body text-stone-400 mt-2">Discover your next home</p>
              </div>
              <Link
                to="/listings"
                className="font-body text-amber-400 hover:text-amber-300 flex items-center gap-2 transition-colors font-medium"
              >
                View all listings <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.slice(0, 6).map((property: any) => (
                <Link key={property._id} to={`/listings/${property._id}`} className="group">
                  <div className="glass rounded-2xl overflow-hidden card-hover">
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={property.images?.[0] || IMG.apartment}
                        alt={property.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent" />
                      <div className="absolute bottom-3 left-3 font-body text-xs px-3 py-1 rounded-full bg-amber-500/90 text-stone-950 font-semibold">
                        {property.availableUnits || 0} units available
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-lg text-white">{property.name}</h3>
                      <div className="flex items-center text-stone-400 text-sm mt-1 font-body">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-amber-500" />
                        {property.address?.city}, {property.address?.state}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════ */}
      <section className="relative py-32">
        <div className="absolute inset-0">
          <img src={IMG.building2} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-stone-950/85" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950" />
        </div>
        <GeometricPattern className="absolute inset-0 w-full h-full text-amber-500/[0.03]" />
        <Orb className="w-[600px] h-[600px] bg-amber-600/10 top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-tight">
            Ready to manage your properties <span className="text-gradient">the modern way?</span>
          </h2>
          <p className="font-body text-lg text-stone-300 mt-6 max-w-xl mx-auto">
            Join hundreds of Ethiopian property owners who switched to Enderase. Free to start. No credit card required.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="btn-shine inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 rounded-2xl font-body font-bold text-lg hover:from-amber-400 hover:to-orange-500 transition-all duration-300 shadow-2xl shadow-amber-600/30"
              style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/listings"
              className="inline-flex items-center gap-3 px-10 py-5 glass-light rounded-2xl font-body font-medium text-lg text-white hover:bg-white/10 transition-all duration-300"
            >
              Browse Properties
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 font-body text-sm text-stone-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free forever plan
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Setup in 3 minutes
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PRE-FOOTER CONTACT STRIP
      ══════════════════════════════════════════════════════ */}
      <section className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="font-body text-stone-400 text-sm">Have questions? We're here to help.</div>
            <div className="flex flex-wrap items-center gap-6">
              <a
                href="mailto:support@enderase.com"
                className="flex items-center gap-2 font-body text-sm text-stone-300 hover:text-amber-400 transition-colors"
              >
                <Mail className="w-4 h-4" /> support@enderase.com
              </a>
              <a
                href="tel:+251911123456"
                className="flex items-center gap-2 font-body text-sm text-stone-300 hover:text-amber-400 transition-colors"
              >
                <Phone className="w-4 h-4" /> +251 911 123 456
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

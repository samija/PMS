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
} from 'lucide-react';
import { listingAPI } from '../../services/api';

/* ─── Intersection Observer Hook ─── */
function useInView(threshold = 0.15) {
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

/* ─── Animated Counter ─── */
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

/* ─── Geometric Pattern SVG ─── */
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

/* ─── Floating Orb ─── */
function Orb({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} style={style} />;
}

export default function Home() {
  const { data: featuredData } = useQuery({
    queryKey: ['featured-listings'],
    queryFn: () => listingAPI.getFeatured(),
  });

  const featuredListings = featuredData?.data?.data || [];

  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const s1 = useInView();
  const s2 = useInView();
  const s3 = useInView();
  const s4 = useInView();

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
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'DM Serif Display', serif; }
        .font-body { font-family: 'Outfit', sans-serif; }

        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(60px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(217, 119, 6, 0.3); } 50% { box-shadow: 0 0 40px rgba(217, 119, 6, 0.6); } }
        @keyframes grain { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-5%, -10%); } 30% { transform: translate(3%, -15%); } 50% { transform: translate(12%, 9%); } 70% { transform: translate(9%, 4%); } 90% { transform: translate(-1%, 7%); } }

        .animate-up { animation: slideUp 0.8s ease-out forwards; }
        .animate-in { animation: slideIn 0.8s ease-out forwards; }
        .animate-scale { animation: scaleIn 0.6s ease-out forwards; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .delay-5 { animation-delay: 0.5s; }
        .delay-6 { animation-delay: 0.6s; }

        .stagger > * { opacity: 0; }
        .stagger.visible > * { animation: slideUp 0.7s ease-out forwards; }
        .stagger.visible > *:nth-child(1) { animation-delay: 0s; }
        .stagger.visible > *:nth-child(2) { animation-delay: 0.1s; }
        .stagger.visible > *:nth-child(3) { animation-delay: 0.2s; }
        .stagger.visible > *:nth-child(4) { animation-delay: 0.3s; }
        .stagger.visible > *:nth-child(5) { animation-delay: 0.4s; }
        .stagger.visible > *:nth-child(6) { animation-delay: 0.5s; }

        .grain::before {
          content: ''; position: fixed; top: -50%; left: -50%; right: -50%; bottom: -50%;
          width: 200%; height: 200%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          animation: grain 8s steps(10) infinite;
          pointer-events: none; z-index: 100; opacity: 0.4;
        }

        .text-gradient {
          background: linear-gradient(135deg, #f59e0b, #d97706, #b45309, #f59e0b);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .card-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px -12px rgba(217, 119, 6, 0.15);
        }
        .card-hover:hover .card-icon {
          transform: scale(1.1) rotate(-5deg);
        }
        .card-icon { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }

        .btn-shine {
          position: relative;
          overflow: hidden;
        }
        .btn-shine::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -60%;
          width: 20%;
          height: 200%;
          background: rgba(255, 255, 255, 0.15);
          transform: rotate(25deg);
          transition: left 0.5s;
        }
        .btn-shine:hover::after {
          left: 120%;
        }
      `}</style>

      <div className="grain" />

      {/* ════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950/40"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          />
          <GeometricPattern className="absolute inset-0 w-full h-full text-amber-500/10" />
        </div>

        <Orb className="w-[600px] h-[600px] bg-amber-600/10 top-[-200px] right-[-200px]" />
        <Orb className="w-[400px] h-[400px] bg-orange-600/8 bottom-[-100px] left-[-100px]" />
        <Orb
          className="w-[300px] h-[300px] bg-amber-400/5 top-[40%] left-[20%]"
          style={{ animation: 'float 8s ease-in-out infinite' }}
        />

        {/* Diagonal accent line */}
        <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 -right-1/4 w-[150%] h-full bg-gradient-to-bl from-amber-600/5 to-transparent transform -skew-x-12" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left: Copy */}
            <div className="lg:col-span-7 space-y-8">
              <div className="animate-up opacity-0" style={{ animationFillMode: 'forwards' }}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-amber-400 text-sm font-body font-medium mb-6">
                  <Zap className="w-4 h-4" />
                  Ethiopia's Property Management Platform
                </div>
              </div>

              <h1
                className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.9] tracking-tight animate-up opacity-0 delay-1"
                style={{ animationFillMode: 'forwards' }}
              >
                Your Properties, <span className="text-gradient">Effortlessly</span>{' '}
                <span className="italic text-stone-400">Managed</span>
              </h1>

              <p
                className="font-body text-lg sm:text-xl text-stone-400 max-w-xl leading-relaxed animate-up opacity-0 delay-2"
                style={{ animationFillMode: 'forwards' }}
              >
                From Bole to Bahir Dar — collect rent, manage tenants, track maintenance, and grow your portfolio with
                the platform built for Ethiopian landlords.
              </p>

              <div
                className="flex flex-wrap gap-4 animate-up opacity-0 delay-3"
                style={{ animationFillMode: 'forwards' }}
              >
                <Link
                  to="/register"
                  className="btn-shine inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 rounded-xl font-body font-semibold text-lg hover:from-amber-400 hover:to-orange-500 transition-all duration-300 shadow-lg shadow-amber-600/20"
                >
                  Start Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/listings"
                  className="inline-flex items-center gap-2 px-8 py-4 glass rounded-xl font-body font-medium text-lg text-white hover:bg-white/10 transition-all duration-300"
                >
                  Browse Listings
                </Link>
              </div>

              {/* Trust markers */}
              <div
                className="flex items-center gap-8 pt-4 animate-up opacity-0 delay-4"
                style={{ animationFillMode: 'forwards' }}
              >
                <div className="font-body">
                  <div className="text-2xl font-bold text-white">
                    <Counter end={500} suffix="+" />
                  </div>
                  <div className="text-xs text-stone-500 uppercase tracking-wider">Properties</div>
                </div>
                <div className="w-px h-10 bg-stone-700" />
                <div className="font-body">
                  <div className="text-2xl font-bold text-white">
                    <Counter end={2000} suffix="+" />
                  </div>
                  <div className="text-xs text-stone-500 uppercase tracking-wider">Tenants</div>
                </div>
                <div className="w-px h-10 bg-stone-700" />
                <div className="font-body">
                  <div className="text-2xl font-bold text-white">
                    <Counter end={98} suffix="%" />
                  </div>
                  <div className="text-xs text-stone-500 uppercase tracking-wider">Collection Rate</div>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div
              className="lg:col-span-5 hidden lg:block animate-scale opacity-0 delay-3"
              style={{ animationFillMode: 'forwards' }}
            >
              <div className="relative">
                {/* Floating dashboard mockup */}
                <div
                  className="relative glass rounded-2xl p-6 shadow-2xl shadow-black/40"
                  style={{ animation: 'float 6s ease-in-out infinite' }}
                >
                  {/* Mock header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div className="flex-1 h-5 bg-white/5 rounded ml-4" />
                  </div>
                  {/* Mock stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { label: 'Revenue', value: 'ETB 2.4M', change: '+12%', color: 'text-emerald-400' },
                      { label: 'Occupancy', value: '94%', change: '+3%', color: 'text-amber-400' },
                      { label: 'Active', value: '186', change: '+8', color: 'text-violet-400' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white/5 rounded-xl p-3">
                        <div className="text-[10px] text-stone-500 font-body uppercase tracking-wider">
                          {stat.label}
                        </div>
                        <div className="text-lg font-bold text-white font-body mt-1">{stat.value}</div>
                        <div className={`text-xs font-body ${stat.color}`}>{stat.change}</div>
                      </div>
                    ))}
                  </div>
                  {/* Mock chart */}
                  <div className="h-32 flex items-end gap-1">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-amber-600/60 to-amber-400/40"
                        style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Floating notification card */}
                <div
                  className="absolute -bottom-6 -left-12 glass rounded-xl p-4 shadow-xl shadow-black/30 max-w-[220px]"
                  style={{ animation: 'float 7s ease-in-out infinite 1s' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs font-body text-stone-400">Payment Received</div>
                      <div className="text-sm font-body font-semibold text-white">ETB 15,000</div>
                    </div>
                  </div>
                </div>

                {/* Floating rating card */}
                <div
                  className="absolute -top-4 -right-8 glass rounded-xl p-3 shadow-xl shadow-black/30"
                  style={{ animation: 'float 5s ease-in-out infinite 0.5s' }}
                >
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="text-xs font-body text-stone-400 mt-1">4.9 average rating</div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-stone-500" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════════════ */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-stone-900/50 to-stone-950" />
        <Orb className="w-[500px] h-[500px] bg-amber-600/5 top-[20%] right-[-10%]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={s1.ref} className={`stagger ${s1.inView ? 'visible' : ''}`}>
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-amber-400 text-xs font-body font-medium uppercase tracking-widest mb-6">
                <Globe className="w-3.5 h-3.5" /> Platform Features
              </div>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-tight">
                Everything you need, <span className="italic text-stone-400">nothing you don't</span>
              </h2>
              <p className="font-body text-lg text-stone-400 mt-6 max-w-lg">
                Six powerful modules working in concert to make property management feel like a breeze.
              </p>
            </div>
          </div>

          <div
            ref={s2.ref}
            className={`stagger ${s2.inView ? 'visible' : ''} grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16`}
          >
            {features.map((f) => (
              <div key={f.title} className="card-hover glass rounded-2xl p-8 group relative overflow-hidden">
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${f.color} opacity-5 rounded-bl-full group-hover:opacity-10 transition-opacity duration-500`}
                />
                <div
                  className={`card-icon inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} mb-6 shadow-lg`}
                >
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display text-xl text-white mb-3">{f.title}</h3>
                <p className="font-body text-stone-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-stone-950 to-stone-950" />
        <GeometricPattern className="absolute inset-0 w-full h-full text-amber-500/5" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={s3.ref} className={`stagger ${s3.inView ? 'visible' : ''}`}>
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
                  desc: 'Enter property details, define units, set pricing. Upload photos and start listing.',
                  icon: Building2,
                },
                {
                  step: '02',
                  title: 'Onboard Tenants',
                  desc: 'Invite tenants via email or phone. They verify identity, sign leases, and start paying digitally.',
                  icon: Users,
                },
                {
                  step: '03',
                  title: 'Manage & Grow',
                  desc: 'Track payments, handle maintenance, analyze performance. Everything from your dashboard.',
                  icon: BarChart3,
                },
              ].map((item, i) => (
                <div key={item.step} className="relative group">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] border-t border-dashed border-stone-700 pointer-events-none" />
                  )}
                  <div className="glass rounded-2xl p-8 card-hover relative">
                    <div className="font-display text-6xl text-amber-600/20 absolute top-4 right-6">{item.step}</div>
                    <div className="w-12 h-12 rounded-xl bg-amber-600/10 flex items-center justify-center mb-6">
                      <item.icon className="w-6 h-6 text-amber-400" />
                    </div>
                    <h3 className="font-display text-xl text-white mb-3">{item.title}</h3>
                    <p className="font-body text-stone-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SOCIAL PROOF / STATS
      ════════════════════════════════════════════════════════════ */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 via-stone-950 to-orange-600/10" />
        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <div className="glass rounded-3xl p-12 sm:p-16 text-center">
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-12">
              Trusted by property owners across Ethiopia
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: 500, suffix: '+', label: 'Properties Managed' },
                { value: 12, suffix: 'M+', label: 'ETB Collected' },
                { value: 15, suffix: '+', label: 'Cities Covered' },
                { value: 99, suffix: '%', label: 'Uptime' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-4xl sm:text-5xl text-gradient">
                    <Counter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="font-body text-sm text-stone-400 mt-2 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════════════ */}
      <section className="relative py-32">
        <Orb className="w-[400px] h-[400px] bg-violet-600/5 bottom-[10%] left-[-5%]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={s4.ref} className={`stagger ${s4.inView ? 'visible' : ''}`}>
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl sm:text-5xl text-white">What owners are saying</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Abebe Kebede',
                  role: 'Property Owner, Addis Ababa',
                  quote:
                    'I used to chase tenants for rent every month. Now payments come in automatically. Enderase saved my sanity and my time.',
                  properties: 12,
                },
                {
                  name: 'Tigist Haile',
                  role: 'Real Estate Investor, Hawassa',
                  quote:
                    'The maintenance tracking alone is worth it. My tenants are happier, my properties are in better shape, and I have data to prove it.',
                  properties: 8,
                },
                {
                  name: 'Dawit Mekonnen',
                  role: 'Building Manager, Bahir Dar',
                  quote:
                    'Managing 3 buildings with 60+ units was chaos before Enderase. Now I handle everything from my phone during breakfast.',
                  properties: 3,
                },
              ].map((t) => (
                <div key={t.name} className="glass rounded-2xl p-8 card-hover">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="font-body text-stone-300 leading-relaxed italic">"{t.quote}"</p>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-body font-bold text-stone-950">
                      {t.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <div className="font-body font-semibold text-white">{t.name}</div>
                      <div className="font-body text-xs text-stone-500">
                        {t.role} · {t.properties} properties
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FEATURED LISTINGS
      ════════════════════════════════════════════════════════════ */}
      {featuredListings.length > 0 && (
        <section className="relative py-32">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="font-display text-4xl text-white">Featured Properties</h2>
                <p className="font-body text-stone-400 mt-2">Discover your next home</p>
              </div>
              <Link
                to="/listings"
                className="font-body text-amber-400 hover:text-amber-300 flex items-center gap-2 transition-colors"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.slice(0, 6).map((property: any) => (
                <Link key={property._id} to={`/listings/${property._id}`} className="group">
                  <div className="glass rounded-2xl overflow-hidden card-hover">
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={
                          property.images?.[0] ||
                          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop'
                        }
                        alt={property.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent" />
                      <div className="absolute bottom-3 left-3 font-body text-xs px-2 py-1 rounded-full bg-amber-500/90 text-stone-950 font-medium">
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

      {/* ════════════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════════════ */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-amber-950/20 to-stone-950" />
        <GeometricPattern className="absolute inset-0 w-full h-full text-amber-500/5" />
        <Orb className="w-[500px] h-[500px] bg-amber-600/10 top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-tight">
            Ready to manage your properties <span className="text-gradient">the modern way?</span>
          </h2>
          <p className="font-body text-lg text-stone-400 mt-6 max-w-xl mx-auto">
            Join hundreds of Ethiopian property owners who switched to Enderase. Free to start. No credit card required.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="btn-shine inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 rounded-xl font-body font-bold text-lg hover:from-amber-400 hover:to-orange-500 transition-all duration-300 shadow-xl shadow-amber-600/25"
              style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 font-body text-sm text-stone-500">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Secure
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Fast Setup
            </span>
            <span className="flex items-center gap-1.5">
              <Bell className="w-4 h-4" /> Auto Reminders
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Digital Leases
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

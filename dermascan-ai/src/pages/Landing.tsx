import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers, ListOrdered, Zap, ShieldCheck, Microscope, UserCheck,
  ArrowRight, Cpu, Upload, ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLogo from '@/components/AppLogo';
import ThemeToggle from '@/components/ThemeToggle';
import homeSideImage from '@/assets/home_side.png';

const features = [
  {
    icon: Layers,
    title: 'Dual-Image Support',
    desc: 'Upload clinical or dermoscopic images — the system automatically routes to the right model.',
  },
  {
    icon: ListOrdered,
    title: 'Top-3 Differential Diagnoses',
    desc: 'Get the three most likely conditions ranked by confidence, supporting your clinical decision-making.',
  },
  {
    icon: Zap,
    title: 'Instant AI-Powered Analysis',
    desc: 'Receive predictions in seconds — no waiting, no manual lookup.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Private Access',
    desc: 'Doctor-only platform. No public registration — your cases stay confidential.',
  },
  {
    icon: Microscope,
    title: '27-Condition Coverage',
    desc: 'From common inflammatory conditions to malignant lesions — one tool for your full caseload.',
  },
  {
    icon: UserCheck,
    title: 'Decision Support, Not Replacement',
    desc: 'Designed to assist your expertise, not override it. Results are presented as probabilities, not diagnoses.',
  },
];

const steps = [
  {
    icon: Upload,
    title: 'Upload Image',
    desc: 'Doctor uploads a clinical or dermoscopic photo of the lesion.',
    number: 1,
  },
  {
    icon: Cpu,
    title: 'AI Analysis',
    desc: 'Model processes and classifies the image in seconds.',
    number: 2,
  },
  {
    icon: ClipboardList,
    title: 'Review Results',
    desc: 'Top-3 diagnoses with confidence scores to support your decision.',
    number: 3,
  },
];

function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const isDark = () => document.documentElement.classList.contains('dark');

    const PARTICLE_COUNT = 55;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 3 + 1.5,
      dx: (Math.random() - 0.5) * 0.55,
      dy: (Math.random() - 0.5) * 0.55,
      color: Math.floor(Math.random() * 3),
    }));

    const COLORS_LIGHT = [
      'rgba(29,158,117,0.6)',
      'rgba(55,138,221,0.55)',
      'rgba(127,119,221,0.5)',
    ];
    const COLORS_DARK = [
      'rgba(93,202,165,0.5)',
      'rgba(133,183,235,0.45)',
      'rgba(175,169,236,0.4)',
    ];
    const LINE_LIGHT = 'rgba(29,158,117,0.20)';
    const LINE_DARK  = 'rgba(93,202,165,0.18)';

    let raf;

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const dark = isDark();
      const colors = dark ? COLORS_DARK : COLORS_LIGHT;
      const lineColor = dark ? LINE_DARK : LINE_LIGHT;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 0.8 * (1 - dist / 150);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = colors[p.color];
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > width) p.dx *= -1;
        if (p.y < 0 || p.y > height) p.dy *= -1;
      });

      raf = requestAnimationFrame(draw);
    }

    draw();

    const onResize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <AppLogo size="lg" />
          <div className="hidden md:flex items-center gap-8">
            <a href="#home"         className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors">Home</a>
            <a href="#features"     className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#footer"       className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors">Support</a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login">
              <Button size="lg" className="rounded-lg h-8 text-xs">Login / Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        id="home"
        className="relative overflow-hidden bg-background pt-24 pb-24 px-6"
        style={{ minHeight: '100vh' }}
      >
        <ParticleCanvas />

        <div
          className="relative max-w-4xl mx-auto flex flex-col items-center text-center gap-12 lg:gap-16"
          style={{ minHeight: '70vh', zIndex: 1, position: 'relative' }}
        >
          {/* Doctor image — hero focal point */}
          <div className="relative mt-10 lg:mt-8" style={{ perspective: '1400px' }}>
            <div
              className="relative w-64 sm:w-80 lg:w-[26rem] group"
              style={{ animation: 'dermascan-float 6.5s ease-in-out infinite' }}
            >
              {/* image frame, with 3D tilt on hover */}
              <div
                className="relative rounded-[2rem] overflow-hidden transition-transform duration-500 ease-out [transform-style:preserve-3d] hover:[transform:rotateX(5deg)_rotateY(-7deg)_scale(1.03)]"
                style={{ animation: 'dermascan-hero-in 0.9s ease-out both' }}
              >
                <img
                  src={homeSideImage}
                  alt="Doctor reviewing AI-powered skin lesion analysis on a tablet"
                  className="w-full h-auto object-cover"
                />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[2rem]" />
              </div>
            </div>
          </div>

          {/* Text content */}
          <div
            className="space-y-8 flex flex-col items-center max-w-2xl"
            style={{ animation: 'dermascan-hero-in 0.9s ease-out 0.15s both' }}
          >
            <h1 className="text-4xl lg:text-5xl font-heading font-medium leading-tight tracking-tight">
              Your Intelligent Platform for Complex Diagnostic Decisions.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              An AI-powered clinical decision support system designed to help you analyze rare cases,
              provide differential diagnosis, and reduce diagnostic error rates — based on evidence-based medicine.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/request-account">
                <Button size="lg" className="rounded-lg gap-2">
                  Join as a Doctor <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="rounded-lg">
                  Already have an account? Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-heading font-medium text-center mb-12">Smart Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-card border border-border rounded-xl p-7 space-y-4 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-default group"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center transition-colors duration-300 group-hover:bg-primary/20">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-medium">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-heading font-medium text-center mb-16">How It Works</h2>
          <div className="relative flex items-start">
            <div className="absolute top-8 left-[16.67%] right-[16.67%] h-px bg-border hidden sm:block" />
            {steps.map((step) => (
              <div key={step.title} className="flex flex-col items-center text-center flex-1 px-4 relative">
                <div className="relative mb-5 z-10">
                  <div className="w-16 h-16 rounded-full bg-card border-2 border-primary/40 flex items-center justify-center shadow-sm">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary-foreground">{step.number}</span>
                  </div>
                </div>
                <h3 className="font-medium mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <AppLogo size="sm" />
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Terms of Use</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-4">
            This platform is a decision support tool (DST). The final diagnosis and clinical decision remain solely
            the responsibility of the licensed medical professional.
          </p>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} DermaScan AI. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
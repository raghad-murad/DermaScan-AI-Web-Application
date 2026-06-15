import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, ScanEye, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLogo from '@/components/AppLogo';
import ThemeToggle from '@/components/ThemeToggle';

const features = [
  {
    icon: Brain,
    title: 'Intelligent Differential Diagnosis',
    desc: 'AI scans thousands of globally validated medical protocols in seconds to match symptoms and narrow down contested diagnostic options.',
  },
  {
    icon: ScanEye,
    title: 'Advanced Computer Vision Accuracy',
    desc: 'Advanced classification of medical images and visual symptoms to help you distinguish between similar and rare skin conditions.',
  },
  {
    icon: ShieldCheck,
    title: 'HIPAA-Level Privacy & Security',
    desc: 'All patient data is encrypted and protected under strict medical data privacy standards. Your patients\' information never leaves our secure infrastructure.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <AppLogo size="md" />
          <div className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</a>
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Smart Features</a>
            <a href="#security" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Security & Trust</a>
            <a href="#footer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Support</a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login">
              <Button size="sm" className="rounded-lg">Login / Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="home" className="pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center min-h-[70vh]">
          <div className="space-y-8">
            <h1 className="text-4xl lg:text-5xl font-heading font-medium leading-tight tracking-tight">
              Your Intelligent Platform for Complex Diagnostic Decisions.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              An AI-powered clinical decision support system designed to help you analyze rare cases, provide differential diagnosis, and reduce diagnostic error rates — based on evidence-based medicine.
            </p>
            <div className="flex flex-wrap gap-4">
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
          <div className="hidden lg:block">
            <div className="relative">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-3 w-3 rounded-full bg-destructive/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-secondary/60" />
                  </div>
                  <div className="bg-muted rounded-xl p-4 space-y-3">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Analysis Results</div>
                    {[
                      { name: 'Melanoma', code: 'C43.9', conf: 78, color: 'bg-destructive' },
                      { name: 'Basal Cell Carcinoma', code: 'C44.91', conf: 15, color: 'bg-yellow-500' },
                      { name: 'Actinic Keratosis', code: 'L57.0', conf: 7, color: 'bg-secondary' },
                    ].map((p) => (
                      <div key={p.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted-foreground">{p.conf}%</span>
                        </div>
                        <div className="h-2 bg-border rounded-full overflow-hidden">
                          <div className={`h-full ${p.color} rounded-full transition-all duration-1000`} style={{ width: `${p.conf}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <div className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-md font-medium">ICD-10: C43.9</div>
                    <div className="bg-secondary/10 text-secondary text-xs px-3 py-1 rounded-md font-medium">EfficientNet-B3</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-xl p-8 space-y-4 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto">
            <ShieldCheck className="h-8 w-8 text-secondary" />
          </div>
          <h2 className="text-3xl font-heading font-medium">Built for Medical-Grade Trust</h2>
          <p className="text-muted-foreground leading-relaxed">
            Every interaction with the platform is encrypted end-to-end. Patient data is stored securely with role-based access controls, 
            ensuring only authorized medical professionals can view case information. Our infrastructure meets HIPAA compliance standards.
          </p>
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
            This platform is a decision support tool (DST). The final diagnosis and clinical decision remain solely the responsibility of the licensed medical professional.
          </p>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} DermAI Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
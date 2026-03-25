import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, BarChart3, Check } from 'lucide-react';

const steps = [
  { icon: FileText, num: '01', title: 'Paste Your Proposal', desc: 'Copy your rejected proposal into the tool' },
  { icon: MessageSquare, num: '02', title: 'Describe What Happened', desc: 'Tell us the rejection reason and client context' },
  { icon: BarChart3, num: '03', title: 'Get Your Autopsy Report', desc: 'Receive specific reasons, rewrites, and action steps' },
];

const features = [
  'Proposal Score 1 to 10',
  'Top 3 Reasons You Lost',
  'Weakest Section Identified',
  'AI Rewrite of Weak Section',
  'Action Checklist',
  'Pattern Detection Over Time',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background animate-fade-in-up">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="font-mono text-lg font-bold">
            <span className="text-foreground">Deal</span>
            <span className="text-primary">Autopsy</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Log In</Button></Link>
            <Link to="/signup"><Button size="sm">Start Free</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden dot-grid-bg">
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            You lost the deal.<br />Now what?
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            DealAutopsy analyzes your rejected proposals and tells you exactly why you lost — and what to fix before the next one.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/signup"><Button size="lg">Analyze Your First Proposal Free →</Button></Link>
            <Link to="/signup"><Button variant="outline" size="lg">See a Sample Report</Button></Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-2xl font-bold text-foreground">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.num} className="rounded-lg border border-border bg-card p-6 text-center">
                <span className="mb-4 inline-block font-mono text-sm font-bold text-primary">{s.num}</span>
                <s.icon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-2xl font-bold text-foreground">What You Get</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <Check className="h-5 w-5 shrink-0 text-success" />
                <span className="text-sm text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-12 text-center text-2xl font-bold text-foreground">Pricing</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Free */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground">Free</h3>
              <p className="mt-1 text-3xl font-bold text-foreground">$0</p>
              <p className="text-sm text-muted-foreground">3 analyses, no credit card</p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />3 autopsies</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />Basic report</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-muted-foreground" />No history</li>
              </ul>
              <Link to="/signup"><Button variant="outline" className="mt-6 w-full">Start Free</Button></Link>
            </div>
            {/* Pro */}
            <div className="relative rounded-lg border-2 border-primary bg-card p-6">
              <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-0.5 font-mono text-xs text-primary-foreground">Most Popular</span>
              <h3 className="text-lg font-semibold text-foreground">Pro</h3>
              <p className="mt-1 text-3xl font-bold text-foreground">$49<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground">Unlimited + pattern tracking</p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />Unlimited autopsies</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />Full report</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />Pattern dashboard</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />CSV export</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />Priority support</li>
              </ul>
              <Link to="/signup"><Button className="mt-6 w-full">Start Pro</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="font-mono text-lg font-bold">
            <span className="text-foreground">Deal</span>
            <span className="text-primary">Autopsy</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Know why you lose. Win more.</p>
          <div className="mt-4 flex justify-center gap-6 text-xs text-muted-foreground">
            <span className="cursor-pointer hover:text-foreground">Privacy</span>
            <span className="cursor-pointer hover:text-foreground">Terms</span>
            <span className="cursor-pointer hover:text-foreground">Contact</span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">© 2026 DealAutopsy</p>
        </div>
      </footer>
    </div>
  );
}

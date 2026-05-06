import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import PWAInstallButton from "@/components/PWAInstallButton";
import {
  HeroSection,
  ConnectionSection,
  ProblemSection,
  SolutionSection,
  HowItWorksSection,
  WhoSection,
  ProductSection,
  ComparisonSection,
  ValueProofSection,
  PricingSection,
  CTASection,
} from "@/components/landing";

export default function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-[#1a1a1a]/5">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={100} />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Entrar</Link>
            </Button>
            <PWAInstallButton />
          </div>
        </div>
      </header>

      <HeroSection />
      <ConnectionSection />
      <ProblemSection />
      <SolutionSection />
      <section id="como-funciona">
        <HowItWorksSection />
      </section>
      <ProductSection />
      <WhoSection />
      <ComparisonSection />
      <ValueProofSection />
      <PricingSection />
      <CTASection />

      <footer className="border-t border-[#1a1a1a]/5 py-8 bg-white">
        <div className="mx-auto max-w-6xl px-6 flex flex-wrap gap-4 justify-between text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} weaze</span>
          <span>Infraestrutura para comunidades.</span>
        </div>
      </footer>
    </main>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Users, MessageCircle, X, ChevronRight, ChevronLeft } from "lucide-react";

const STEPS = [
  { icon: Play, title: "Assista vídeos", desc: "Navegue pelo feed swipando. Vídeos tocam automaticamente." },
  { icon: MessageCircle, title: "Interaja", desc: "Curta, comente e compartilhe com a comunidade." },
  { icon: Users, title: "Conexão", desc: "Entre em comunidades e siga marcas do seu interesse." },
];

export default function OnboardingTour() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const seen = localStorage.getItem("wenity:onboarding_seen");
    if (!seen) { setOpen(true); localStorage.setItem("wenity:onboarding_seen", "true"); }
  }, [user]);

  if (!open) return null;

  const Icon = STEPS[step].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4 bg-background rounded-2xl p-6 border border-border">
        <button onClick={() => setOpen(false)} className="absolute top-3 right-3 p-1 rounded-full hover:bg-secondary">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="grid place-items-center h-20 w-20 rounded-full bg-brand-soft mb-4">
          <Icon className="h-10 w-10 text-primary" />
        </div>

        <h2 className="font-display text-2xl text-center mb-2">{STEPS[step].title}</h2>
        <p className="text-muted-foreground text-center mb-6">{STEPS[step].desc}</p>

        <div className="flex justify-center gap-2 mb-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-brand" : "w-1.5 bg-border"}`} />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-2.5 px-4 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium">
              <ChevronLeft className="h-4 w-4 inline mr-1" /> Voltar
            </button>
          )}
          <button 
            onClick={() => step === STEPS.length - 1 ? (setOpen(false), navigate("/feed")) : setStep(step + 1)} 
            className="flex-1 py-2.5 px-4 rounded-md bg-brand text-primary-foreground text-sm font-medium"
          >
            {step === STEPS.length - 1 ? "Começar" : "Próximo"} <ChevronRight className="h-4 w-4 inline ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
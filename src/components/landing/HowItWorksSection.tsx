import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Sparkles, Users, TrendingUp, ArrowRight } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const steps = [
  {
    number: "01",
    title: "Crie sua marca",
    desc: "Escolha o nome da sua comunidade e personalize com a identidade da sua marca.",
    icon: Sparkles
  },
  {
    number: "02",
    title: "Convide membros",
    desc: "Compartilhe o link com quem já te segue. Cada pessoa que entra vira membro.",
    icon: Users
  },
  {
    number: "03",
    title: "Publique e engaje",
    desc: "Crie posts, videos, agenda eventos. Tudo num só lugar para sua comunidade.",
    icon: TrendingUp
  }
];

export default function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#630091]/5 to-white" />
      
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#d81e62] font-semibold mb-4">
            Como funciona
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-balance text-[#1a1a1a]">
            Comece em minutos.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {steps.map((s, i) => (
            <motion.div
              key={s.number}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className="relative"
            >
              <div className="p-8 rounded-2xl bg-white border-2 border-[#630091]/10 hover:border-[#630091]/30 transition-all duration-300 shadow-lg hover:shadow-2xl h-full">
                <div className="font-display text-7xl text-[#630091]/10 font-bold absolute top-4 right-6">
                  {s.number}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#630091] to-[#d81e62] flex items-center justify-center mb-5 shadow-lg">
                  <s.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-display text-2xl font-semibold mb-3 text-[#1a1a1a]">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
              
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#630091] to-[#d81e62] flex items-center justify-center">
                    <ArrowRight className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
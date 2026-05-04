import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, X } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const comparison = [
  { feature: "Feed próprio", social: false, weaze: true },
  { feature: "Mensagens da marca", social: false, weaze: true },
  { feature: "Agenda integrada", social: false, weaze: true },
  { feature: "Catálogo de produtos", social: false, weaze: true },
  { feature: "Dados da audiência", social: false, weaze: true },
  { feature: "Membros ilimitados", social: false, weaze: true },
  { feature: "Sem algoritmos", social: false, weaze: true },
  { feature: " eigene marca", social: false, weaze: true },
];

export default function ComparisonSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#d81e62]/5 to-white" />
      
      <div className="relative mx-auto max-w-4xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#d81e62] font-semibold mb-4">
            Comparativo
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-balance text-[#1a1a1a]">
            Weaze vs Redes Sociais
          </h2>
        </motion.div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#630091]/10">
          <div className="grid grid-cols-3 bg-gradient-to-r from-[#630091]/5 via-[#d81e62]/5 to-[#630091]/5 border-b border-[#630091]/10 py-4 px-6">
            <div className="font-semibold text-[#1a1a1a]">Recurso</div>
            <div className="text-center font-medium text-muted-foreground">Redes</div>
            <div className="text-center font-semibold text-[#d81e62]">Weaze</div>
          </div>
          {comparison.map((item, i) => (
            <motion.div
              key={item.feature}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.05 * i }}
              className="grid grid-cols-3 py-4 px-6 border-b border-[#630091]/5 last:border-0"
            >
              <div className="font-medium text-[#1a1a1a]">{item.feature}</div>
              <div className="flex justify-center">
                {item.social ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <X className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="flex justify-center">
                {item.weaze ? (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#630091] to-[#d81e62] flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <X className="h-5 w-5 text-red-400" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
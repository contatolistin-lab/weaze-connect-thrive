import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-32 relative overflow-hidden bg-white">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[2.5rem] p-12 sm:p-20 text-center"
          style={{
            background:
              "linear-gradient(135deg, #630091 0%, #8b2091 50%, #d81e62 100%)",
          }}
        >
          {/* Animated orbs */}
          <motion.div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/15 blur-3xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#ff5a8a]/30 blur-3xl"
            animate={{ scale: [1.3, 1, 1.3], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 8, repeat: Infinity }}
          />

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-8"
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-medium text-white tracking-wide">
                Pronto para começar
              </span>
            </motion.div>

            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white text-balance leading-[1.05] mb-6">
              Comece hoje a transformar
              <br />
              sua audiência em{" "}
              <span className="italic">receita recorrente</span>.
            </h2>

            <p className="text-lg text-white/80 max-w-xl mx-auto mb-10 leading-relaxed">
              Sem mensalidade por usuário. Sem letra miúda. Apenas a estrutura
              certa para o próximo passo da sua marca.
            </p>

            <Link to="/auth">
              <motion.button
                className="group inline-flex items-center gap-3 bg-white text-[#630091] hover:bg-[#fafafa] shadow-2xl px-10 py-5 rounded-full font-bold text-lg"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.97 }}
                style={{ boxShadow: "0 20px 60px -10px rgba(0,0,0,0.4)" }}
              >
                Criar minha comunidade
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </motion.button>
            </Link>

            <div className="mt-6 text-sm text-white/70">
              Grátis para começar · Sem cartão de crédito
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

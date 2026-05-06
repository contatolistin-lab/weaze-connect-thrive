import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const phrases = [
  {
    big: "Sua audiência já existe.",
    small: "Falta a estrutura certa para transformar atenção em receita.",
  },
  {
    big: "Pare de depender só de redes sociais.",
    small: "Algoritmos mudam. Sua comunidade fica com você.",
  },
  {
    big: "Construa um ativo próprio.",
    small: "Dados, relacionamento e marca — tudo na sua mão.",
  },
];

export default function ValueProofSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 relative overflow-hidden bg-[#0a0a0a]">
      <motion.div
        className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#630091]/40 to-transparent blur-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-40 right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#d81e62]/40 to-transparent blur-3xl"
        animate={{ scale: [1.2, 1, 1.2] }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      <div className="relative mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#d81e62] font-semibold mb-4">
            Por que agora
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-white text-balance leading-[1.05]">
            O jogo mudou.{" "}
            <span className="bg-gradient-to-r from-[#d81e62] to-[#9c1f7e] bg-clip-text text-transparent">
              E a sua marca também precisa mudar.
            </span>
          </h2>
        </motion.div>

        <div className="space-y-12">
          {phrases.map((p, i) => (
            <motion.div
              key={p.big}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.15 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`flex flex-col ${
                i % 2 === 0 ? "items-start text-left" : "items-end text-right"
              } max-w-3xl ${i % 2 === 0 ? "" : "ml-auto"}`}
            >
              <div className="font-display text-3xl sm:text-4xl lg:text-5xl text-white font-semibold leading-tight mb-3">
                {p.big}
              </div>
              <div className="text-base sm:text-lg text-white/60 max-w-md">
                {p.small}
              </div>
              <div
                className={`mt-5 h-px w-24 bg-gradient-to-r ${
                  i % 2 === 0
                    ? "from-[#d81e62] to-transparent"
                    : "from-transparent to-[#d81e62]"
                }`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import img1 from "@/assets/landing-community-1.jpg";
import img2 from "@/assets/landing-community-2.jpg";
import img3 from "@/assets/landing-community-3.jpg";
import img4 from "@/assets/landing-community-4.jpg";

const items = [
  { src: img1, label: "Conexões reais", caption: "Pessoas que voltam todo dia." },
  { src: img2, label: "Conteúdo próprio", caption: "Sua marca em primeiro plano." },
  { src: img3, label: "Conversas ativas", caption: "Sem algoritmo no meio." },
  { src: img4, label: "Audiência fiel", caption: "Seu ativo, sua regra." },
];

export default function ConnectionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-32 relative overflow-hidden bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-14"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#d81e62] font-semibold mb-4">
            <span className="h-px w-8 bg-gradient-to-r from-[#630091] to-[#d81e62]" />
            Conexão real
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-balance text-[#0a0a0a] mb-4 leading-[1.05]">
            Comunidade não é número de seguidores.{" "}
            <span className="bg-gradient-to-r from-[#630091] to-[#d81e62] bg-clip-text text-transparent">
              É relacionamento.
            </span>
          </h2>
          <p className="text-lg text-[#4a4a4a] leading-relaxed">
            A weaze foi feita para criar momentos de verdade entre você e quem
            te acompanha — sem ruído, sem distração, sem disputa por atenção.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className={`group relative overflow-hidden rounded-3xl shadow-xl ${
                i % 2 === 0 ? "lg:translate-y-6" : ""
              }`}
            >
              <div className="aspect-[3/4] overflow-hidden">
                <motion.img
                  src={it.src}
                  alt={it.label}
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/85 via-[#0a0a0a]/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#630091]/40 to-[#d81e62]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-multiply" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="text-xs uppercase tracking-widest text-white/70 mb-1">
                  {it.label}
                </div>
                <div className="font-display text-lg font-semibold leading-tight">
                  {it.caption}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

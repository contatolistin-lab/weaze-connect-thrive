import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import heroMockup from "@/assets/landing-hero-mockup.jpg";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-center pt-12 pb-8 overflow-hidden bg-white"
    >
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#630091]/20 via-[#d81e62]/10 to-transparent blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-[#d81e62]/20 via-[#630091]/10 to-transparent blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#630091 1px, transparent 1px), linear-gradient(90deg, #630091 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-16 w-full">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* LEFT */}
          <div>
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#630091]/10 to-[#d81e62]/10 border border-[#630091]/15 mb-7"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#d81e62]" />
              <span className="text-xs font-medium text-[#630091] tracking-wide">
                A nova plataforma de comunidades
              </span>
            </motion.div>

            <motion.h1
              className="font-display text-5xl sm:text-6xl lg:text-[4.25rem] leading-[1.02] tracking-tight text-[#0a0a0a] mb-6"
            >
              Transforme sua audiência em uma{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#630091] via-[#9c1f7e] to-[#d81e62] bg-clip-text text-transparent">
                  comunidade que gera receita
                </span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-[#630091] to-[#d81e62] origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                />
              </span>
              .
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-[#4a4a4a] max-w-xl mb-10 leading-relaxed"
            >
              Feed, mensagens, agenda e dados em um único app com a sua marca.
              Pare de depender de algoritmos - construa um ativo que é só seu.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap gap-4 mb-12"
            >
              <Link to="/auth">
                <motion.button
                  className="group relative inline-flex items-center gap-2 text-white px-8 py-4 rounded-full font-semibold overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #630091 0%, #d81e62 100%)",
                    boxShadow:
                      "0 10px 40px -10px rgba(99, 0, 145, 0.6), 0 4px 12px -2px rgba(216, 30, 98, 0.3)",
                  }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10">Começar agora</span>
                  <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[#d81e62] to-[#630091] opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </motion.button>
              </Link>

              <a href="#como-funciona">
                <motion.button
                  className="inline-flex items-center gap-2 bg-white text-[#1a1a1a] border-2 border-[#1a1a1a]/10 hover:border-[#630091]/30 px-8 py-4 rounded-full font-medium transition-colors"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play className="h-4 w-4 text-[#630091] fill-[#630091]" />
                  Ver como funciona
                </motion.button>
              </a>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="flex items-center gap-6 pt-6 border-t border-[#1a1a1a]/8"
            >
              <div className="flex -space-x-2">
                {[
                  "from-[#630091] to-[#8b2091]",
                  "from-[#8b2091] to-[#d81e62]",
                  "from-[#d81e62] to-[#ff5a8a]",
                  "from-[#630091] to-[#d81e62]",
                ].map((g, i) => (
                  <div
                    key={i}
                    className={`w-9 h-9 rounded-full bg-gradient-to-br ${g} ring-2 ring-white`}
                  />
                ))}
              </div>
              <div className="text-sm">
                <div className="font-semibold text-[#1a1a1a]">
                  Marcas reais, comunidades ativas
                </div>
                <div className="text-[#6a6a6a] text-xs">
                  Creators, coaches, e-commerces e mais
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT - mockup */}
          <motion.div
            className="relative mt-12 lg:mt-0"
          >
            <div
              className="absolute -inset-8 rounded-[3rem] opacity-60 blur-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(99,0,145,0.4), rgba(216,30,98,0.4))",
              }}
            />

            <motion.div
              className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/40 bg-white mx-auto max-w-[280px] sm:max-w-md lg:max-w-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <img
                src={heroMockup}
                alt="App weaze mostrando feed de comunidade"
                width={560}
                height={700}
                className="w-full h-auto"
              />
            </motion.div>

            {/* Floating chip */}
            <motion.div
              className="absolute -left-6 top-12 bg-white rounded-2xl shadow-xl border border-[#630091]/10 px-4 py-3 flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#630091] to-[#d81e62] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xs text-[#6a6a6a]">Engajamento</div>
                <div className="text-sm font-bold text-[#1a1a1a]">
                  +312% em 30 dias
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -right-4 bottom-20 bg-white rounded-2xl shadow-xl border border-[#d81e62]/10 px-4 py-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4, duration: 0.6 }}
            >
              <div className="text-xs text-[#6a6a6a] mb-0.5">Novo membro</div>
              <div className="text-sm font-semibold text-[#1a1a1a]">
                @ana acabou de entrar
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

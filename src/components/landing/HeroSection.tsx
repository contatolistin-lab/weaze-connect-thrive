import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
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
      className="relative min-h-screen flex flex-col justify-center pt-24 pb-8 overflow-hidden bg-white"
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

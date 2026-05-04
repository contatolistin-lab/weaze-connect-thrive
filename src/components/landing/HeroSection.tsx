import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, Image, MessageSquare, Calendar, Users } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } }
};

const stats = [
  { icon: Image, value: "Feed", label: "Posts e vídeos" },
  { icon: MessageSquare, value: "Chat", label: "Mensagens" },
  { icon: Calendar, value: "Agenda", label: "Eventos" },
  { icon: Users, value: "Membros", label: "Lista" },
];

export default function HeroSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      
      <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[#630091]/8 via-[#d81e62]/4 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#d81e62]/8 via-[#630091]/4 to-transparent blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-20">
        <motion.div 
          className="grid lg:grid-cols-2 gap-12 items-center"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={stagger}
        >
          <motion.div variants={fadeInUp} className="max-w-2xl">
            <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#d81e62] font-semibold mb-6"
            >
              <span className="h-px w-10 bg-gradient-to-r from-[#630091] to-[#d81e62]" />
              Comunidade white-label
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-balance mb-6"
            >
              Transforme sua audiência em uma{" "}
              <span className="bg-gradient-to-r from-[#630091] via-[#8b2091] to-[#d81e62] bg-clip-text text-transparent">
                comunidade de verdade
              </span>.
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg sm:text-xl text-muted-foreground text-pretty max-w-lg mb-8 leading-relaxed"
            >
              Uma plataforma para criar relacionamento real com sua audiência. Feed, mensagens, agenda e dados — tudo integrado.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 mb-12">
              <Link to="/auth">
                <motion.button 
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#630091] via-[#8b2091] to-[#d81e62] text-white hover:opacity-90 shadow-lg px-7 py-4 rounded-full font-medium transition-all"
                  style={{ boxShadow: "0 4px 20px rgba(99, 0, 145, 0.25), 0 0 40px rgba(216, 30, 98, 0.1)" }}
                  whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(99, 0, 145, 0.35), 0 0 60px rgba(216, 30, 98, 0.15)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  Criar comunidade
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
              
              <Link to="/communities">
                <motion.button 
                  className="inline-flex items-center gap-2 border-2 border-[#630091]/20 bg-white hover:bg-[#630091]/5 text-[#630091] hover:border-[#630091]/40 px-7 py-4 rounded-full font-medium transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ver comunidades
                </motion.button>
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex items-center gap-6 pt-4 border-t border-[#630091]/10">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="h-6 w-6 text-[#630091] mx-auto mb-1" />
                  <div className="font-display text-sm font-semibold text-[#1a1a1a]">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="hidden lg:block relative"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#630091]/20 via-[#d81e62]/10 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl bg-white border border-[#630091]/10 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-[#630091]/10 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-4 text-xs text-muted-foreground">Sua comunidade</span>
                </div>
                <div className="p-8 space-y-6">
                  <div className="h-8 w-2/3 bg-gradient-to-r from-[#630091]/20 to-[#d81e62]/20 rounded-lg" />
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-4/5 bg-muted rounded" />
                    <div className="h-4 w-3/5 bg-muted rounded" />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-[#630091]/20 to-[#d81e62]/20" />
                    <div className="h-20 flex-1 bg-muted rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="h-6 w-6 text-muted-foreground/30" />
      </motion.div>
    </section>
  );
}
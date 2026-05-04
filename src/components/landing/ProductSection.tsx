import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ScrollText, MessageSquare, Calendar, ShoppingBag, BarChart3, Users, Bell, Image, ArrowRight } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const features = [
  { icon: ScrollText, title: "Feed", desc: "Posts e vídeos" },
  { icon: MessageSquare, title: "Mensagens", desc: "Chat da marca" },
  { icon: Calendar, title: "Agenda", desc: "Agendamentos" },
  { icon: ShoppingBag, title: "Produtos", desc: "Catálogo" },
  { icon: BarChart3, title: "Dados", desc: "Métricas" },
  { icon: Users, title: "Membros", desc: "Lista" },
  { icon: Bell, title: "Notificações", desc: "Alertas" },
  { icon: Image, title: "Mídia", desc: "Imagens e vídeos" }
];

export default function ProductSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#630091]/3 to-[#d81e62]/3" />
      
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#d81e62] font-semibold mb-4">
            Recursos
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-balance max-w-2xl mx-auto mb-4 text-[#1a1a1a]">
            Tudo que você precisa.
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
            Integrado e funcionando. Sem mensalidade por usuário.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.04 * i, duration: 0.4 }}
              className="group p-6 rounded-2xl bg-white border border-[#630091]/10 shadow-lg hover:shadow-2xl hover:border-[#d81e62]/30 transition-all duration-300 relative overflow-hidden"
              whileHover={{ y: -3 }}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#630091]/5 to-[#d81e62]/5 rounded-bl-2xl" />
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#630091] to-[#d81e62] flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-1 text-[#1a1a1a]">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
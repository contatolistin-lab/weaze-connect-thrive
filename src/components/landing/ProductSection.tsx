import { motion } from "framer-motion";
import { Check, Video, Image, MessageSquare, Calendar, Users, BarChart3, Bell, Megaphone, Sparkles, ClipboardCheck, ExternalLink } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const features = [
  { icon: Video, title: "Feed", desc: "Posts em vídeo, imagem ou texto" },
  { icon: Megaphone, title: "CTAs", desc: "Comprar, agendar, orçamento, inscrição" },
  { icon: Calendar, title: "Serviços", desc: "Agendamentos com horários" },
  { icon: ClipboardCheck, title: "Eventos", desc: "Inscrições em eventos" },
  { icon: ExternalLink, title: "Links", desc: "Links externos no feed" },
  { icon: MessageSquare, title: "Conversas", desc: "Chat da comunidade" },
  { icon: Users, title: "Membros", desc: "Lista e gestão" },
  { icon: BarChart3, title: "Dados", desc: "Métricas e funil" },
  { icon: Bell, title: "Notificações", desc: "Alertas e pushes" },
  { icon: Sparkles, title: "Sua marca", desc: "Logo white-label" },
];

const colors = ["from-[#630091] to-[#8b2091]", "from-[#8b2091] to-[#d81e62]", "from-[#d81e62] to-[#630091]"];

export default function ProductSection() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#630091]/3 to-[#d81e62]/3" />
      
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#d81e62] font-semibold mb-4">
            O que você ganha
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-balance max-w-2xl mx-auto mb-4 text-[#1a1a1a]">
            Tudo que você precisa.
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
            Uma plataforma completa com as ferramentas que sua comunidade precisa.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.4 }}
              className="group p-4 rounded-2xl bg-white border border-[#630091]/10 shadow-lg hover:shadow-2xl hover:border-[#d81e62]/30 transition-all duration-300"
              whileHover={{ y: -3 }}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[i % 3]} flex items-center justify-center mb-3`}>
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-display text-sm font-semibold mb-1 text-[#1a1a1a]">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

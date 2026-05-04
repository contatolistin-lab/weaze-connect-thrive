import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const audiences = [
  {
    title: "Creators e influenciadores",
    desc: "Quem te segue no Instagram ou TikTok merece um lugar melhor. Transforme seguidores em membros pagantes."
  },
  {
    title: "Marcas e e-commerces",
    desc: "Crie uma comunidade de clientes fieis. Não é só uma venda — é relacionamento que gera recompra."
  },
  {
    title: "Coachings e consultorias",
    desc: "Seu cliente merece acompanhamento. Agenda, conteúdo, results — tudo integrado num só lugar."
  },
  {
    title: "Cursos e edu-techs",
    desc: "Alunos engajados aprendem mais. Mantenha contato,推送 aulas, acompanhando resultado."
  },
  {
    title: "Serviços profissionais",
    desc: "Advogados, médicos, arquitetos. Cliente também quer comodidade. Agenda online, histórico, tudo facilitado."
  },
  {
    title: "Comunidades de nicho",
    desc: "Junte pessoas com interesses em comum. Mediação, eventos, networking — seu controle."
  }
];

export default function WhoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#630091]/8 via-[#d81e62]/4 to-transparent" />
      
      <div className="relative mx-auto max-w-5xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#d81e62] font-semibold mb-4">
            Para quem é
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-balance max-w-2xl mx-auto mb-4">
            Para quem quer deixar de depender de <span className="text-[#630091]">plataformas externas</span>.
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Qualquer pessoa ou marca que quer construir relacionamento real com sua audiência, sem intermediários.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {audiences.map((audience, i) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.03 * i, duration: 0.3 }}
              className="p-5 rounded-xl bg-gradient-to-br from-[#630091]/10 to-[#d81e62]/10 border border-[#630091]/20 hover:border-[#d81e62]/40 transition-all group"
              whileHover={{ y: -2 }}
            >
              <h3 className="font-medium mb-2 text-[#630091] group-hover:text-[#d81e62] transition-all">{audience.title}</h3>
              <p className="text-sm text-muted-foreground">{audience.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
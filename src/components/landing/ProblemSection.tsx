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

const problems = [
  {
    title: "Você depende do algoritmo",
    desc: "Seu alcance é controlado pela plataforma. A cada mudança de feed, menos pessoas veem seu conteúdo. Você não decide quem chega até você."
  },
  {
    title: "Não consegue manter contato",
    desc: "Após publicar, não há como falar diretamente com quem te seguiu. Você perde a conexão no dia seguinte."
  },
  {
    title: "Seguidores não viram clientes",
    desc: "Você tem atenção, mas converter em venda é difícil. O link no bio não é suficiente para fechar negócios."
  },
  {
    title: "Sua marca se perde no meio",
    desc: "No feed, sua marca compete com centenas de outras. É difícil se destacar e criar recall."
  },
  {
    title: "Sem dados reais",
    desc: "Você não sabe quem é sua audiência de verdade. Não consegue medir retention ou entender o comportamento."
  },
  {
    title: "Precisa de várias ferramentas",
    desc: "Você usa Instagram pra conteúdo, WhatsApp pra atendimento, Calendly pra agenda, Shopify pra venda. Tudo separado."
  }
];

export default function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#630091]/5 via-[#d81e62]/3 to-[#630091]/5" />
      
      <div className="relative mx-auto max-w-5xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="mb-16"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#d81e62] font-semibold mb-4">
            O problema
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-balance max-w-2xl mb-4 text-[#630091]">
            As redes sociais trabalham contra você.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl">
            Você está construindo a audiência de outra pessoa. A qualquer momento, as regras mudam e tudo que você construiu pode desaparecer.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              className="group p-6 rounded-xl bg-white/80 border border-[#630091]/20 hover:border-[#d81e62]/50 transition-all shadow-sm hover:shadow-md"
              whileHover={{ y: -2 }}
            >
              <div className="h-1 w-10 bg-gradient-to-r from-[#630091] to-[#d81e62] rounded-full mb-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="font-medium text-lg mb-3 text-[#630091] group-hover:text-[#d81e62] transition-colors">{problem.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{problem.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
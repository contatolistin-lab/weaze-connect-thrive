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

const comparison = [
  {
    title: "Algoritmo",
    social: "O algoritmo decide quem vê seu conteúdo.",
    weaze: "Todo mundo que é membro vê."
  },
  {
    title: "Concorrência",
    social: "Você compete com milhões de contas.",
    weaze: "Ambiente só seu."
  },
  {
    title: "Dados",
    social: "Dados limitados e incompletos.",
    weaze: "CRM completo."
  },
  {
    title: "Venda",
    social: "Link no bio. Múltiplos passos.",
    weaze: "Venda direta no app."
  },
  {
    title: "Agenda",
    social: "Precisa de ferramenta externa.",
    weaze: "Agenda nativa."
  },
  {
    title: "Marca",
    social: "Genérico, igual a todos.",
    weaze: "100% white-label."
  }
];

export default function ComparisonSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#d81e62]/5 to-[#630091]/5" />
      
      <div className="relative mx-auto max-w-5xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#630091] font-semibold mb-4">
            Por que weaze
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-balance">
            Não é só mais uma ferramenta. É sua <span className="text-[#d81e62]">infraestrutura</span>.
          </h2>
        </motion.div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-[#630091]/20">
                <th className="text-left py-4 pr-4 font-medium text-muted-foreground text-sm">Diferença</th>
                <th className="text-left py-4 px-4 font-medium text-muted-foreground text-sm">Redes sociais</th>
                <th className="text-left py-4 pl-4 font-medium text-[#d81e62] text-sm">Weaze</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((item, i) => (
                <motion.tr
                  key={item.title}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.05 * i }}
                  className="border-b border-[#630091]/10"
                >
                  <td className="py-4 pr-4 text-sm font-medium text-[#630091]">{item.title}</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{item.social}</td>
                  <td className="py-4 pl-4 text-sm font-medium text-[#d81e62]">{item.weaze}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const benefits = [
  { title: "Ambiente 100% seu", desc: "Cores, nome, logo — tudo com a identidade da sua marca. Nenhum rastro de outra empresa." },
  { title: "Feed proprietário", desc: "Seu conteúdo, suas regras. Sem algoritmo decidindo quem vê." },
  { title: "Mensagens diretas", desc: "Chat integrado com sua galera. Não precisa usar WhatsApp pessoal." },
  { title: "Agenda completa", desc: "Agendamentos, eventos, horários — tudo num só lugar." },
  { title: "Vendas integradas", desc: "Produtos, serviços, inscrição — fecha sem sair do app." },
  { title: "Dados reais", desc: "Quem viu, quem comprou, quem retornou. Métricas que importam." },
  { title: "CRM nativo", desc: "Histórico de cada cliente. Relacionamento que dura." },
  { title: "White-label", desc: "Sua marca, seu domínio, seu app. Totalmente white-label." },
  { title: "Escala", desc: "Milhares de membros sem slowdown. Infraestrutura que suporta." }
];

export default function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#d81e62] via-[#630091] to-[#d81e62]" />
      <div className="absolute inset-0 bg-white/90" />
      
      <div className="relative mx-auto max-w-5xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="mb-16"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#d81e62] font-semibold mb-4">
            A solução
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-balance max-w-2xl mb-4 text-[#630091]">
            Um espaço só seu. Onde a conexão vira conversão.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl">
            Weaze é a infraestrutura que você precisa para criar sua própria comunidade. Sem algoritmo, sem concorrência no feed, sem dependência de plataforma externa.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.03 * i, duration: 0.3 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-[#630091]/10 to-[#d81e62]/10 border border-[#630091]/20 hover:border-[#d81e62]/50 transition-all group shadow-sm"
              whileHover={{ y: -2 }}
            >
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#630091] to-[#d81e62] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="h-3 w-3 text-white" />
              </div>
              <div>
                <span className="text-sm font-medium text-[#630091]">{benefit.title}</span>
                <p className="text-xs text-muted-foreground mt-1">{benefit.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
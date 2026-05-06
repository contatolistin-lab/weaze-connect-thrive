import { motion } from "framer-motion";
import { Check, DollarSign, Sparkles } from "lucide-react";

const handlePaymentClick = () => {
  // TODO: adicionar link Mercado Pago
  console.log("_assinar agora - conectar com Mercado Pago");
};

export default function PricingSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-[#fafafa]">
      <div className="max-w-lg mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-3">
            Comece sua comunidade hoje
          </h2>
          <p className="text-lg text-[#4a4a4a]">
            Tenha acesso completo à plataforma e crie um espaço exclusivo para sua marca, clientes e conteúdo.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl border-2 border-[#630091]/20 shadow-2xl overflow-hidden"
        >
          {/* Header com badge */}
          <div className="bg-gradient-to-r from-[#630091] to-[#d81e62] px-6 py-5 flex items-center justify-center gap-3">
            <Sparkles className="h-5 w-5 text-white" />
            <span className="text-white font-semibold text-lg">Plano Fundador</span>
          </div>
          
          {/* Preço */}
          <div className="text-center py-8 px-6">
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl text-[#6a6a6a]">R$</span>
              <span className="font-display text-5xl md:text-6xl font-bold text-[#1a1a1a]">67</span>
              <span className="text-xl text-[#6a6a6a]">/mês</span>
            </div>
          </div>
          
          {/* Descrição */}
          <div className="px-6 pb-2">
            <p className="text-center text-[#4a4a4a] mb-6">
              Acesso completo à plataforma durante a fase inicial da Weaze.
              Crie sua comunidade, gerencie membros e publique conteúdos em um ambiente próprio da sua marca.
            </p>
            
            {/* Lista de benefícios */}
            <ul className="space-y-3 mb-8">
              {[
                "Comunidade própria da marca",
                "Feed exclusivo",
                "Controle de entrada de membros",
                "Sistema de notificações",
                "Acesso via aplicativo PWA",
                "Atualizações futuras inclusas",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#630091]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-[#630091]" />
                  </div>
                  <span className="text-[#1a1a1a] text-sm">{item}</span>
                </li>
              ))}
            </ul>
            
            {/* BOTÃO PRINCIPAL */}
            <motion.button
              onClick={handlePaymentClick}
              className="w-full inline-flex items-center justify-center gap-2 text-white px-8 py-4 rounded-full font-semibold text-lg"
              style={{
                background: "linear-gradient(135deg, #630091 0%, #d81e62 100%)",
                boxShadow: "0 10px 40px -10px rgba(99, 0, 145, 0.5)",
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <DollarSign className="h-5 w-5" />
              Assinar agora
            </motion.button>
            
            <p className="text-center text-xs text-[#6a6a6a] mt-4">
              Valor especial para os primeiros clientes da plataforma.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
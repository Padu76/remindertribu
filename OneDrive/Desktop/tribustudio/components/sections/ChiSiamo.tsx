'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Target, Heart, Users, Sparkles } from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Personal Training su misura',
    description: 'Ogni allenamento è personalizzato sui tuoi obiettivi'
  },
  {
    icon: Heart,
    title: 'Nutrizione e benessere',
    description: 'Approccio completo per risultati duraturi'
  },
  {
    icon: Users,
    title: 'Recupero e massaggi',
    description: 'Tecniche professionali per il tuo recupero'
  },
  {
    icon: Sparkles,
    title: 'Coaching online',
    description: 'Supporto costante ovunque tu sia'
  }
];

export default function ChiSiamo() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <section id="chi-siamo" className="section-padding bg-white" ref={ref}>
      <div className="container-custom mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6">
            La tua trasformazione inizia qui
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-8"></div>
          <p className="text-lg md:text-xl text-gray max-w-3xl mx-auto leading-relaxed">
            Crediamo in un mondo in cui aiutiamo le persone ad essere la migliore versione di sé stesse.
            Affrontiamo con loro la battaglia più difficile: credere in sé stessi e sentirsi bene nel proprio corpo.
          </p>
          <p className="text-lg md:text-xl text-gray max-w-3xl mx-auto mt-4 font-semibold text-primary">
            Allenarsi con noi non è solo allenamento: è motivazione, supporto e risultati concreti.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="bg-gray-light rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                  <Icon size={40} className="text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-montserrat font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-gray text-sm">{value.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
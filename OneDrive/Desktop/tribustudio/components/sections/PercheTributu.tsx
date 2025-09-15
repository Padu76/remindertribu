'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { CheckCircle } from 'lucide-react';

const benefits = [
  'Nessun abbonamento vincolante',
  'Ogni sessione su appuntamento',
  'Personal Trainer sempre presente',
  'Massima personalizzazione',
  'Ambiente esclusivo e riservato',
  'Risultati concreti e misurabili'
];

export default function PercheTributu() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <section className="section-padding bg-gradient-to-br from-primary/5 to-white" ref={ref}>
      <div className="container-custom mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6">
              No, non è una classica palestra
            </h2>
            <div className="w-24 h-1 bg-primary mb-8"></div>
            <p className="text-lg text-gray mb-6 leading-relaxed">
              <span className="font-semibold text-primary">Tribù</span> è uno studio di Personal Training dove facciamo solo lezioni individuali, di coppia e miniclass.
            </p>
            <p className="text-lg text-gray mb-8 leading-relaxed">
              Nessun abbonamento, niente accesso libero: ogni sessione è su appuntamento e supervisionata da un Personal Trainer.
            </p>
            <p className="text-xl font-semibold text-primary">
              Questo significa più personalizzazione, motivazione e risultati concreti.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <CheckCircle className="text-primary flex-shrink-0" size={24} />
                <span className="text-gray font-medium">{benefit}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
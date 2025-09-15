'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Users, User, UsersRound, Apple, Heart, Monitor, X, ExternalLink } from 'lucide-react';
import { SERVIZI } from '@/lib/constants';

const serviceIcons: { [key: string]: any } = {
  individuale: User,
  coppia: Users,
  miniclass: UsersRound,
  nutrizionista: Apple,
  massaggi: Heart,
  online: Monitor
};

export default function Servizi() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });
  
  const [selectedService, setSelectedService] = useState<typeof SERVIZI[0] | null>(null);

  return (
    <section id="servizi" className="section-padding bg-gray-light" ref={ref}>
      <div className="container-custom mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6">
            I Nostri Servizi
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-8"></div>
          <p className="text-lg text-gray max-w-2xl mx-auto">
            Scegli il percorso più adatto a te. Ogni servizio è pensato per offrirti il massimo supporto nel raggiungimento dei tuoi obiettivi.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVIZI.map((servizio, index) => {
            const Icon = serviceIcons[servizio.id];
            return (
              <motion.div
                key={servizio.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                onClick={() => servizio.id !== 'online' && setSelectedService(servizio)}
              >
                <div className="bg-primary/10 rounded-full w-16 h-16 mb-4 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <Icon size={32} className="text-primary group-hover:text-white" />
                </div>
                <h3 className="font-montserrat font-bold text-xl mb-2">{servizio.titolo}</h3>
                <p className="text-gray mb-4">{servizio.descrizione}</p>
                
                {servizio.prezzi && servizio.prezzi.length > 0 && (
                  <div className="border-t pt-4 mb-4">
                    <p className="text-sm font-semibold text-primary mb-2">A partire da:</p>
                    <p className="text-2xl font-bold text-dark">
                      {servizio.prezzi[servizio.prezzi.length - 1].prezzo}€<span className="text-sm font-normal">/lezione</span>
                    </p>
                  </div>
                )}
                
                {servizio.id === 'online' ? (
                  <a
                    href={servizio.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
                  >
                    Vai al sito <ExternalLink size={16} />
                  </a>
                ) : (
                  <button className="text-primary font-semibold hover:text-primary-dark transition-colors">
                    Scopri di più →
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Modal Dettagli */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedService(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-lg w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 text-gray hover:text-primary transition-colors"
            >
              <X size={24} />
            </button>
            
            <h3 className="font-montserrat font-bold text-2xl mb-4">{selectedService.titolo}</h3>
            <p className="text-gray mb-6">{selectedService.dettagli}</p>
            
            {selectedService.prezzi && (
              <div className="bg-gray-light rounded-lg p-4">
                <p className="font-semibold mb-3">Listino prezzi:</p>
                {selectedService.prezzi.map((prezzo, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray/10 last:border-0">
                    <span className="text-gray">{prezzo.label}</span>
                  </div>
                ))}
              </div>
            )}
            
            <button 
              className="btn-primary w-full mt-6"
              onClick={() => {
                setSelectedService(null);
                document.getElementById('contatti')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Prenota ora
            </button>
          </motion.div>
        </div>
      )}
    </section>
  );
}
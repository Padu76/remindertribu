'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image/Video Placeholder */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary-dark/90 z-10" />
        {/* Sostituisci con video o immagine */}
        <div className="w-full h-full bg-gray-dark">
          <img 
            src="/api/placeholder/1920/1080" 
            alt="Training"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-20 container-custom mx-auto px-4 text-center text-white pt-20">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl lg:text-7xl font-montserrat font-bold mb-6"
        >
          Allenati, mangia bene<br />e vivi meglio
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl lg:text-2xl mb-10 max-w-3xl mx-auto font-light"
        >
          Allenarsi con un personal trainer significa trovare la giusta motivazione 
          ed ottimizzare il tuo tempo. Inizia oggi il tuo percorso su misura 
          con un professionista al tuo fianco.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button className="btn-primary text-lg px-10 py-5 shadow-xl-orange">
            Prenota la tua prima lezione + massaggio gratuito
          </button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown className="animate-bounce-slow" size={32} />
        </motion.div>
      </div>
    </section>
  );
}
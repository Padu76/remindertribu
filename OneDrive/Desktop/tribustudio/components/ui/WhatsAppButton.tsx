'use client';

import { MessageCircle } from 'lucide-react';

const CONTACT_INFO = {
  phone: '3478881515',
  whatsappMessage: 'Ciao Tribù, vorrei prenotare la mia prima lezione!'
};

export default function WhatsAppButton() {
  const whatsappUrl = `https://wa.me/39${CONTACT_INFO.phone}?text=${encodeURIComponent(CONTACT_INFO.whatsappMessage)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 bg-whatsapp text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 animate-pulse-slow md:p-3"
      aria-label="Contattaci su WhatsApp"
    >
      <MessageCircle size={30} className="md:w-6 md:h-6" />
    </a>
  );
}
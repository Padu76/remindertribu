import { Instagram, Facebook, MapPin, Phone, Mail } from 'lucide-react';

const CONTACT_INFO = {
  phone: '3478881515',
  phoneDisplay: '347 888 1515',
  email: 'info@tribustudio.it',
  address: 'Via Albere 27/B – Verona',
};

const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/tribu_personal_trainer/',
  facebook: 'https://www.facebook.com/tribupersonaltrainingstudio/?locale=it_IT'
};

const NAVIGATION_ITEMS = [
  { label: 'Chi siamo', href: '#chi-siamo' },
  { label: 'Servizi', href: '#servizi' },
  { label: 'Come funziona', href: '#come-funziona' },
  { label: 'Testimonianze', href: '#testimonianze' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contatti', href: '#contatti' }
];

export default function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="container-custom mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e descrizione */}
          <div className="md:col-span-1">
            <h3 className="text-3xl font-montserrat font-bold text-primary mb-4">TRIBÙ</h3>
            <p className="text-gray-400 text-sm">
              Il tuo studio di Personal Training a Verona dove ogni allenamento è su misura.
            </p>
          </div>

          {/* Link rapidi */}
          <div className="md:col-span-1">
            <h4 className="font-montserrat font-semibold mb-4">Link Rapidi</h4>
            <ul className="space-y-2">
              {NAVIGATION_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-gray-400 hover:text-primary transition-colors text-sm"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contatti */}
          <div className="md:col-span-1">
            <h4 className="font-montserrat font-semibold mb-4">Contatti</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-gray-400">
                <MapPin size={16} className="text-primary" />
                {CONTACT_INFO.address}
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <Phone size={16} className="text-primary" />
                {CONTACT_INFO.phoneDisplay}
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <Mail size={16} className="text-primary" />
                {CONTACT_INFO.email}
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="md:col-span-1">
            <h4 className="font-montserrat font-semibold mb-4">Seguici</h4>
            <div className="flex gap-4">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 p-3 rounded-full hover:bg-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 p-3 rounded-full hover:bg-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 Tribù Personal Training Studio. Tutti i diritti riservati.</p>
          <p className="mt-2">
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
            {' • '}
            <a href="/cookie" className="hover:text-primary transition-colors">Cookie Policy</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
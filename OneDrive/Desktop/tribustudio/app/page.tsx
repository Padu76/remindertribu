import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import Hero from '@/components/sections/Hero';
import ChiSiamo from '@/components/sections/ChiSiamo';
import PercheTributu from '@/components/sections/PercheTributu';
import Servizi from '@/components/sections/Servizi';
import Contatore from '@/components/sections/Contatore';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ChiSiamo />
        <PercheTributu />
        <Servizi />
        
        {/* Come Funziona - Placeholder */}
        <section id="come-funziona" className="section-padding bg-white">
          <div className="container-custom mx-auto text-center">
            <h2 className="text-4xl font-montserrat font-bold mb-8">Il tuo percorso con Tribù</h2>
            <p className="text-lg">Sezione in costruzione...</p>
          </div>
        </section>

        <Contatore />

        {/* Testimonianze - Placeholder */}
        <section id="testimonianze" className="section-padding bg-gray-light">
          <div className="container-custom mx-auto text-center">
            <h2 className="text-4xl font-montserrat font-bold mb-8">Cosa dicono di noi</h2>
            <p className="text-lg">Sezione in costruzione...</p>
          </div>
        </section>

        {/* Offerta Speciale - Placeholder */}
        <section className="section-padding bg-gradient-to-br from-primary/10 to-white">
          <div className="container-custom mx-auto text-center">
            <h2 className="text-4xl font-montserrat font-bold mb-8">Offerta Speciale</h2>
            <p className="text-lg">Prima lezione + massaggio gratuito</p>
          </div>
        </section>

        {/* Brochure - Placeholder */}
        <section className="section-padding bg-white">
          <div className="container-custom mx-auto text-center">
            <h2 className="text-4xl font-montserrat font-bold mb-8">Scarica la Brochure</h2>
            <p className="text-lg">Sezione in costruzione...</p>
          </div>
        </section>

        {/* FAQ - Placeholder */}
        <section id="faq" className="section-padding bg-gray-light">
          <div className="container-custom mx-auto text-center">
            <h2 className="text-4xl font-montserrat font-bold mb-8">Domande Frequenti</h2>
            <p className="text-lg">Sezione in costruzione...</p>
          </div>
        </section>

        {/* Contatti - Placeholder */}
        <section id="contatti" className="section-padding bg-white">
          <div className="container-custom mx-auto text-center">
            <h2 className="text-4xl font-montserrat font-bold mb-8">Contattaci</h2>
            <p className="text-lg">Sezione in costruzione...</p>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
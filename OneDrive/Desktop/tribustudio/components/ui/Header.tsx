'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const NAVIGATION_ITEMS = [
  { label: 'Chi siamo', href: '#chi-siamo' },
  { label: 'Servizi', href: '#servizi' },
  { label: 'Come funziona', href: '#come-funziona' },
  { label: 'Testimonianze', href: '#testimonianze' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contatti', href: '#contatti' }
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className={`fixed top-0 w-full z-40 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-lg py-3' : 'bg-white/95 backdrop-blur-sm py-5'
    }`}>
      <div className="container-custom mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <span className="text-2xl md:text-3xl font-montserrat font-bold text-primary">
            TRIBÙ
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {NAVIGATION_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.href);
              }}
              className="text-gray hover:text-primary transition-colors duration-300 font-medium"
            >
              {item.label}
            </a>
          ))}
          <button className="bg-primary text-white px-6 py-2 rounded-full font-semibold hover:bg-primary-dark transition-all duration-300 hover:scale-105">
            PRENOTA ORA
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-gray hover:text-primary transition-colors"
          aria-label="Menu"
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden bg-white border-t transition-all duration-300 ${
        isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <nav className="container-custom mx-auto px-4 py-4 flex flex-col space-y-4">
          {NAVIGATION_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.href);
              }}
              className="text-gray hover:text-primary transition-colors duration-300 font-medium py-2"
            >
              {item.label}
            </a>
          ))}
          <button className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-dark transition-all duration-300 w-full">
            PRENOTA ORA
          </button>
        </nav>
      </div>
    </header>
  );
}
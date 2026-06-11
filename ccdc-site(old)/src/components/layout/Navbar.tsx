'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed docked full-width top-0 z-50 bg-surface transition-all duration-300 ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}
      id="navbar"
    >
      <div className="flex justify-between items-center w-full px-gutter-desktop md:max-w-container-max mx-auto h-20">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="text-title-lg font-title-lg font-bold text-navy-vibrant">
            IIT Patna CCDC
          </Link>
        </div>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          <a href="/#about" className="text-text-secondary text-label-md font-label-md hover:text-navy-vibrant transition-colors duration-200">About</a>
          <a href="/#stats" className="text-text-secondary text-label-md font-label-md hover:text-navy-vibrant transition-colors duration-200">Placement Stats</a>
          <a href="/#recruiters" className="text-text-secondary text-label-md font-label-md hover:text-navy-vibrant transition-colors duration-200">Recruiters</a>
          <a href="/#downloads" className="text-text-secondary text-label-md font-label-md hover:text-navy-vibrant transition-colors duration-200">Downloads</a>
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          <a href="/#contact" className="text-text-secondary text-label-md font-label-md hover:text-navy-vibrant transition-colors duration-200">
            Contact
          </a>
          <a href="/#portal-access" className="bg-gradient-to-b from-primary to-navy-deep text-on-primary px-6 py-2 rounded-lg text-label-md font-label-md border-t border-white/20 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
            Login
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-text-primary p-2">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

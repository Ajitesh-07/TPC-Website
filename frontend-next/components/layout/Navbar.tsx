"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { NAVBAR_LINKS } from "@/data/navigation";

// Section links + the Contact anchor render with the same spacing so the bar
// reads evenly (the Contact link previously sat in a tighter group).
const NAV_LINKS = [...NAVBAR_LINKS, { label: "Contact", href: "/#contact" }];

const NAV_LINK_CLASS =
  "text-text-secondary text-label-md font-label-md hover:text-navy-vibrant transition-colors duration-200";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full top-0 z-50 bg-surface transition-all duration-300 ${
        isScrolled ? "shadow-md" : "shadow-sm"
      }`}
      id="navbar"
    >
      <div className="flex justify-between items-center w-full px-gutter-desktop md:max-w-container-max mx-auto h-20">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3" aria-label="IIT Patna CCDC — Home">
          <Image
            src="/iitp-logo.png"
            alt="Indian Institute of Technology Patna"
            width={44}
            height={44}
            priority
            className="w-11 h-11 object-contain"
          />
          <span className="hidden sm:flex flex-col leading-tight">
            <span className="text-title-md font-title-md font-bold text-navy-vibrant">
              IIT Patna
            </span>
            <span className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider">
              CCDC
            </span>
          </span>
        </Link>

        {/* Desktop links + actions (single even-spaced group) */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={NAV_LINK_CLASS}>
              {link.label}
            </a>
          ))}
          <Button href="/#portal-access" size="sm">
            Login
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="md:hidden text-text-primary p-2 -mr-2"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <span className="material-symbols-outlined">
            {menuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-surface-border bg-surface px-gutter-desktop py-4 animate-fadeIn"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`${NAV_LINK_CLASS} py-2`}
              >
                {link.label}
              </a>
            ))}
            <Button
              href="/#portal-access"
              size="sm"
              className="mt-3 w-full"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

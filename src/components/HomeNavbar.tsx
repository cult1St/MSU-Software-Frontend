"use client"

import { HeartPulse, Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

function HomeNavbar() {
   const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Services', href: '#services' },
    { name: 'Doctors', href: '#doctors' },
    // { name: 'Testimonials', href: '#testimonials' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-blue-700 hover:text-blue-900 transition">
            <HeartPulse className="w-8 h-8 text-emerald-500" />
            <span>MSU</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:text-blue-700 font-medium transition duration-150"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* CTA Button (Desktop) */}
          <Link
            href="/sign-in"
            className="hidden md:inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-full shadow-lg text-white bg-emerald-500 hover:bg-emerald-600 transition duration-300 transform hover:scale-105"
          >
            Book Appointment
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100 py-2' : 'max-h-0 opacity-0 overflow-hidden'
        } bg-white`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700"
            >
              {item.name}
            </a>
          ))}
          <Link
            href="/sign-in"
            onClick={() => setIsOpen(false)}
            className="block w-full text-center mt-4 px-3 py-2 border border-transparent text-base font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 transition"
          >
            Book Appointment
          </Link>
        </div>
      </div>
    </header>
  );
}
export default HomeNavbar;
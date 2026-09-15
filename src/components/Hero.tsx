import { CalendarDays } from "lucide-react";
import type { SyntheticEvent } from "react";

const Hero = () => (
  <section className="pt-18 md:pt-24 bg-gray-50 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
        {/* Text Content */}
        <div className="col-span-12 lg:col-span-7">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Expert Care, <span className="text-blue-700">Here at Faith Tabernacle</span>.
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-gray-600">
            Schedule your same-day appointment with our top-rated, compassionate specialists today. Your health is our priority.
          </p>
          <div className="mt-8 space-y-4 sm:flex sm:space-y-0 sm:space-x-4">
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl shadow-2xl text-white bg-emerald-500 hover:bg-emerald-600 transition duration-300 transform hover:-translate-y-1"
            >
              <CalendarDays className="w-6 h-6 mr-2" />
              Book Your Appointment Now
            </a>
          </div>
        </div>

        {/* Image/Illustration */}
        <div className="mt-12 lg:mt-0 col-span-12 lg:col-span-5 relative">
          {/* Placeholder for a professional medical image */}
          <div className="rounded-3xl overflow-hidden shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/logo.png"
              alt="A smiling doctor and patient in a modern clinic."
              className="object-cover w-full h-full"
              onError={(e: SyntheticEvent<HTMLImageElement>) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = "https://placehold.co/600x400/1D4ED8/FFFFFF?text=Trusted+Care";
              }}
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
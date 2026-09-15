'use client'

import React, { useState, type ChangeEvent, type FormEvent, type SyntheticEvent } from 'react';
import {
  Menu, X, HeartPulse, Stethoscope, Syringe, UserCheck, MapPin, Phone, Mail, Clock, ShieldCheck, Star, CalendarDays, Volume2, Loader, Zap, LogOut, MessageSquare, Home, FileText, Settings, CreditCard, Bell
} from 'lucide-react';

type ContactFormData = {
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
};

// --- DUMMY DATA AND SIMULATION CONSTANTS ---
const DUMMY_USER_ID = "PATIENT-7890-XYZ";

const DUMMY_APPOINTMENTS = [
    {
        id: 'a1',
        service: 'General Checkup',
        date: '10/25/2024',
        time: '9:00 AM',
        status: 'Confirmed',
        name: 'Jane Doe',
        email: 'jane@example.com'
    },
    {
        id: 'a2',
        service: 'Cardiology Diagnostics',
        date: '11/15/2024',
        time: '2:30 PM',
        status: 'Requested',
        name: 'Jane Doe',
        email: 'jane@example.com'
    },
    {
        id: 'a3',
        service: 'Physical Therapy',
        date: '09/30/2024',
        time: '11:00 AM',
        status: 'Completed',
        name: 'Jane Doe',
        email: 'jane@example.com'
    },
];

// --- API CONSTANTS (Kept for LLM features only) ---
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";
const GENERATE_CONTENT_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
const TTS_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

// Helper for Exponential Backoff
const fetchWithExponentialBackoff = async (url: string, options: RequestInit, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return await response.json();
      }
      if (response.status === 429 && i < retries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw new Error(`API request failed with status ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Helper for Base64 to ArrayBuffer (for TTS)
const base64ToArrayBuffer = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Helper for PCM to WAV conversion (for TTS)
const pcmToWav = (pcmData: Int16Array, sampleRate: number) => {
  const buffer = new ArrayBuffer(44 + pcmData.byteLength);
  const view = new DataView(buffer);
  let offset = 0;

  const writeString = (str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
    offset += str.length;
  };

  const writeUint32 = (val: number) => {
    view.setUint32(offset, val, true);
    offset += 4;
  };

  const writeUint16 = (val: number) => {
    view.setUint16(offset, val, true);
    offset += 2;
  };

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  // RIFF header
  writeString('RIFF');
  writeUint32(36 + pcmData.byteLength);
  writeString('WAVE');

  // fmt chunk
  writeString('fmt ');
  writeUint32(16);
  writeUint16(1);
  writeUint16(numChannels);
  writeUint32(sampleRate);
  writeUint32(byteRate);
  writeUint16(blockAlign);
  writeUint16(bitsPerSample);

  // data chunk
  writeString('data');
  writeUint32(pcmData.byteLength);

  // Write PCM data
  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(offset, pcmData[i], true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
};

// Simple Markdown Renderer for LLM Output
const MarkdownRenderer = ({ content }: { content: string }) => {
    if (!content) return null;

    const formattedContent = content.split('\n').map((line: string, index: number) => {
        if (line.startsWith('###')) {
            return <h4 key={index} className="text-lg font-bold mt-3 mb-1 text-gray-800">{line.replace('###', '').trim()}</h4>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
            return <p key={index} className="font-semibold mt-2">{line.replace(/\*\*/g, '').trim()}</p>;
        }
        if (line.startsWith('* ') || line.startsWith('- ')) {
            return <li key={index} className="ml-5 list-disc text-sm text-gray-700">{line.substring(2).trim()}</li>;
        }
        if (line.trim() === '') return <br key={index} />;

        return <p key={index} className="text-sm text-gray-700">{line}</p>;
    });

    return <div className="p-4 bg-gray-50 rounded-lg mt-4 border border-gray-200">{formattedContent}</div>;
};


// --- Utility Components ---

// This Logout button is now purely cosmetic for the dummy user
const LogoutButton = () => {
    const handleLogout = () => {
        console.log("Simulated Logout for Dummy User.");
        // In a real app, you would change isAuthReady state to false here
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-sm font-semibold rounded-full px-4 py-2 text-white bg-red-500 hover:bg-red-600 transition"
        >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
        </button>
    );
};


// 1. Mobile-friendly Navbar Component
const Navbar = ({ isDashboard, userId, toggleSidebar }: { isDashboard: boolean, userId: string|number, toggleSidebar: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  const publicNavItems = [
    { name: 'Services', href: '#services' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo/Brand (Left Side) */}
          <div className="flex items-center">
            {isDashboard && (
                <button 
                    onClick={toggleSidebar} 
                    className="p-2 mr-3 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none md:hidden"
                >
                    <Menu className="w-6 h-6" />
                </button>
            )}
            <a href="#" className="flex items-center space-x-2 text-2xl font-bold text-blue-700 hover:text-blue-900 transition">
              <HeartPulse className="w-8 h-8 text-emerald-500" />
              <span>MSU</span>
            </a>
          </div>

          {/* Desktop Navigation & Actions (Right Side) */}
          <nav className="hidden md:flex space-x-4 items-center">
            {!isDashboard ? (
                // Public Links
                <>
                {publicNavItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-gray-600 hover:text-blue-700 font-medium transition duration-150"
                  >
                    {item.name}
                  </a>
                ))}
                <a
                  href="#contact"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-full shadow-lg text-white bg-emerald-500 hover:bg-emerald-600 transition duration-300 transform hover:scale-105"
                >
                  Book Appointment
                </a>
                </>
            ) : (
                // Dashboard User Info
                <>
                    <div className="text-sm text-gray-500 hidden lg:block mr-4">
                        User ID: <span className="font-mono text-blue-700 break-all text-xs">{userId}</span>
                    </div>
                    <LogoutButton />
                </>
            )}
          </nav>


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

      {/* Mobile Menu Panel (for public site only - dashboard uses sidebar) */}
      {!isDashboard && (
        <div
            className={`md:hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-96 opacity-100 py-2' : 'max-h-0 opacity-0 overflow-hidden'
            } bg-white`}
        >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {publicNavItems.map((item) => (
                <a
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                {item.name}
                </a>
            ))}

            <a
                href="#contact"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center mt-4 px-3 py-2 border border-transparent text-base font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 transition"
            >
                Book Appointment
            </a>
            </div>
        </div>
      )}
    </header>
  );
};


// 2. Hero Section
const Hero = () => (
  <section className="pt-24 md:pt-32 bg-gray-50 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
        {/* Text Content */}
        <div className="col-span-12 lg:col-span-7">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Expert Care, <span className="text-blue-700">Right in Your Neighborhood</span>.
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
          <div className="aspect-w-16 aspect-h-9 sm:aspect-h-10 md:aspect-h-12 rounded-3xl overflow-hidden shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://placehold.co/600x400/1D4ED8/FFFFFF?text=Modern+Medical+Clinic"
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

// 3. Trust Bar / Accreditation
const TrustBar = () => (
  <div className="bg-white border-t border-b border-gray-200 py-6">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap justify-around items-center text-center gap-6">
        <div className="text-gray-700 flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-blue-700" />
          <span className="font-semibold text-sm sm:text-base">Accredited JCI Member</span>
        </div>
        <div className="text-gray-700 flex items-center space-x-2">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          <span className="font-semibold text-sm sm:text-base">4.9/5 Patient Rating</span>
        </div>
        <div className="text-gray-700 flex items-center space-x-2">
          <Clock className="w-6 h-6 text-emerald-500" />
          <span className="font-semibold text-sm sm:text-base">Same-Day Appointments</span>
        </div>
      </div>
    </div>
  </div>
);

// 4. Services Section (Updated for TTS)
const ServicesSection = () => {
  const services = [
    { id: 'general', icon: Stethoscope, title: 'General Medicine', description: 'Comprehensive primary care for all ages, focusing on prevention and chronic condition management.' },
    { id: 'vaccination', icon: Syringe, title: 'Vaccinations & Flu Shots', description: 'Up-to-date immunization services for adults and children, ensuring optimal health protection.' },
    { id: 'cardiology', icon: HeartPulse, title: 'Cardiology Diagnostics', description: 'Advanced screening and testing for heart health, including EKG and stress testing.' },
    { id: 'preventative', icon: UserCheck, title: 'Preventative Health', description: 'Wellness exams, health screenings, and lifestyle counseling tailored to your needs.' },
  ];
  const [isReading, setIsReading] = useState<string | null>(null); // Tracks which service ID is being read

  const readDescription = async (text: string, id: string) => {
    if (isReading === id) return; // Prevent double click

    setIsReading(id);
    try {
        const payload = {
            contents: [{
                parts: [{ text: `Say this service description clearly: ${text}` }]
            }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Puck" } // Upbeat voice
                    }
                }
            },
            model: "gemini-2.5-flash-preview-tts"
        };

        const result = await fetchWithExponentialBackoff(TTS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const part = result?.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (audioData && mimeType && mimeType.startsWith("audio/L16")) {
            const match = mimeType.match(/rate=(\d+)/);
            const sampleRate = match ? parseInt(match[1], 10) : 24000;
            const pcmData = base64ToArrayBuffer(audioData);
            const pcm16 = new Int16Array(pcmData);
            const wavBlob = pcmToWav(pcm16, sampleRate);
            const audioUrl = URL.createObjectURL(wavBlob);

            const audio = new Audio(audioUrl);
            audio.onended = () => {
                setIsReading(null);
                URL.revokeObjectURL(audioUrl);
            };
            audio.play().catch(e => {
                console.error("Audio playback error:", e);
                setIsReading(null);
            });
        } else {
            console.error("Invalid TTS response structure or mime type:", mimeType);
            setIsReading(null);
        }
    } catch (error) {
        console.error("Error generating or playing TTS audio:", error);
        setIsReading(null);
    }
  };

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-4">
          Our Comprehensive Services
        </h2>
        <p className="text-center text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
          We offer a wide range of specialized medical services to ensure you and your family receive the best care under one roof.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-gray-50 p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 border-t-4 border-blue-700 transform hover:-translate-y-1 flex flex-col"
            >
              <service.icon className="w-10 h-10 text-blue-700 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
              <p className="text-gray-600 text-sm flex-grow mb-4">{service.description}</p>
              <div className="flex items-center justify-between">
                <button
                    onClick={() => readDescription(service.description, service.id)}
                    disabled={isReading !== null}
                    className={`inline-flex items-center text-sm font-medium rounded-full px-3 py-1 transition ${
                        isReading === service.id
                            ? 'bg-blue-200 text-blue-700 cursor-wait'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                >
                    {isReading === service.id ? (
                        <>
                            <Loader className="w-4 h-4 mr-1 animate-spin" /> Reading...
                        </>
                    ) : (
                        <>
                            <Volume2 className="w-4 h-4 mr-1" /> Read Aloud ✨
                        </>
                    )}
                </button>
                <a href="#contact" className="inline-block text-emerald-500 font-medium hover:text-emerald-600 transition text-sm">
                  Book Service &rarr;
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 5. Value Proposition Section
const ValueProposition = () => {
    const pillars = [
        { icon: CalendarDays, title: 'Easy Booking & Short Waits', description: 'Use our online portal to schedule appointments and minimize time spent in the waiting room.' },
        { icon: UserCheck, title: 'Certified Specialists', description: 'Our medical team is board-certified, experienced, and dedicated to compassionate, personalized care.' },
        { icon: Syringe, title: 'State-of-the-Art Technology', description: 'We utilize the latest diagnostic tools for accurate results and effective, modern treatment plans.' },
    ];

    return (
        <section className="py-20 bg-blue-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl md:text-4xl font-extrabold text-center text-white mb-12">
                    Why Patients Choose HealthBridge
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pillars.map((pillar, index) => (
                        <div key={index} className="text-center p-6 bg-white rounded-xl shadow-xl">
                            <pillar.icon className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{pillar.title}</h3>
                            <p className="text-gray-600">{pillar.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// 6. Testimonials Section
const TestimonialsSection = () => {
    const testimonials = [
        { quote: "The easiest medical experience I've ever had. From booking to diagnosis, everything was seamless and professional.", name: 'Sarah L.', rating: 5 },
        { quote: "Dr. Chen listened attentively and provided clear, practical steps for my recovery. Truly expert and compassionate care.", name: 'Michael J.', rating: 5 },
    ];

    return (
        <section id="testimonials" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-4">
                    What Our Patients Say
                </h2>
                <div className="flex justify-center mb-12">
                    <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {testimonials.map((t, index) => (
                        <div key={index} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                            <p className="text-2xl italic text-gray-700 mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                            <div className="font-semibold text-blue-700">- {t.name}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// 7. Contact Form Section (Simulated Submission)
const ContactForm = () => {
  // Removed 'db' prop
  const [formData, setFormData] = useState<ContactFormData>({ name: '', email: '', phone: '', service: '', date: '' });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [prepList, setPrepList] = useState<string|null>(null);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string|null>(null); // Custom alert for user prompts

  const services = ['General Checkup', 'Vaccination', 'Specialist Consultation', 'Physical Therapy'];

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'service') {
        // Clear prep list when service changes
        setPrepList(null);
        setAlertMessage(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSubmitting(true);
    setMessage('');

    if (formData.name && formData.email && formData.service && formData.date) {
        // --- SIMULATED BACKEND SUBMISSION ---
        setTimeout(() => {
            console.log("Simulated Appointment Request Submitted:", formData);
            setMessage(`Thank you! Your appointment request for ${formData.service} on ${formData.date} has been simulated as submitted.`);
            setFormData({ name: '', email: '', phone: '', service: '', date: '' });
            setPrepList(null);
            setIsSubmitting(false);
        }, 1200); // 1.2 second delay to show the loading state
        // ------------------------------------

    } else {
        setMessage('Please fill in all required fields (Name, Email, Service, and Preferred Date).');
        setIsSubmitting(false);
    }
  };

  const generatePrepList = async () => {
    if (!formData.service) {
      setAlertMessage("Please select a service first to generate the prep list.");
      return;
    }
    setAlertMessage(null);
    setIsGeneratingPrep(true);
    setPrepList(null);

    const userQuery = `Generate a 5-point checklist and 3 key questions a patient should prepare for an appointment regarding the following service: "${formData.service}". Focus on maximizing the efficiency of the visit.`;
    const systemPrompt = "You are a friendly, professional medical assistant. Provide the response as a simple markdown list of items, with clear headings for the checklist and questions. Do not include a conversational introduction or conclusion.";

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
        const result = await fetchWithExponentialBackoff(GENERATE_CONTENT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (generatedText) {
            setPrepList(generatedText);
        } else {
            setPrepList("Could not generate preparation advice. Please try again.");
        }
    } catch (error) {
        console.error("Error generating content:", error);
        setPrepList("Error connecting to the preparation assistant. Please check your connection.");
    } finally {
        setIsGeneratingPrep(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden lg:grid lg:grid-cols-2">

                {/* Left Side: Text and Image */}
                <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-blue-700 text-white">
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-4">
                        Ready to book your visit?
                    </h2>
                    <p className="text-lg opacity-90 mb-8">
                        Use the secure form to request your preferred appointment time. Our staff will follow up to finalize the details and confirm your visit.
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <Phone className="w-6 h-6 text-emerald-300" />
                            <span className="font-medium">(555) 123-4567</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <MapPin className="w-6 h-6 text-emerald-300" />
                            <span className="font-medium">123 Health Ave, City, ST 12345</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Contact Form */}
                <div className="p-8 md:p-12 lg:p-16">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Request an Appointment</h3>

                    {alertMessage && (
                        <div className="p-3 mb-4 text-sm font-medium text-red-700 bg-red-100 rounded-lg">
                            {alertMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm p-3 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm p-3 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    id="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm p-3 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="service" className="block text-sm font-medium text-gray-700">Service Needed</label>
                            <select
                                name="service"
                                id="service"
                                value={formData.service}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm p-3 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white pr-8"
                            >
                                <option value="">Select a service</option>
                                {services.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Preferred Date</label>
                            <input
                                type="date"
                                name="date"
                                id="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm p-3 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>

                        {/* LLM Feature Button */}
                        <button
                            type="button"
                            onClick={generatePrepList}
                            disabled={isGeneratingPrep}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 disabled:opacity-70 disabled:cursor-wait"
                        >
                            {isGeneratingPrep ? (
                                <>
                                    <Loader className="w-5 h-5 mr-2 animate-spin" /> Generating Prep List...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5 mr-2 text-yellow-500" /> Generate Appointment Prep List ✨
                                </>
                            )}
                        </button>

                        {/* LLM Output Display */}
                        {prepList && <MarkdownRenderer content={prepList} />}


                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {isSubmitting ? 'Sending Request...' : 'Confirm My Appointment'}
                        </button>

                        {message && (
                            <p className={`mt-3 text-center text-sm font-medium ${message.includes('Thank you') ? 'text-emerald-600' : 'text-red-600'}`}>
                                {message}
                            </p>
                        )}
                    </form>
                </div>
            </div>
        </div>
    </section>
  );
};

// 8. Footer Component
const Footer = () => (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Clinic Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-emerald-400">HealthBridge Clinic</h4>
            <p className="text-gray-400 text-sm">Providing compassionate care and advanced medicine since 2015.</p>
            <div className="mt-4 flex items-center space-x-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>123 Health Ave, City, ST</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#services" className="text-gray-400 hover:text-white transition">Our Services</a></li>
              <li><a href="#testimonials" className="text-gray-400 hover:text-white transition">Patient Reviews</a></li>
            </ul>
          </div>

          {/* /* Column 3: Contact & Hours  */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact & Hours</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <a href="tel:(555) 123-4567" className="text-gray-400 hover:text-white transition">(555) 123-4567</a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <a href="mailto:info@healthbridge.com" className="text-gray-400 hover:text-white transition">info@healthbridge.com</a>
              </li>
              <li className="mt-4 text-gray-300">Mon - Fri: 8:00 AM - 5:00 PM</li>
            </ul>
          </div>

          {/* /* Column 4: Legal  */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} HealthBridge Clinic. All rights reserved.
        </div>
      </div>
    </footer>
);


// --- Dashboard Sub-Components ---

// Placeholder component for other views
const DashboardPlaceholder = ({ title }: { title: string }) => (
    <div className="p-10 bg-white rounded-xl shadow-lg h-full flex flex-col items-center justify-center">
        <Settings className="w-10 h-10 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">{title}</h2>
        <p className="text-gray-500">This section is currently under development. Check back soon!</p>
    </div>
);

// Main Appointment View (Using DUMMY_APPOINTMENTS)
const AppointmentsView = () => {
    // Removed dependency on 'db'
    const appointments = DUMMY_APPOINTMENTS; // Use static dummy data

    return (
        <div className="bg-white p-6 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center border-b pb-4">
                <CalendarDays className="w-6 h-6 mr-3" />
                Upcoming Appointments ({appointments.length})
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    {appointments.length === 0 ? (
                        <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                            <MessageSquare className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-600">You don&apos;t have any appointments scheduled yet.</p>
                            <a href="#contact" className="mt-4 inline-block text-emerald-600 hover:text-emerald-700 font-semibold">
                                Book Your First Appointment &rarr;
                            </a>
                        </div>
                    ) : (
                        appointments.map((appt) => (
                            <div key={appt.id} className="p-4 border rounded-xl bg-blue-50 hover:bg-blue-100 transition flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-lg text-blue-800">{appt.service}</p>
                                    <p className="text-sm text-gray-600">Requested for: {appt.name}</p>
                                    <p className="text-sm text-gray-600">Email: {appt.email}</p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span 
                                        className={`inline-block text-white text-xs font-semibold px-3 py-1 rounded-full ${
                                            // Dynamic status color - FIXED SYNTAX
                                            appt.status === 'Confirmed' ? 'bg-emerald-500' : 
                                            appt.status === 'Requested' ? 'bg-yellow-500' : 'bg-gray-500'
                                        } mb-1`}
                                    >
                                        {appt.status}
                                    </span>
                                    <p className="font-semibold text-gray-800 text-sm">{appt.date}</p>
                                    <p className="text-xs text-gray-600">{appt.time}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right Column: Quick Actions & Tips */}
                <div className="space-y-6">
                    <div className="p-6 rounded-xl shadow-md border-l-4 border-emerald-500 bg-emerald-50">
                        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                            <Zap className="w-5 h-5 mr-2 text-emerald-600" /> Quick Actions
                        </h3>
                        <div className="space-y-3">
                            <button className="w-full text-left flex items-center p-3 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition">
                                <Stethoscope className="w-5 h-5 mr-3" />
                                Find a Specialist
                            </button>
                            <button className="w-full text-left flex items-center p-3 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition">
                                <MessageSquare className="w-5 h-5 mr-3" />
                                Message Your Doctor
                            </button>
                            <button className="w-full text-left flex items-center p-3 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition">
                                <UserCheck className="w-5 h-5 mr-3" />
                                Update Profile Info
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6 rounded-xl shadow-md border-l-4 border-yellow-500 bg-yellow-50">
                        <h3 className="text-xl font-bold text-gray-800 mb-3">Daily Health Tip</h3>
                        <p className="text-sm text-gray-600 italic">&ldquo;Remember to drink at least 8 glasses of water today, especially if you have a virtual appointment scheduled. Hydration can improve focus!&rdquo;</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


// 9. Patient Dashboard (Refined Layout using Side Navigation)
const PatientDashboard = ({ userId, isSidebarOpen, setIsSidebarOpen }: { userId: string | number, isSidebarOpen: boolean, setIsSidebarOpen: (open: boolean) => void }) => {
    // Removed 'auth', 'setIsAuthReady', and 'db' props
    const [activeTab, setActiveTab] = useState('Home');

    const navItems = [
        { name: 'Home', icon: Home, tab: 'Home' },
        { name: 'Appointments', icon: CalendarDays, tab: 'Appointments' },
        { name: 'Messages', icon: MessageSquare, tab: 'Messages' },
        { name: 'Medical Records', icon: FileText, tab: 'Records' },
        { name: 'Billing & Insurance', icon: CreditCard, tab: 'Billing' },
        { name: 'Settings', icon: Settings, tab: 'Settings' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'Home':
            case 'Appointments':
                // Pass only necessary props (no 'db')
                return <AppointmentsView />;
            case 'Messages':
                return <DashboardPlaceholder title="Secure Patient Messaging" />;
            case 'Records':
                return <DashboardPlaceholder title="Electronic Medical Records" />;
            case 'Billing':
                return <DashboardPlaceholder title="Billing and Payment Portal" />;
            case 'Settings':
                return <DashboardPlaceholder title="Account Settings" />;
            default:
                return <AppointmentsView />;
        }
    };
    
    // Toggle sidebar for mobile view
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Sidebar Component
    const Sidebar = () => (
        <>
            {/* Backdrop for mobile (closes sidebar on click outside) */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" 
                    onClick={toggleSidebar}
                ></div>
            )}
            
            <div 
                className={`fixed inset-y-0 left-0 transform ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } md:relative md:translate-x-0 md:flex flex-col w-64 bg-blue-900 text-white transition-transform duration-300 ease-in-out z-40 p-6 shadow-2xl`}
            >
                <button 
                    onClick={toggleSidebar} 
                    className="absolute top-4 right-4 p-2 md:hidden text-blue-100 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
                
                {/* /* Profile Summary  */}
                <div className="pb-6 mb-6 border-b border-blue-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-lg">
                            {userId ? String(userId)[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                            <p className="font-semibold">Patient Account</p>
                            <p className="text-xs opacity-75 break-all">ID: {userId}</p>
                        </div>
                    </div>
                </div>

                {/* /* Navigation Links  */}
                <nav className="flex-grow space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.tab}
                            onClick={() => {
                                setActiveTab(item.tab);
                                setIsSidebarOpen(false); // Close on mobile navigation
                            }}
                            className={`w-full text-left flex items-center p-3 rounded-xl transition duration-150 ${
                                activeTab === item.tab 
                                    ? 'bg-blue-700 font-bold text-white shadow-lg' 
                                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                            }`}
                        >
                            <item.icon className="w-5 h-5 mr-3" />
                            <span>{item.name}</span>
                        </button>
                    ))}
                </nav>

                {/* /* Notification/Help Link (at bottom) */}
                <div className="pt-6 border-t border-blue-700 mt-auto">
                    <a href="#" className="flex items-center p-3 rounded-xl text-blue-200 hover:bg-blue-800 hover:text-white transition">
                        <Bell className="w-5 h-5 mr-3" />
                        <span>Notifications</span>
                    </a>
                </div>
            </div>
        </>
    );


    return (
        <div className="min-h-screen pt-20 flex flex-col md:flex-row bg-gray-50">
            {/* Sidebar (visible on md:screens and up) */}
            <Sidebar />

            {/* /* Main Content Area */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900">
                        {activeTab === 'Home' ? 'Patient Dashboard Overview' : activeTab}
                    </h1>
                </header>
                
                {/* /* Content based on active tab */}
                <div className="h-full">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

// 10. Component containing all public-facing sections
const LandingPage = () => (
    // Removed 'db' prop
    <>
        <main>
            <Hero />
            <TrustBar />
            <ServicesSection />
            <ValueProposition />
            <TestimonialsSection />
            <ContactForm />
        </main>
        <Footer />
    </>
);

// 11. Main Application Component
const PatientsIn = () => {
    // --- DUMMY DATA AUTHENTICATION ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Simulate successful authentication and loading
    const userId = DUMMY_USER_ID; 
    const isAuthReady = true; 
    const isLoading = false; 

    // Determine current view (always dashboard for this dummy setup)
    const isDashboard = Boolean(isAuthReady && userId);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader className="w-10 h-10 animate-spin text-blue-700" />
                <p className="ml-3 text-lg text-gray-700">Loading Clinic Portal...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans antialiased">
            <style>{`
                html { scroll-behavior: smooth; }
                .aspect-w-16 { aspect-ratio: 16 / 9; }
            `}</style>

            <Navbar 
                isDashboard={isDashboard} 
                userId={userId}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            
            {isDashboard ? (
                <PatientDashboard 
                    userId={userId} 
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />
            ) : (
                // This path is unlikely to be hit given the dummy data setup
                <LandingPage />
            )}
        </div>
    );
};

export default PatientsIn;

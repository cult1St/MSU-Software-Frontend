'use client'

import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import {
 HeartPulse, Stethoscope, Syringe, UserCheck, MapPin, Phone, Clock, ShieldCheck, Star, Volume2, Loader, Zap
} from 'lucide-react';
import HomeNavbar from '@src/components/HomeNavbar';
import Footer from '@src/components/Footer';
import Hero from '@src/components/Hero';

type ContactFormData = {
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
};

// --- Global API Constants and Helpers ---
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


// --- Utility Components (Defined inside the file for single-file mandate) ---

// 2. Hero Section
<Hero/>

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
    <section id="services" className="py-20 bg-white px-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-4">
          Our Comprehensive Services
        </h2>
        <p className="text-center text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
          We offer a wide range of specialized medical services to ensure you and your family receive the best care under one roof.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
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

// 7. Contact Form Section (Updated for LLM feature)
const ContactForm = () => {
  const [formData, setFormData] = useState<ContactFormData>({ name: '', email: '', phone: '', service: '', date: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [prepList, setPrepList] = useState<string | null>(null);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null); // Custom alert for user prompts

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

    // Simulate form submission success/failure
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (formData.name && formData.email && formData.service) {
        setMessage('Thank you! Your appointment request has been submitted. We will contact you shortly to confirm.');
        setFormData({ name: '', email: '', phone: '', service: '', date: '' });
        setPrepList(null);
    } else {
        setMessage('Please fill in all required fields (Name, Email, Service).');
    }
    setIsSubmitting(false);
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
                            <span className="font-medium">(234) 080-0000-0000</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <MapPin className="w-6 h-6 text-emerald-300" />
                            <span className="font-medium">Faith Tabernacle, CanaanLand. Ota</span>
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
<Footer/>


// 9. Main Application Component
const HomePage = () => {
  return (
    <div className="min-h-screen font-sans antialiased">
      {/* Tailwind CSS is assumed to be configured and available */}
      {/* Global font: Inter (default Tailwind font stack often defaults to this) */}
      <style>{`
        html { scroll-behavior: smooth; }
        .aspect-w-16 { aspect-ratio: 16 / 9; } /* Custom aspect ratio for image placeholder */
      `}</style>

      <HomeNavbar />
      <main>
        <Hero />
        <TrustBar />
        <ServicesSection />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;

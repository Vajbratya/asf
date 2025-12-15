'use client';

import { useState } from 'react';
import { Metadata } from 'next';

export default function ContatoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert('Mensagem enviada! Entraremos em contato em breve.');
  };

  return (
    <main className="min-h-screen bg-white pt-20">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div>
            <h1 className="text-4xl font-semibold text-[#1A1A1A] mb-6">Entre em Contato</h1>
            <p className="text-lg text-[#1A1A1A]/60 mb-12">
              Estamos aqui para ajudar. Preencha o formulario ou use um dos canais abaixo.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Email</h3>
                <a
                  href="mailto:contato@integrasaude.com.br"
                  className="text-[#FF8C00] hover:underline"
                >
                  contato@integrasaude.com.br
                </a>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Telefone</h3>
                <a href="tel:+551140028922" className="text-[#1A1A1A]/70 hover:text-[#1A1A1A]">
                  +55 (11) 4002-8922
                </a>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Endereco</h3>
                <p className="text-[#1A1A1A]/70">
                  Av. Paulista, 1000 - Bela Vista
                  <br />
                  Sao Paulo - SP, 01310-100
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Horario de Atendimento</h3>
                <p className="text-[#1A1A1A]/70">
                  Segunda a Sexta: 9h as 18h
                  <br />
                  Suporte Enterprise: 24/7
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-[#FAFAFA] rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Hospital/Empresa
                </label>
                <input
                  type="text"
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none transition-colors"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Mensagem
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none transition-colors resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#1A1A1A] text-white font-medium rounded-full hover:bg-[#2A2A2A] transition-colors"
              >
                Enviar Mensagem
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

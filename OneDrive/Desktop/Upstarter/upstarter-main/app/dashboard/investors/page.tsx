'use client'

import { TrendingUp, Plus, Building2, DollarSign, Target, Users } from 'lucide-react'
import Link from 'next/link'

export default function InvestorsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Trova Investitori</h1>
        <p className="text-gray-600 text-lg">
          Connettiti con angel investor, VC e family office interessati al tuo settore e stage di sviluppo
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Marketplace Investitori in Arrivo</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Stiamo creando la piattaforma più completa per il matching startup-investitori in Italia. 
          Database verificato di VC, angel investor e family office con focus settoriali specifici.
        </p>
        <div className="flex justify-center">
          <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            🚀 Lancio Previsto - Q3 2025
          </span>
        </div>
      </div>

      {/* Preview Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">VC Database</h3>
          <p className="text-gray-600 text-sm">
            Database completo di Venture Capital con focus settoriali, ticket size e stage preferences.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Angel Network</h3>
          <p className="text-gray-600 text-sm">
            Rete verificata di angel investor con expertise settoriali e track record di investimento.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Family Office</h3>
          <p className="text-gray-600 text-sm">
            Connessioni con family office e investitori istituzionali per round di crescita.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="p-3 bg-orange-100 rounded-lg w-fit mb-4">
            <Target className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Matching</h3>
          <p className="text-gray-600 text-sm">
            Algoritmo che trova investitori allineati con settore, stage e valutazione della startup.
          </p>
        </div>
      </div>

      {/* Investment Stages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Stage di Investimento Supportati</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">Pre-Seed</div>
            <div className="text-lg text-gray-900 mb-2">€50k - €250k</div>
            <p className="text-sm text-gray-600">
              Angel investor, incubatori, family & friends per validazione idea e MVP
            </p>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">Seed</div>
            <div className="text-lg text-gray-900 mb-2">€250k - €2M</div>
            <p className="text-sm text-gray-600">
              Seed VC, angel groups per product-market fit e primi ricavi
            </p>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-2">Series A+</div>
            <div className="text-lg text-gray-900 mb-2">€2M - €20M+</div>
            <p className="text-sm text-gray-600">
              Growth VC, private equity per scaling e espansione internazionale
            </p>
          </div>
        </div>
      </div>

      {/* Industry Focus Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Focus Settoriali</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            'FinTech', 'HealthTech', 'EdTech', 'CleanTech',
            'B2B SaaS', 'Marketplace', 'IoT', 'AI/ML',
            'E-commerce', 'FoodTech', 'PropTech', 'Mobility'
          ].map((sector) => (
            <div key={sector} className="text-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">{sector}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Preparation Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">💡 Preparati per gli Investitori</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Documenti Essenziali:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Pitch deck (10-12 slide)</li>
              <li>• Business plan esecutivo</li>
              <li>• Proiezioni finanziarie 3-5 anni</li>
              <li>• Analisi competitiva dettagliata</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Metriche Chiave:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Traction e customer validation</li>
              <li>• Unit economics (LTV/CAC)</li>
              <li>• Team track record</li>
              <li>• Intellectual property</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          Inizia preparando la tua startup con un'analisi professionale
        </p>
        <Link
          href="/dashboard/new-idea"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          <Plus className="w-5 h-5" />
          Analizza la Tua Idea
        </Link>
      </div>
    </div>
  )
}
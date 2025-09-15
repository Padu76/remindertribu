'use client'

import { Settings, User, Bell, Shield, Database, Download } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'

export default function SettingsPage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Impostazioni</h1>
        <p className="text-gray-600 mt-1">Gestisci il tuo account e le preferenze della piattaforma</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Profilo Utente</h2>
        </div>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
              <input
                type="text"
                value={session?.user?.name || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Il tuo nome"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={session?.user?.email || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                readOnly
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Utente</label>
            <select className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Startup Founder</option>
              <option>Investor</option>
              <option>Consultant</option>
              <option>Student</option>
            </select>
          </div>

          <div className="pt-4">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Salva Modifiche
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Bell className="w-6 h-6 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Notifiche</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Email Notifiche</h3>
              <p className="text-sm text-gray-600">Ricevi aggiornamenti su analisi e nuove funzionalità</p>
            </div>
            <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Marketing Updates</h3>
              <p className="text-sm text-gray-600">Ricevi news su eventi e opportunità di networking</p>
            </div>
            <input type="checkbox" className="w-4 h-4 text-blue-600" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Weekly Digest</h3>
              <p className="text-sm text-gray-600">Riassunto settimanale delle tue attività</p>
            </div>
            <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
          </div>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Privacy e Sicurezza</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Profilo Pubblico</h3>
              <p className="text-sm text-gray-600">Permetti ad altri utenti di vedere il tuo profilo</p>
            </div>
            <input type="checkbox" className="w-4 h-4 text-blue-600" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Analytics Tracking</h3>
              <p className="text-sm text-gray-600">Aiutaci a migliorare la piattaforma con dati anonimi</p>
            </div>
            <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Cambia Password
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Database className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Gestione Dati</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Esporta Dati</h3>
              <p className="text-sm text-gray-600">Scarica una copia di tutti i tuoi dati e analisi</p>
            </div>
            <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              <Download className="w-4 h-4" />
              Esporta
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-900 mb-2">Elimina Account</h3>
              <p className="text-sm text-red-700 mb-4">
                Questa azione eliminerà permanentemente il tuo account e tutti i dati associati. 
                Non sarà possibile recuperare le informazioni.
              </p>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                Elimina Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sessione</h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Disconnetti</h3>
            <p className="text-sm text-gray-600">Esci dal tuo account su questo dispositivo</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Disconnetti
          </button>
        </div>
      </div>
    </div>
  )
}
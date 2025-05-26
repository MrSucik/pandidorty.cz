import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export function NotFound({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <div className="text-gray-600 text-lg">
          {children || <p>Stránka, kterou hledáte, neexistuje.</p>}
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium transition-colors"
        >
          Zpět
        </button>
        <Link
          to="/"
          className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded font-medium transition-colors"
        >
          Domů
        </Link>
      </div>
    </div>
  )
}

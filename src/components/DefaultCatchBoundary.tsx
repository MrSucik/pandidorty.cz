import {
  ErrorComponent,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  })

  console.error('DefaultCatchBoundary Error:', error)

  return (
    <div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6">
      <ErrorComponent error={error} />
      <div className="flex gap-2 items-center flex-wrap">
        <button
          type="button"
          onClick={() => {
            router.invalidate()
          }}
          className="px-4 py-2 bg-blue-800 hover:bg-blue-900 rounded text-white font-medium transition-colors"
        >
          Zkusit znovu
        </button>
        {isRoot ? (
          <Link
            to="/"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white font-medium transition-colors"
          >
            Domů
          </Link>
        ) : (
          <Link
            to="/"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white font-medium transition-colors"
            onClick={(e) => {
              e.preventDefault()
              window.history.back()
            }}
          >
            Zpět
          </Link>
        )}
      </div>
    </div>
  )
}

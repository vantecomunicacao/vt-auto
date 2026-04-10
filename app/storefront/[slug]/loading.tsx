export default function StorefrontLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-8 w-40 rounded-lg bg-gray-200" />
          <div className="h-6 w-24 rounded-lg bg-gray-200" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters skeleton */}
        <div className="flex gap-3 mb-8 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 w-24 rounded-full bg-gray-200 flex-shrink-0" />
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
                <div className="h-5 w-2/3 rounded bg-gray-200 mt-2" />
                <div className="flex gap-2 mt-1">
                  <div className="h-3 w-16 rounded bg-gray-200" />
                  <div className="h-3 w-16 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

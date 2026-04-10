export default function VehicleLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-4 w-4 rounded bg-gray-200" />
          <div className="h-4 w-32 rounded bg-gray-200" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gallery skeleton */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="aspect-[16/10] rounded-2xl bg-gray-200" />
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-20 h-14 rounded-lg bg-gray-200 flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
              <div className="h-5 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-1/2 rounded bg-gray-200" />
              <div className="h-8 w-2/3 rounded bg-gray-200 mt-2" />
              <div className="h-11 w-full rounded-xl bg-gray-200 mt-2" />
              <div className="h-11 w-full rounded-xl bg-gray-200" />
            </div>
            <div className="bg-white rounded-2xl p-5 flex flex-col gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between py-1">
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

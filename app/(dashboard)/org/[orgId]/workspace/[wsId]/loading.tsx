export default function WorkspaceLoading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-7 bg-zinc-800 rounded w-48 mb-2" />
      <div className="h-4 bg-zinc-800 rounded w-32 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="h-3 bg-zinc-800 rounded w-20 mb-3" />
            <div className="h-8 bg-zinc-800 rounded w-12 mb-2" />
            <div className="h-3 bg-zinc-800 rounded w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}
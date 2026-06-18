export function CategoryManager() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">📁</span>
        <h1 className="text-lg font-black text-ink">Category Manager</h1>
      </div>
      
      <div className="bg-surface rounded-2xl border border-line p-12 text-center text-muted shadow-card">
        <div className="text-5xl mb-4">📂</div>
        <h2 className="text-base font-bold text-ink">Category Management coming in Phase 2</h2>
        <p className="text-xs mt-1 text-muted max-w-xs mx-auto leading-relaxed">
          Here you will be able to add new categories, rename them, and change their sorting order for the menu.
        </p>
      </div>
    </div>
  );
}

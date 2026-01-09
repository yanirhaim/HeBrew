"use client";

export default function PracticePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-4 pb-24 pt-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">
        Practice
      </h1>

      <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <div className="mb-2 text-sm text-slate-500">Progress</div>
        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-blue-100">
          <div className="h-full w-0 bg-blue-500"></div>
        </div>
        <div className="text-xs text-slate-500">0 / 0 words practiced</div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-6 text-center">
          <div className="mb-4 text-4xl">📝</div>
          <h2 className="mb-2 text-lg font-semibold text-slate-800">
            Practice Mode
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Practice conjugations, translations, and vocabulary from your words bank.
          </p>
          <button className="rounded-lg bg-blue-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600">
            Start Practice
          </button>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-6 text-center">
          <div className="mb-4 text-4xl">📊</div>
          <h2 className="mb-2 text-lg font-semibold text-slate-800">
            Statistics
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold text-slate-800">0</div>
              <div className="text-slate-500">Words Learned</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">0</div>
              <div className="text-slate-500">Streak</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

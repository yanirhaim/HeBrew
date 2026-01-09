"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function PracticePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-32 pt-8">
      <h1 className="mb-8 text-center text-3xl font-extrabold text-feather-text">
        Practice
      </h1>

      <Card className="mb-6">
        <div className="mb-2 text-sm font-bold uppercase tracking-wide text-feather-text-light">Daily Goal</div>
        <div className="mb-3 h-4 w-full overflow-hidden rounded-full bg-feather-gray">
          <div className="h-full w-[0%] bg-feather-yellow rounded-full transition-all duration-1000"></div>
        </div>
        <div className="text-right text-xs font-bold text-feather-text-light">0 / 20 XP</div>
      </Card>

      <div className="space-y-4">
        <Card className="text-center py-8">
          <div className="mb-4 text-6xl">📝</div>
          <h2 className="mb-2 text-xl font-extrabold text-feather-text">
            Practice Mode
          </h2>
          <p className="mb-6 text-sm font-bold text-feather-text-light px-4">
            Practice conjugations, translations, and vocabulary from your words bank.
          </p>
          <Button variant="secondary" size="lg">
            START PRACTICE
          </Button>
        </Card>

        <Card className="text-center py-8">
          <div className="mb-4 text-6xl">📊</div>
          <h2 className="mb-6 text-xl font-extrabold text-feather-text">
            Statistics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border-2 border-feather-gray p-3">
              <div className="text-2xl font-extrabold text-feather-blue">0</div>
              <div className="text-xs font-bold uppercase text-feather-text-light">Words</div>
            </div>
            <div className="rounded-xl border-2 border-feather-gray p-3">
              <div className="text-2xl font-extrabold text-feather-red">0</div>
              <div className="text-xs font-bold uppercase text-feather-text-light">Streak</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

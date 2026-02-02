"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function PracticePage() {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col bg-white px-5 pb-[116px] pt-safe">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold text-feather-text">Práctica</h1>
        <p className="mt-2 text-sm font-bold text-feather-text-light">
          Elige tu modo para hoy
        </p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 auto-rows-[1fr]">
        <button
          onClick={() => router.push("/practice/daily")}
          className="flex w-full flex-col justify-between gap-2 rounded-3xl border-2 border-feather-gray bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-feather-blue hover:shadow-md sm:p-6"
        >
          <div className="mb-3 text-4xl">📝</div>
          <div className="text-lg font-extrabold text-feather-text">Práctica diaria</div>
          <p className="mt-1 text-sm font-medium text-feather-text-light">
            Sesión guiada con vocabulario y conjugaciones.
          </p>
        </button>

        <button
          onClick={() => router.push("/flashcards?autostart=1")}
          className="flex w-full flex-col justify-between gap-2 rounded-3xl border-2 border-feather-gray bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-feather-green hover:shadow-md sm:p-6"
        >
          <div className="mb-3 text-4xl">🧠</div>
          <div className="text-lg font-extrabold text-feather-text">Flashcards</div>
          <p className="mt-1 text-sm font-medium text-feather-text-light">
            Repasa rápido y refuerza la memoria.
          </p>
        </button>

        <button
          onClick={() => router.push("/reading")}
          className="flex w-full flex-col justify-between gap-2 rounded-3xl border-2 border-feather-gray bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-feather-yellow hover:shadow-md sm:p-6"
        >
          <div className="mb-3 text-4xl">📖</div>
          <div className="text-lg font-extrabold text-feather-text">Lectura</div>
          <p className="mt-1 text-sm font-medium text-feather-text-light">
            Historias cortas para mejorar comprensión.
          </p>
        </button>
      </div>
    </div>
  );
}

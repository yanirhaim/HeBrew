"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function PracticePage() {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-40 pt-8">
      <h1 className="mb-8 text-center text-3xl font-extrabold text-feather-text">
        Práctica Diaria
      </h1>

      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-8">📝</div>
        <p className="text-lg font-bold text-feather-text-light mb-8 text-center">
          Comienza tu práctica diaria para mejorar tu hebreo
        </p>
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth
          onClick={() => router.push("/practice/daily")}
        >
          Iniciar tu práctica diaria
        </Button>
      </div>
    </div>
  );
}

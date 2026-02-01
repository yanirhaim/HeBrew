"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import WordCard from "@/components/WordCard";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/Button";
import AddWordModal from "@/components/AddWordModal";
import { Word } from "@/lib/types";
import { convexWordToWord } from "@/lib/convex-helpers";

export default function VerbsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const convexWords = useQuery(api.words.list);
  const isLoading = convexWords === undefined;
  const error = convexWords === null ? "Error al conectar con la base de datos. Por favor, verifica tu conexión a internet o permisos." : null;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const words: Word[] = convexWords ? convexWords.map(convexWordToWord) : [];

  const filteredWords = words.filter(
    (word) =>
      word.hebrew.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.translation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-40 pt-8">
      <h1 className="mb-8 text-center text-3xl font-extrabold text-feather-text">
        Verbos y Palabras
      </h1>

      <div className="mb-6">
        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          size="lg"
          fullWidth
          className="mb-4"
        >
          Agregar Verbo o Palabra
        </Button>
        <input
          type="text"
          placeholder="Buscar palabras..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border-2 border-feather-gray bg-feather-gray/10 px-4 py-3 text-base font-bold text-feather-text placeholder-feather-text-light transition-all focus:border-feather-blue focus:bg-white focus:outline-none"
        />
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-center text-red-600">
          <p className="font-bold">Error</p>
          <p className="text-sm">{error}</p>
          <p className="mt-2 text-xs text-red-500">Revisa la consola del navegador para más detalles</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-feather-gray/30 border-t-feather-blue"></div>
        </div>
      ) : filteredWords.length > 0 ? (
        <div className="space-y-4">
          {filteredWords.map((word) => (
            <WordCard 
              key={word.id} 
              word={word} 
              onClick={() => router.push(`/verbs/${word.id}`)}
            />
          ))}
        </div>
      ) : (
        !error && (
          <EmptyState
            title={searchQuery ? "No se encontraron coincidencias" : "Aún no hay palabras"}
            description={
              searchQuery
                ? "Prueba con otro término de búsqueda"
                : "Comienza a construir tu vocabulario en hebreo agregando palabras a tu banco."
            }
            icon="📚"
          />
        )
      )}

      <AddWordModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
}

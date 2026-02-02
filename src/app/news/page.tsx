"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchNewsList,
  NewsListItem,
} from "@/lib/openrouter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default function NewsPage() {
  const [items, setItems] = useState<NewsListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNewsList = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await fetchNewsList();
      setItems(result.items || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar noticias";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNewsList();
  }, [loadNewsList]);

  const showList = useMemo(() => {
    return !isLoading && items.length > 0;
  }, [isLoading, items.length]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-40 pt-8">
      <h1 className="mb-8 text-center text-3xl font-extrabold text-feather-text">
        Noticias
      </h1>

      {error && (
        <Card className="mb-6 border-feather-red bg-red-50 text-feather-red">
          <div className="font-bold">{error}</div>
        </Card>
      )}

      <div className="mb-6 flex items-center justify-between gap-2">
        <Button
          onClick={loadNewsList}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      {isLoading && (
        <div className="py-12 text-center">
          <div className="mb-4 text-lg font-bold text-feather-text-light">
            Buscando noticias...
          </div>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-feather-blue border-t-transparent"></div>
        </div>
      )}

      {showList && (
        <div className="mb-6 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wide text-feather-text-light">
            Titulares
          </div>
          {items.map((item) => {
            return (
              <Link
                key={item.link || item.title}
                href={{
                  pathname: "/news/item",
                  query: {
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate || "",
                    description: item.description || "",
                  },
                }}
                className="block w-full rounded-xl border border-feather-gray bg-white px-4 py-3 text-left transition hover:border-feather-blue"
              >
                <div className="flex gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-feather-gray/20 text-2xl text-feather-text-light">
                    📰
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-feather-text">{item.title}</div>
                    {item.pubDate && (
                      <div className="mt-1 text-xs text-feather-text-light">{item.pubDate}</div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

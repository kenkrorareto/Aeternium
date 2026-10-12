"use client";

import { useEffect, useMemo, useState } from "react";
import type { CharacterDTO } from "@/lib/types";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]/g, "");
}

export default function Gallery() {
  const [characters, setCharacters] = useState<CharacterDTO[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [activeLetter, setActiveLetter] = useState("all");

  useEffect(() => {
    fetch("/api/characters")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "No se pudo cargar la galería");
        return json.characters as CharacterDTO[];
      })
      .then((data) => {
        setCharacters(data);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error");
        setStatus("error");
      });
  }, []);

  const cards = useMemo(
    () =>
      characters.map((character) => {
        const key = normalize(character.name);
        return {
          character,
          key,
          letter: (key.charAt(0) || "#").toUpperCase(),
        };
      }),
    [characters]
  );

  const letters = useMemo(
    () => [...new Set(cards.map((c) => c.letter))].sort(),
    [cards]
  );

  const ordered = useMemo(() => {
    const direction = sort === "desc" ? -1 : 1;
    const normalizedQuery = normalize(query);
    return [...cards]
      .sort(
        (a, b) =>
          a.character.name.localeCompare(b.character.name, "es") * direction
      )
      .filter((card) => {
        const matchesText = card.key.includes(normalizedQuery);
        const matchesLetter =
          activeLetter === "all" || card.letter === activeLetter;
        return matchesText && matchesLetter;
      });
  }, [cards, query, sort, activeLetter]);

  return (
    <div className="gallery-page">
      <header className="gallery-page__header">
        <h1 className="gallery-page__title">Galería de Personajes</h1>

        <div className="toolbar" role="search">
          <input
            className="search-input"
            type="search"
            placeholder="Buscar personaje…"
            autoComplete="off"
            spellCheck={false}
            aria-label="Buscar personaje por nombre"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <label className="sort-field">
            <span>Orden</span>
            <select
              className="sort-select"
              aria-label="Ordenar personajes"
              value={sort}
              onChange={(e) => setSort(e.target.value as "asc" | "desc")}
            >
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
          </label>
        </div>

        <div className="filters" role="group" aria-label="Filtrar por inicial">
          <button
            type="button"
            className={activeLetter === "all" ? "chip is-active" : "chip"}
            onClick={() => setActiveLetter("all")}
          >
            Todos
          </button>
          {letters.map((letter) => (
            <button
              key={letter}
              type="button"
              className={activeLetter === letter ? "chip is-active" : "chip"}
              onClick={() => setActiveLetter(letter)}
            >
              {letter}
            </button>
          ))}
        </div>

        <p className="result-count" aria-live="polite">
          {status === "ready"
            ? ordered.length === 1
              ? "1 personaje"
              : `${ordered.length} personajes`
            : ""}
        </p>
      </header>

      {error && <p className="notice notice--error">{error}</p>}
      {status === "loading" && (
        <p className="no-results muted">Cargando galería…</p>
      )}

      {status === "ready" && (
        <div id="gallery">
          {ordered.map(({ character }) => (
            <div key={character.id} className="thumbnail-container appear">
              <h2>{character.name}</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={character.image_url}
                alt={`Retrato de ${character.name}`}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {status === "ready" && ordered.length === 0 && (
        <p className="no-results">No se encontraron personajes.</p>
      )}
    </div>
  );
}

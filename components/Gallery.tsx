"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const selected =
    selectedIndex !== null && ordered[selectedIndex]
      ? ordered[selectedIndex].character
      : null;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (selectedIndex === null) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedIndex(null);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === null ? prev : (prev - 1 + ordered.length) % ordered.length
        );
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === null ? prev : (prev + 1) % ordered.length
        );
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIndex, ordered.length]);

  useEffect(() => {
    if (selectedIndex !== null && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedIndex]);

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

      {error && <p className="notice notice--error" role="alert">{error}</p>}

      {status === "loading" && (
        <div id="gallery--skeleton" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-block skeleton-card__title" />
              <div className="skeleton-block skeleton-card__img" />
            </div>
          ))}
        </div>
      )}

      {status === "ready" && (
        <div id="gallery">
          {ordered.map(({ character }, index) => (
            <div
              key={character.id}
              className="thumbnail-container appear"
              style={{ animationDelay: `${(index % 8) * 45}ms` }}
            >
              <h2>{character.name}</h2>
              <div
                className="thumb-frame"
                role="button"
                tabIndex={0}
                aria-label={`Ampliar imagen de ${character.name}`}
                onClick={() => {
                  const idx = ordered.findIndex((o) => o.character.id === character.id);
                  setSelectedIndex(idx >= 0 ? idx : 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    const idx = ordered.findIndex((o) => o.character.id === character.id);
                    setSelectedIndex(idx >= 0 ? idx : 0);
                  }
                }}
              >
                <Image
                  src={character.image_url}
                  alt={`Retrato de ${character.name}`}
                  fill
                  sizes="(max-width: 900px) 45vw, (min-width: 1400px) 320px, 33vw"
                  quality={85}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {status === "ready" && ordered.length === 0 && (
        <p className="no-results">
          No se encontraron personajes.
          <small>
            Prueba a cambiar el nombre buscado o el filtro de letra.
          </small>
        </p>
      )}

      {mounted &&
        selected &&
        selectedIndex !== null &&
        createPortal(
          <div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`Imagen ampliada de ${selected.name} (${selectedIndex + 1} de ${ordered.length})`}
            onClick={() => setSelectedIndex(null)}
          >
            <button
              type="button"
              className="lightbox__close"
              aria-label="Cerrar imagen ampliada"
              onClick={() => setSelectedIndex(null)}
              ref={closeBtnRef}
            >
              ×
            </button>
            <button
              type="button"
              className="lightbox__nav lightbox__nav--prev"
              aria-label="Imagen anterior"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) =>
                  prev === null ? prev : (prev - 1 + ordered.length) % ordered.length
                );
              }}
            >
              ‹
            </button>
            <button
              type="button"
              className="lightbox__nav lightbox__nav--next"
              aria-label="Siguiente imagen"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) =>
                  prev === null ? prev : (prev + 1) % ordered.length
                );
              }}
            >
              ›
            </button>
            <figure
              className="lightbox__frame"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                className="lightbox__img"
                src={selected.image_url}
                alt={`Retrato de ${selected.name}`}
                width={1200}
                height={1600}
                sizes="90vw"
                quality={90}
                loading="eager"
                decoding="async"
              />
              <figcaption className="lightbox__caption">
                <span className="lightbox__name">{selected.name}</span>
                <span className="lightbox__counter">
                  {selectedIndex + 1} / {ordered.length}
                </span>
              </figcaption>
            </figure>
          </div>,
          document.body
        )}
    </div>
  );
}
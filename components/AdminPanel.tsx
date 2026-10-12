"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CharacterDTO, MapDTO } from "@/lib/types";

type Notice = { kind: "ok" | "error"; text: string } | null;

export default function AdminPanel() {
  const router = useRouter();
  const [characters, setCharacters] = useState<CharacterDTO[]>([]);
  const [maps, setMaps] = useState<MapDTO[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);

  const charNameRef = useRef<HTMLInputElement>(null);
  const charFileRef = useRef<HTMLInputElement>(null);
  const mapNameRef = useRef<HTMLInputElement>(null);
  const mapSlugRef = useRef<HTMLInputElement>(null);
  const mapFileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [charsRes, mapsRes] = await Promise.all([
        fetch("/api/characters"),
        fetch("/api/maps"),
      ]);
      const charsJson = await charsRes.json();
      const mapsJson = await mapsRes.json();
      setCharacters(charsJson.characters ?? []);
      setMaps(mapsJson.maps ?? []);
    } catch {
      setNotice({ kind: "error", text: "No se pudieron cargar los datos" });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadCharacter(e: React.FormEvent) {
    e.preventDefault();
    const name = charNameRef.current?.value.trim() ?? "";
    const file = charFileRef.current?.files?.[0];
    if (!name || !file) {
      setNotice({ kind: "error", text: "Indica nombre e imagen del personaje" });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const form = new FormData();
      form.set("name", name);
      form.set("file", file);
      const res = await fetch("/api/admin/characters", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo subir");
      if (charNameRef.current) charNameRef.current.value = "";
      if (charFileRef.current) charFileRef.current.value = "";
      setNotice({ kind: "ok", text: `Personaje «${name}» añadido` });
      await load();
    } catch (err) {
      setNotice({
        kind: "error",
        text: err instanceof Error ? err.message : "Error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function uploadMap(e: React.FormEvent) {
    e.preventDefault();
    const name = mapNameRef.current?.value.trim() ?? "";
    const slug = mapSlugRef.current?.value.trim() ?? "";
    const file = mapFileRef.current?.files?.[0];
    if (!name || !file) {
      setNotice({ kind: "error", text: "Indica nombre e imagen del mapa" });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const form = new FormData();
      form.set("name", name);
      if (slug) form.set("slug", slug);
      form.set("file", file);
      const res = await fetch("/api/admin/maps", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo subir");
      if (mapNameRef.current) mapNameRef.current.value = "";
      if (mapSlugRef.current) mapSlugRef.current.value = "";
      if (mapFileRef.current) mapFileRef.current.value = "";
      setNotice({ kind: "ok", text: `Mapa «${name}» añadido` });
      await load();
    } catch (err) {
      setNotice({
        kind: "error",
        text: err instanceof Error ? err.message : "Error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function deleteCharacter(character: CharacterDTO) {
    if (!confirm(`¿Eliminar a «${character.name}»?`)) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/characters/${character.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "No se pudo eliminar");
      }
      setCharacters((prev) => prev.filter((c) => c.id !== character.id));
      setNotice({ kind: "ok", text: `Personaje «${character.name}» eliminado` });
    } catch (err) {
      setNotice({
        kind: "error",
        text: err instanceof Error ? err.message : "Error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function deleteMap(map: MapDTO) {
    if (
      !confirm(
        `¿Eliminar el mapa «${map.name}»? Se borrarán también sus marcadores.`
      )
    )
      return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/maps/${map.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "No se pudo eliminar");
      }
      setMaps((prev) => prev.filter((m) => m.id !== map.id));
      setNotice({ kind: "ok", text: `Mapa «${map.name}» eliminado` });
    } catch (err) {
      setNotice({
        kind: "error",
        text: err instanceof Error ? err.message : "Error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/mapa");
    router.refresh();
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page__title">Panel de administración</h1>

      <div style={{ textAlign: "center" }}>
        <button className="btn btn--ghost" onClick={logout}>
          Cerrar sesión
        </button>
      </div>

      {notice && (
        <p
          role="alert"
          aria-live="polite"
          className={
            notice.kind === "ok"
              ? "notice notice--ok"
              : "notice notice--error"
          }
        >
          {notice.text}
        </p>
      )}

      <div className="admin-grid">
        <section className="admin-card">
          <h2>Nuevo personaje</h2>
          <form onSubmit={uploadCharacter}>
            <div className="field">
              <label htmlFor="char-name">Nombre</label>
              <input
                id="char-name"
                ref={charNameRef}
                className="input"
                placeholder="Nombre del personaje"
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label htmlFor="char-file">Imagen</label>
              <input
                id="char-file"
                ref={charFileRef}
                className="input"
                type="file"
                accept="image/*"
              />
            </div>
            <button className="btn" type="submit" disabled={busy}>
              Subir personaje
            </button>
          </form>

          <h2 style={{ marginTop: "1.6rem" }}>
            Personajes ({characters.length})
          </h2>
          <ul className="admin-list">
            {characters.map((character) => (
              <li key={character.id} className="admin-list__item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="admin-list__thumb"
                  src={character.image_url}
                  alt=""
                  width={40}
                  height={40}
                  loading="lazy"
                  decoding="async"
                />
                <span className="admin-list__name">{character.name}</span>
                <button
                  className="btn btn--danger"
                  onClick={() => deleteCharacter(character)}
                  disabled={busy}
                >
                  Borrar
                </button>
              </li>
            ))}
            {characters.length === 0 && <li className="muted">Sin personajes.</li>}
          </ul>
        </section>

        <section className="admin-card">
          <h2>Nuevo mapa</h2>
          <form onSubmit={uploadMap}>
            <div className="field">
              <label htmlFor="map-name">Nombre</label>
              <input
                id="map-name"
                ref={mapNameRef}
                className="input"
                placeholder="Nombre del mapa"
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label htmlFor="map-slug">Slug (opcional)</label>
              <input
                id="map-slug"
                ref={mapSlugRef}
                className="input"
                placeholder="se-deriva-del-nombre"
              />
            </div>
            <div className="field">
              <label htmlFor="map-file">Imagen (PNG/JPG)</label>
              <input
                id="map-file"
                ref={mapFileRef}
                className="input"
                type="file"
                accept="image/*"
              />
            </div>
            <button className="btn" type="submit" disabled={busy}>
              Subir mapa
            </button>
          </form>

          <h2 style={{ marginTop: "1.6rem" }}>Mapas ({maps.length})</h2>
          <ul className="admin-list">
            {maps.map((map) => (
              <li key={map.id} className="admin-list__item">
                <span className="admin-list__name">
                  {map.name}{" "}
                  <span className="muted">
                    ({map.width}×{map.height})
                  </span>
                </span>
                <button
                  className="btn btn--danger"
                  onClick={() => deleteMap(map)}
                  disabled={busy}
                >
                  Borrar
                </button>
              </li>
            ))}
            {maps.length === 0 && <li className="muted">Sin mapas.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { MapDTO, MapDetailDTO, Marker, MarkerIcon } from "@/lib/types";

interface Props {
  isAdmin: boolean;
}

export default function MapView({ isAdmin }: Props) {
  const [maps, setMaps] = useState<MapDTO[]>([]);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [detail, setDetail] = useState<MapDetailDTO | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  // Creación / edición de marcadores (solo admin)
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState<MarkerIcon>("city");
  const [newTooltip, setNewTooltip] = useState("");
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editIcon, setEditIcon] = useState<MarkerIcon>("city");
  const [editTooltip, setEditTooltip] = useState("");
  const [busy, setBusy] = useState(false);

  const isAdminRef = useRef(isAdmin);
  isAdminRef.current = isAdmin;

  const LRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const markersRef = useRef<globalThis.Map<string, any>>(new globalThis.Map());
  const linesRef = useRef<any[]>([]);

  const clearDataLayers = useCallback(() => {
    markersRef.current.forEach((layer) => layer.remove());
    markersRef.current.clear();
    linesRef.current.forEach((layer) => layer.remove());
    linesRef.current = [];
  }, []);

  const makeIcon = useCallback((icon: MarkerIcon) => {
    const L = LRef.current;
    if (icon === "point") {
      return L.divIcon({
        className: "city-marker",
        html:
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">' +
          '<circle cx="10" cy="10" r="6.5" fill="#e8b54a" stroke="#2a0730" stroke-width="2"/></svg>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        tooltipAnchor: [0, -10],
      });
    }
    return L.divIcon({
      className: "city-marker",
      html:
        '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="32" viewBox="0 0 34 32">' +
        '<path d="M2,29 L2,21 L4,21 L4,10 L6.5,10 L6.5,12 L8.5,12 L8.5,10 L11,10 L11,21 ' +
        "L13,21 L13,4 L16,4 L16,6 L18,6 L18,4 L21,4 L21,21 L23,21 L23,13 L25.5,13 " +
        "L25.5,15 L27.5,15 L27.5,13 L30,13 L30,21 L32,21 L32,29 Z\" " +
        'fill="#e8b54a" stroke="#2a0730" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M14.5,29 L14.5,25 Q17,21.5 19.5,25 L19.5,29 Z" fill="#2a0730"/>' +
        '<rect x="6.6" y="15" width="2.2" height="2.6" fill="#2a0730"/>' +
        '<rect x="15.9" y="10" width="2.2" height="2.6" fill="#2a0730"/>' +
        '<rect x="25.3" y="17" width="2.2" height="2.6" fill="#2a0730"/></svg>',
      iconSize: [34, 32],
      iconAnchor: [17, 29],
      tooltipAnchor: [0, -25],
    });
  }, []);

  // Inicializa Leaflet y carga la lista de mapas
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      LRef.current = L;

      const map = L.map("map", {
        crs: L.CRS.Simple,
        minZoom: -3,
        maxZoom: 1,
        zoomDelta: 0.5,
        zoomSnap: 0.5,
      });
      mapRef.current = map;

      map.on("contextmenu", (e: any) => {
        if (!isAdminRef.current) return;
        setPendingPoint({ x: e.latlng.lng, y: e.latlng.lat });
        setSelectedMarker(null);
        setNewLabel("");
        setNewIcon("city");
        setNewTooltip("");
      });

      try {
        const res = await fetch("/api/maps");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "No se pudieron cargar los mapas");
        const list: MapDTO[] = json.maps ?? [];
        if (cancelled) return;
        setMaps(list);
        setCurrentSlug((current) => current ?? list[0]?.slug ?? null);
        setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error");
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      LRef.current = null;
    };
  }, []);

  // Carga el detalle al cambiar de mapa
  useEffect(() => {
    if (!currentSlug) return;
    let cancelled = false;
    fetch(`/api/maps/${currentSlug}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "No se pudo cargar el mapa");
        return json.map as MapDetailDTO;
      })
      .then((map) => {
        if (!cancelled) setDetail(map);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error");
      });
    return () => {
      cancelled = true;
    };
  }, [currentSlug]);

  // Imagen base + límites (solo cuando cambia de mapa)
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !detail) return;

    if (overlayRef.current) map.removeLayer(overlayRef.current);
    const bounds: [[number, number], [number, number]] = [
      [0, 0],
      [detail.height, detail.width],
    ];
    overlayRef.current = L.imageOverlay(detail.image_url, bounds).addTo(map);
    map.setMaxBounds(bounds);
    map.fitBounds(bounds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.id]);

  // Marcadores y líneas (se reconstruyen al cambiar el detalle)
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !detail) return;

    clearDataLayers();

    detail.lines.forEach((line) => {
      const polyline = L.polyline(
        [
          [line.y1, line.x1],
          [line.y2, line.x2],
        ],
        {
          color: line.color || "#000000",
          weight: line.weight || 3,
          opacity: line.opacity ?? 1,
          dashArray: "5, 10",
        }
      ).addTo(map);
      linesRef.current.push(polyline);
    });

    detail.markers.forEach((marker) => {
      const layer = L.marker([marker.y, marker.x], {
        icon: makeIcon(marker.icon),
        draggable: isAdminRef.current,
      }).addTo(map);

      const tip = marker.tooltip || marker.label;
      if (tip) {
        layer.bindTooltip(tip, {
          permanent: false,
          direction: "top",
          className: "city-label",
        });
      }

      if (isAdminRef.current) {
        layer.on("click", () => {
          setPendingPoint(null);
          setSelectedMarker(marker);
          setEditLabel(marker.label);
          setEditIcon(marker.icon);
          setEditTooltip(marker.tooltip ?? "");
        });
        layer.on("dragend", async (e: any) => {
          const ll = e.target.getLatLng();
          const res = await fetch(`/api/admin/markers/${marker.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ x: ll.lng, y: ll.lat }),
          });
          if (res.ok) {
            const json = await res.json();
            setDetail((prev) =>
              prev
                ? {
                    ...prev,
                    markers: prev.markers.map((m) =>
                      m.id === marker.id ? json.marker : m
                    ),
                  }
                : prev
            );
          }
        });
      }

      markersRef.current.set(marker.id, layer);
    });
  }, [detail, clearDataLayers, makeIcon]);

  async function createMarker() {
    if (!detail || !pendingPoint) return;
    if (!newLabel.trim()) {
      setError("El marcador necesita un nombre");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/maps/${detail.id}/markers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          x: pendingPoint.x,
          y: pendingPoint.y,
          label: newLabel.trim(),
          icon: newIcon,
          tooltip: newTooltip.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo crear el marcador");
      setDetail((prev) =>
        prev ? { ...prev, markers: [...prev.markers, json.marker] } : prev
      );
      setPendingPoint(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function saveMarker() {
    if (!detail || !selectedMarker) return;
    if (!editLabel.trim()) {
      setError("El marcador necesita un nombre");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/markers/${selectedMarker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: editLabel.trim(),
          icon: editIcon,
          tooltip: editTooltip.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo guardar");
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              markers: prev.markers.map((m) =>
                m.id === selectedMarker.id ? json.marker : m
              ),
            }
          : prev
      );
      setSelectedMarker(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMarker() {
    if (!detail || !selectedMarker) return;
    if (!confirm(`¿Eliminar el marcador «${selectedMarker.label}»?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/markers/${selectedMarker.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "No se pudo eliminar");
      }
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              markers: prev.markers.filter((m) => m.id !== selectedMarker.id),
            }
          : prev
      );
      setSelectedMarker(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="map-page">
      <header className="map-page__header">
        <h1>Aeternium</h1>
        <p className="map-page__subtitle">Atlas de los reinos</p>

        {maps.length > 0 && (
          <div className="map-selector">
            {maps.map((m) => (
              <button
                key={m.id}
                className={m.slug === currentSlug ? "active" : ""}
                onClick={() => setCurrentSlug(m.slug)}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}

        {isAdmin && (
          <p className="map-page__hint">
            Haz clic derecho en el mapa para añadir un marcador. Arrastra un
            marcador para moverlo; pulsa sobre él para editarlo.
          </p>
        )}
      </header>

      {error && <p className="notice notice--error map-status">{error}</p>}

      {status === "loading" && <p className="map-status muted">Cargando mapas…</p>}

      {status === "ready" && maps.length === 0 && (
        <p className="map-status muted">
          Todavía no hay mapas. Añádelos desde el panel de administración.
        </p>
      )}

      <div className="map-frame" style={{ display: maps.length === 0 ? "none" : "block" }}>
        <div id="map" />

        {pendingPoint && (
          <div className="map-overlay">
            <h3>Nuevo marcador</h3>
            <p className="map-overlay__coords">
              x: {pendingPoint.x.toFixed(1)} · y: {pendingPoint.y.toFixed(1)}
            </p>
            <div className="field">
              <label htmlFor="new-label">Nombre</label>
              <input
                id="new-label"
                className="input"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="new-icon">Tipo</label>
              <select
                id="new-icon"
                className="select"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value as MarkerIcon)}
              >
                <option value="city">Ciudad</option>
                <option value="point">Punto</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="new-tooltip">Texto emergente (opcional)</label>
              <input
                id="new-tooltip"
                className="input"
                value={newTooltip}
                onChange={(e) => setNewTooltip(e.target.value)}
              />
            </div>
            <div className="map-overlay__actions">
              <button className="btn" onClick={createMarker} disabled={busy}>
                Crear
              </button>
              <button
                className="btn btn--ghost"
                onClick={() => setPendingPoint(null)}
                disabled={busy}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {selectedMarker && (
          <div className="map-overlay">
            <h3>Editar marcador</h3>
            <div className="field">
              <label htmlFor="edit-label">Nombre</label>
              <input
                id="edit-label"
                className="input"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="edit-icon">Tipo</label>
              <select
                id="edit-icon"
                className="select"
                value={editIcon}
                onChange={(e) => setEditIcon(e.target.value as MarkerIcon)}
              >
                <option value="city">Ciudad</option>
                <option value="point">Punto</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="edit-tooltip">Texto emergente (opcional)</label>
              <input
                id="edit-tooltip"
                className="input"
                value={editTooltip}
                onChange={(e) => setEditTooltip(e.target.value)}
              />
            </div>
            <div className="map-overlay__actions">
              <button className="btn" onClick={saveMarker} disabled={busy}>
                Guardar
              </button>
              <button
                className="btn btn--danger"
                onClick={deleteMarker}
                disabled={busy}
              >
                Eliminar
              </button>
              <button
                className="btn btn--ghost"
                onClick={() => setSelectedMarker(null)}
                disabled={busy}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

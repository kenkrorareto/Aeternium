export type MarkerIcon = "city" | "point";

export interface Character {
  id: string;
  name: string;
  image_path: string;
  created_at: string;
}

export interface MapRecord {
  id: string;
  slug: string;
  name: string;
  image_path: string;
  width: number;
  height: number;
  created_at: string;
}

export interface Marker {
  id: string;
  map_id: string;
  x: number;
  y: number;
  label: string;
  icon: MarkerIcon;
  tooltip: string | null;
  created_at: string;
}

export interface MapLine {
  id: string;
  map_id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  weight: number;
  opacity: number;
  created_at: string;
}

export interface CharacterDTO extends Character {
  image_url: string;
}

export interface MapDTO extends MapRecord {
  image_url: string;
}

export interface MapDetailDTO extends MapDTO {
  markers: Marker[];
  lines: MapLine[];
}

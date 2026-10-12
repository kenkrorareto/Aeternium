import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found">
      <p className="not-found__code">404</p>
      <h1>Este sendero no lleva a ninguna parte</h1>
      <p>
        La página que buscas no existe en el mundo de Aeternium.
      </p>
      <p>
        <Link className="btn" href="/mapa">
          Volver al mapa
        </Link>
      </p>
    </div>
  );
}
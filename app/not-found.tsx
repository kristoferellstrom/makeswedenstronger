import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container pageStack narrowStack">
      <section className="contentPanel">
        <p className="eyebrow">404</p>
        <h1>Avsnittet hittades inte</h1>
        <p className="introCopy">
          Sluggen finns inte i den aktuella RSS-feeden. Gå tillbaka till arkivet och välj ett annat avsnitt.
        </p>
        <Link href="/episodes" className="buttonPrimary">
          Till alla avsnitt
        </Link>
      </section>
    </div>
  );
}


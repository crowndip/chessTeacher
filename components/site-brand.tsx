import Link from "next/link";

export function SiteBrand() {
  return (
    <Link className="brand" href="/" aria-label="ChessTeacher home">
      <span className="brand-name">ChessTeacher</span>
    </Link>
  );
}

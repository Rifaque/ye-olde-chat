import Link from "next/link";
import { serializeJsonLd } from "@/lib/seo";

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

/** A quiet trail of ordinary links; the last crumb is the current page. */
export function Breadcrumbs({ crumbs }: { crumbs: { name: string; path: string }[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {crumbs.map((crumb, index) => (
          <li key={crumb.path}>
            {index === crumbs.length - 1 ? (
              <span aria-current="page">{crumb.name}</span>
            ) : (
              <Link href={crumb.path}>{crumb.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

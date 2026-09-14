import Link from "next/link";
import { Mark } from "@/components/mark";
import { toRoman } from "@/lib/roman";
import { siteName, tagline } from "@/lib/site";

/** On the home page the brand is the page heading; elsewhere it links home and the page brings its own h1. */
export function SiteHeader({ home = false }: { home?: boolean }) {
  const name = home ? <h1 className="brand-name">{siteName}</h1> : <p className="brand-name">{siteName}</p>;
  return (
    <header className="site-header">
      <div className="shell">
        {home ? (
          <div className="brand">
            <Mark className="brand-mark" />
            <div>
              {name}
              <p className="brand-tagline">{tagline}</p>
            </div>
          </div>
        ) : (
          <Link className="brand brand-link" href="/">
            <Mark className="brand-mark" />
            <div>
              {name}
              <p className="brand-tagline">{tagline}</p>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}

export function SiteFooter({ shortcuts = false }: { shortcuts?: boolean }) {
  // Pages are prerendered, so this is the year of the latest build.
  const year = toRoman(new Date().getFullYear());
  return (
    <footer className="site-footer">
      <div className="shell footer-row">
        <p>
          Kept in good order, anno {year} · by{" "}
          <a className="footer-credit" href="https://rifaque.hubzero.in">
            rifaque
          </a>
        </p>
        {shortcuts ? (
          <p className="footer-keys">
            Press <kbd>/</kbd> to search, <kbd>Esc</kbd> to clear
          </p>
        ) : null}
      </div>
    </footer>
  );
}

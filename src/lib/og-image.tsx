import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteName, tagline } from "@/lib/site";

export const ogSize = { width: 1200, height: 630 };

/** The shared Open Graph card: brand, one slang phrase and its translation. */
export async function renderOgImage({ slang, translation }: { slang: string; translation: string }) {
  const mark = await readFile(join(process.cwd(), "src/app/icon.svg"), "base64");
  // Long translations step down so they still fit the card.
  const fontSize = translation.length > 60 ? 60 : 76;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "72px 80px",
          color: "#efe6dc",
          background: "radial-gradient(900px 500px at 0% 0%, #3a1520, #120e0f 70%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 40 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
          <img src={`data:image/svg+xml;base64,${mark}`} width={68} height={68} alt="" />
          {siteName}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", color: "#e09aa3", fontSize: 34 }}>{slang}</div>
          <div style={{ display: "flex", fontSize, lineHeight: 1.1, maxWidth: 1040 }}>“{translation}”</div>
        </div>
        <div style={{ display: "flex", color: "#a99b93", fontSize: 30 }}>{tagline}</div>
      </div>
    ),
    ogSize,
  );
}

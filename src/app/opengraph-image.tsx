import { renderOgImage, ogSize } from "@/lib/og-image";
import { siteName, tagline } from "@/lib/site";

export const alt = `${siteName}: ${tagline}`;
export const size = ogSize;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({ slang: "skill issue", translation: "Thy shortcomings are entirely thine own." });
}

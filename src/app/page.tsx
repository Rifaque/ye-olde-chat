import { Phrasebook } from "@/components/phrasebook";
import { JsonLd } from "@/components/seo-parts";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { homeSeo, pageMetadata, websiteJsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

export const metadata = pageMetadata({
  title: homeSeo.title,
  socialTitle: homeSeo.socialTitle,
  description: homeSeo.description,
  path: "/",
  absoluteTitle: true,
});

export default function Home() {
  return (
    <>
      <JsonLd data={websiteJsonLd(siteUrl)} />
      <SiteHeader home />
      <main>
        <Phrasebook />
      </main>
      <SiteFooter shortcuts />
    </>
  );
}

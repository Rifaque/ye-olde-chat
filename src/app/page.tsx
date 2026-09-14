import { Phrasebook } from "@/components/phrasebook";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export default function Home() {
  return (
    <>
      <SiteHeader home />
      <main>
        <Phrasebook />
      </main>
      <SiteFooter shortcuts />
    </>
  );
}

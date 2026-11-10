import { notFound } from "next/navigation";
import { Section, SectionHeading } from "@/components/ui/primitives";
import { PackagesGrid } from "@/components/home/packages-grid";
import { getPackages } from "@/lib/database/public";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;
export const metadata = buildMetadata({ title: "Packages & pricing", description: "Our service packages and pricing.", path: "/pricing" });

export default async function PricingPage() {
  const packages = await getPackages();
  if (!packages.length) notFound();
  return (
    <Section>
      <SectionHeading as="h1" eyebrow="Packages" title="Packages & pricing" description="Choose the package that fits, or talk to us about a tailored engagement." />
      <PackagesGrid packages={packages as never} />
    </Section>
  );
}

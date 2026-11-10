import { PageHero, Section, EmptyState } from "@/components/ui/primitives";
import { ProductCard } from "@/components/cards";
import { getProducts } from "@/lib/database/public";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;
export const metadata = buildMetadata({ title: "Products", description: "Software and SaaS products from Quenvara Technology, with honest status labels.", path: "/products" });

export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <>
      <PageHero eyebrow="Products" title="Our products" description="Each product shows its real status — concept, in development, beta or available." />
      <Section>{products.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <EmptyState title="No products published yet" />}</Section>
    </>
  );
}

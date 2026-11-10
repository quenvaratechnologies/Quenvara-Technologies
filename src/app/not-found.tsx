import { ButtonLink } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="t-label text-brand">404</p>
      <h1 className="t-page mt-3">Page not found</h1>
      <p className="mt-3 text-muted">The page you are looking for does not exist or is no longer published.</p>
      <ButtonLink href="/" className="mt-8">Back to home</ButtonLink>
    </main>
  );
}

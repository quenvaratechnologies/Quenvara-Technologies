import { AdminSidebar, type AdminNavItem } from "@/components/admin/sidebar";
import { requireStaff } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { can, type Resource } from "@/lib/permissions";

const NAV: { href: string; label: string; resource: Resource }[] = [
  { href: "/admin/services", label: "Services", resource: "services" },
  { href: "/admin/industries", label: "Industries", resource: "industries" },
  { href: "/admin/projects", label: "Projects", resource: "projects" },
  { href: "/admin/products", label: "Products", resource: "products" },
  { href: "/admin/technologies", label: "Technologies", resource: "technologies" },
  { href: "/admin/posts", label: "Articles", resource: "posts" },
  { href: "/admin/categories", label: "Categories", resource: "categories" },
  { href: "/admin/tags", label: "Tags", resource: "tags" },
  { href: "/admin/pages", label: "Pages", resource: "pages" },
  { href: "/admin/navigation", label: "Navigation", resource: "navigation" },
  { href: "/admin/team", label: "Team", resource: "team" },
  { href: "/admin/packages", label: "Packages & pricing", resource: "packages" },
  { href: "/admin/testimonials", label: "Testimonials", resource: "testimonials" },
  { href: "/admin/faqs", label: "FAQs", resource: "faqs" },
  { href: "/admin/careers", label: "Careers", resource: "careers" },
  { href: "/admin/applications", label: "Applications", resource: "applications" },
  { href: "/admin/inquiries", label: "Inquiries", resource: "inquiries" },
  { href: "/admin/media", label: "Media", resource: "media" },
  { href: "/admin/seo", label: "SEO & redirects", resource: "seo" },
  { href: "/admin/settings", label: "Settings", resource: "settings" },
  { href: "/admin/users", label: "Users", resource: "users" },
  { href: "/admin/audit-logs", label: "Audit logs", resource: "audit_logs" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const items: AdminNavItem[] = [{ href: "/admin", label: "Dashboard" }, ...NAV.filter((n) => can(staff.role, n.resource, "read")), ...(can(staff.role, "settings", "read") ? [{ href: "/admin/settings#homepage_sections", label: "Homepage sections" }] : []), { href: "/admin/profile", label: "My profile" }];
  return (
    <div className="lg:pl-64">
      <AdminSidebar items={items} name={staff.fullName || staff.email} role={staff.role} logout={logoutAction} />
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}

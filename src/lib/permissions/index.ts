/**
 * Central permission matrix. This is the single source of truth for the app layer.
 * The same matrix is mirrored in SQL via public.has_permission() (see migrations),
 * so RLS and server actions agree. Roles are read from public.profiles (server-verified),
 * never from user-editable metadata, query params or form fields.
 */
export const ROLES = ["owner", "administrator", "editor", "sales", "recruiter"] as const;
export type Role = (typeof ROLES)[number];

export const RESOURCES = [
  "services", "industries", "projects", "products", "technologies",
  "posts", "categories", "tags", "pages", "navigation", "team",
  "testimonials", "faqs", "packages", "careers", "media", "seo", "settings",
  "inquiries", "applications", "users", "audit_logs",
] as const;
export type Resource = (typeof RESOURCES)[number];

export type Action = "read" | "create" | "update" | "publish" | "delete";

const CONTENT: Resource[] = [
  "services", "industries", "projects", "products", "technologies",
  "posts", "categories", "tags", "pages", "navigation", "team",
  "testimonials", "faqs", "packages", "media", "seo",
];

const ALL_ACTIONS: Action[] = ["read", "create", "update", "publish", "delete"];
const EDIT_ACTIONS: Action[] = ["read", "create", "update", "publish"];

type Matrix = Record<Role, Partial<Record<Resource, Action[]>>>;

function grant(resources: Resource[], actions: Action[]) {
  return Object.fromEntries(resources.map((r) => [r, actions])) as Partial<Record<Resource, Action[]>>;
}

export const PERMISSIONS: Matrix = {
  owner: grant([...RESOURCES], ALL_ACTIONS),
  administrator: {
    ...grant(CONTENT, ALL_ACTIONS),
    ...grant(["settings", "inquiries", "careers", "applications"], ALL_ACTIONS),
    users: ["read"],
    audit_logs: ["read"],
  },
  editor: {
    ...grant(CONTENT, EDIT_ACTIONS),
  },
  sales: {
    inquiries: ["read", "update"],
    team: ["read"],
    users: ["read"],
  },
  recruiter: {
    careers: ["read", "create", "update", "publish"],
    applications: ["read", "update", "delete"],
    users: ["read"],
  },
};

export function can(role: Role | null | undefined, resource: Resource, action: Action): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.[resource]?.includes(action) ?? false;
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Resources a role may at least read — drives admin navigation (UI only, not security). */
export function readableResources(role: Role): Resource[] {
  return RESOURCES.filter((r) => can(role, r, "read"));
}

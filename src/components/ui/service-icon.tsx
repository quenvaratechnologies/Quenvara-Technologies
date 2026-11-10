import { Brain, Building2, Cloud, Code2, Compass, Database, Globe, Layers, Shield, Smartphone, Sparkles, Workflow } from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  code: Code2, globe: Globe, smartphone: Smartphone, building: Building2, sparkles: Sparkles, brain: Brain,
  workflow: Workflow, shield: Shield, cloud: Cloud, database: Database, compass: Compass,
};
export function ServiceIcon({ name, className }: { name?: string | null; className?: string }) {
  const I = (name && ICONS[name]) || Layers;
  return <I className={className} aria-hidden />;
}

export type RelationDef = { key: string; label: string; junction: string; ownerCol: string; otherCol: string; otherTable: string; labelCol: string };

export const RELATIONS: Record<string, RelationDef[]> = {
  services: [
    { key: "industries", label: "Industries served", junction: "service_industries", ownerCol: "service_id", otherCol: "industry_id", otherTable: "industries", labelCol: "name" },
    { key: "technologies", label: "Relevant technologies", junction: "service_technologies", ownerCol: "service_id", otherCol: "technology_id", otherTable: "technologies", labelCol: "name" },
    { key: "faqs", label: "FAQs", junction: "service_faqs", ownerCol: "service_id", otherCol: "faq_id", otherTable: "faqs", labelCol: "question" },
  ],
  projects: [
    { key: "services", label: "Related services", junction: "project_services", ownerCol: "project_id", otherCol: "service_id", otherTable: "services", labelCol: "title" },
    { key: "technologies", label: "Technology stack", junction: "project_technologies", ownerCol: "project_id", otherCol: "technology_id", otherTable: "technologies", labelCol: "name" },
  ],
  products: [
    { key: "technologies", label: "Built with", junction: "product_technologies", ownerCol: "product_id", otherCol: "technology_id", otherTable: "technologies", labelCol: "name" },
  ],
  posts: [
    { key: "tags", label: "Tags", junction: "post_tags", ownerCol: "post_id", otherCol: "tag_id", otherTable: "tags", labelCol: "name" },
    { key: "services", label: "Related services", junction: "post_services", ownerCol: "post_id", otherCol: "service_id", otherTable: "services", labelCol: "title" },
  ],
};

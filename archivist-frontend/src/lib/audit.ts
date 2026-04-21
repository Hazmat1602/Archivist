import type { AuditFields } from "@/lib/api";

export function formatModifiedLabel(audit: AuditFields, users: Record<number, string>): string {
  if (audit.modified_by != null) {
    return users[audit.modified_by] || `User #${audit.modified_by}`;
  }

  if (audit.created_by != null) {
    const createdBy = users[audit.created_by] || `#${audit.created_by}`;
    return `Created by ${createdBy}`;
  }

  return "—";
}

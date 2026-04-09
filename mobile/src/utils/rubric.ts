export function statusColor(status: string): string {
  if (status === "met") return "#166534";
  if (status === "partially_met") return "#92400e";
  if (status === "omitted") return "#6b7280";
  return "#b91c1c";
}

export function statusLabel(status: string): string {
  if (status === "met") return "Met";
  if (status === "partially_met") return "Partially met";
  if (status === "omitted") return "Omitted";
  return "Missed";
}

export function groupBySection<T extends { section: string }>(
  criteria: T[]
): { section: string; data: T[] }[] {
  const sections: { section: string; data: T[] }[] = [];
  for (const criterion of criteria) {
    const last = sections[sections.length - 1];
    if (last && last.section === criterion.section) {
      last.data.push(criterion);
    } else {
      sections.push({ section: criterion.section, data: [criterion] });
    }
  }
  return sections;
}
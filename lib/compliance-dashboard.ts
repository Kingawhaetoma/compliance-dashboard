export const OPEN_CONTROL_STATUSES = new Set([
  "NOT_IMPLEMENTED",
  "PARTIALLY_IMPLEMENTED",
  "REVIEW_REQUIRED",
  "IN_PROGRESS",
]);

export const ANSWERED_CONTROL_STATUSES = new Set([
  "IMPLEMENTED",
  "PARTIALLY_IMPLEMENTED",
  "NOT_APPLICABLE",
  "REVIEW_REQUIRED",
  "IN_PROGRESS",
]);

const STATUS_BEST_ORDER = [
  "IMPLEMENTED",
  "PARTIALLY_IMPLEMENTED",
  "NOT_APPLICABLE",
  "REVIEW_REQUIRED",
  "IN_PROGRESS",
  "NOT_IMPLEMENTED",
];

const RISK_SEVERITY: Record<string, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

export function normalizeRisk(risk: string | null | undefined) {
  if (!risk) return null;
  const value = risk.toLowerCase();
  if (value.startsWith("crit")) return "Critical";
  if (value.startsWith("high")) return "High";
  if (value.startsWith("med")) return "Medium";
  if (value.startsWith("low")) return "Low";
  return risk;
}

export function statusRank(status: string) {
  const index = STATUS_BEST_ORDER.indexOf(status);
  return index === -1 ? STATUS_BEST_ORDER.length : index;
}

export function pickBestStatus(current: string | null, next: string) {
  if (!current) return next;
  return statusRank(next) < statusRank(current) ? next : current;
}

export function riskWeight(risk: string | null | undefined) {
  const normalized = normalizeRisk(risk);
  if (!normalized) return 0;
  return RISK_SEVERITY[normalized] ?? 0;
}

export function pickWorstRisk(
  current: string | null | undefined,
  next: string | null | undefined
) {
  if (!current) return normalizeRisk(next);
  if (!next) return normalizeRisk(current);
  const currentNorm = normalizeRisk(current);
  const nextNorm = normalizeRisk(next);
  if (!currentNorm) return nextNorm;
  if (!nextNorm) return currentNorm;
  return riskWeight(nextNorm) > riskWeight(currentNorm) ? nextNorm : currentNorm;
}

export function isOpenControlStatus(status: string) {
  return OPEN_CONTROL_STATUSES.has(status);
}

export function isAnsweredControlStatus(status: string) {
  return ANSWERED_CONTROL_STATUSES.has(status);
}

export function clampPercent(value: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function dueLabel(date: Date | null | undefined) {
  if (!date) return "No due date";
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  return `Due in ${diffDays}d`;
}

export function computeReadinessScore({
  completionPercent,
  evidenceCoveragePercent,
  highRiskOpen,
  totalControls,
}: {
  completionPercent: number;
  evidenceCoveragePercent: number;
  highRiskOpen: number;
  totalControls: number;
}) {
  const exposurePenalty =
    totalControls > 0 ? Math.min(35, (highRiskOpen / totalControls) * 120) : 0;
  return clampPercent(
    completionPercent * 0.55 + evidenceCoveragePercent * 0.45 - exposurePenalty
  );
}

export function sortByRiskThenDue<
  T extends { risk?: string | null; dueDate?: Date | null }
>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const riskDelta = riskWeight(b.risk ?? null) - riskWeight(a.risk ?? null);
    if (riskDelta !== 0) return riskDelta;

    const aDue = a.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
    const bDue = b.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
    return aDue - bDue;
  });
}

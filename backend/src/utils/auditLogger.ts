import { Logger } from "./logger";

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.refresh"
  | "auth.password_change"
  | "auth.password_reset"
  | "auth.email_verify"
  | "seller.apply"
  | "seller.approve"
  | "seller.reject"
  | "admin.access";

export const auditLog = (
  action: AuditAction,
  userId: string | undefined,
  details?: Record<string, unknown>,
): void => {
  Logger.warn("AUDIT", {
    action,
    userId: userId ?? "anonymous",
    details: details ?? {},
    timestamp: new Date().toISOString(),
  });
};

import { API_BASE_URL, ApiError, apiFetch } from "@/lib/api/client";
import type {
  AuditLogEntry,
  CatalogItem,
  CreateServiceRequestRequest,
  CreateTicketRequest,
  RequestAnalytics,
  RequestStatus,
  RequestType,
  RequestTypeCode,
  ServiceRequest,
  Ticket,
  UpdateServiceRequestRequest,
} from "@/lib/types/domain";

export const listCatalogItems = () => apiFetch<CatalogItem[]>("/api/catalog-items");

export const listRequestTypes = () => apiFetch<RequestType[]>("/api/request-types");

export const getTicket = (zendeskTicketId: string) =>
  apiFetch<Ticket>(`/api/tickets/${encodeURIComponent(zendeskTicketId)}`);
export const createTicket = (body: CreateTicketRequest) =>
  apiFetch<Ticket>("/api/tickets", { method: "POST", body: JSON.stringify(body) });
export const listRequestsForTicket = (zendeskTicketId: string) =>
  apiFetch<ServiceRequest[]>(`/api/tickets/${encodeURIComponent(zendeskTicketId)}/requests`);

export const getServiceRequest = (id: number) => apiFetch<ServiceRequest>(`/api/requests/${id}`);
export const createServiceRequest = (body: CreateServiceRequestRequest) =>
  apiFetch<ServiceRequest>("/api/requests", { method: "POST", body: JSON.stringify(body) });
export const updateServiceRequest = (id: number, body: UpdateServiceRequestRequest) =>
  apiFetch<ServiceRequest>(`/api/requests/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const submitServiceRequest = (id: number) =>
  apiFetch<ServiceRequest>(`/api/requests/${id}/submit`, { method: "POST" });
export const cancelServiceRequest = (id: number, reason?: string) =>
  apiFetch<ServiceRequest>(`/api/requests/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) });
export const holdServiceRequest = (id: number, reason?: string) =>
  apiFetch<ServiceRequest>(`/api/requests/${id}/hold`, { method: "POST", body: JSON.stringify({ reason }) });
export const resumeServiceRequest = (id: number) =>
  apiFetch<ServiceRequest>(`/api/requests/${id}/resume`, { method: "POST" });

export const getAuditLog = (id: number) => apiFetch<AuditLogEntry[]>(`/api/requests/${id}/audit-log`);

export function getRequestAnalytics(from?: string, to?: string) {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const qs = query.toString();
  return apiFetch<RequestAnalytics>(`/api/analytics/requests${qs ? `?${qs}` : ""}`);
}

export interface RequestSearchParams {
  status?: RequestStatus[];
  requestType?: RequestTypeCode[];
  from?: string;
  to?: string;
  ticketId?: string;
}

/** Shared backing search for the Warehouse/Manager/Technician/Overview dashboards — oldest
 * first, all params optional (`from`/`to` as ISO instant strings, e.g. `2026-08-01T00:00:00Z`;
 * `ticketId` is a case-insensitive substring match). */
export function searchServiceRequests(params: RequestSearchParams) {
  const query = new URLSearchParams();
  params.status?.forEach((s) => query.append("status", s));
  params.requestType?.forEach((t) => query.append("requestType", t));
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.ticketId) query.set("ticketId", params.ticketId);
  const qs = query.toString();
  return apiFetch<ServiceRequest[]>(`/api/requests${qs ? `?${qs}` : ""}`);
}

export const approveServiceRequest = (id: number) =>
  apiFetch<ServiceRequest>(`/api/requests/${id}/approve`, { method: "POST" });
export const approveBatch = (ids: number[]) =>
  apiFetch<ServiceRequest[]>("/api/approvals/approve-batch", { method: "POST", body: JSON.stringify({ ids }) });
export const rejectServiceRequest = (id: number, reason: string) =>
  apiFetch<ServiceRequest>(`/api/requests/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
export const reviseServiceRequest = (id: number) =>
  apiFetch<ServiceRequest>(`/api/requests/${id}/revise`, { method: "POST" });

export const resendConfirmation = (id: number) =>
  apiFetch<ServiceRequest>(`/api/requests/${id}/confirmation/resend`, { method: "POST" });

export const receiveServiceRequest = (id: number) =>
  apiFetch<ServiceRequest>(`/api/requests/${id}/receive`, { method: "POST" });
export const receiveBatch = (ids: number[]) =>
  apiFetch<ServiceRequest[]>("/api/warehouse/receive-batch", { method: "POST", body: JSON.stringify({ ids }) });

/** Downloads (CSV, PDF, …) aren't JSON, so they can't go through `apiFetch` — this hands back the
 * raw blob instead. Still needs `credentials: "include"` itself since it doesn't go through
 * `apiFetch`'s fetch call. */
async function fetchBlob(path: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: "include" });
  if (!response.ok) {
    throw new ApiError(response.status, `Export failed with ${response.status}`);
  }
  return response.blob();
}

export function exportWarehouseCsv(ids: number[]): Promise<Blob> {
  const query = ids.map((id) => `ids=${id}`).join("&");
  return fetchBlob(`/api/warehouse/export?${query}`);
}

export function exportRequestPdf(id: number): Promise<Blob> {
  return fetchBlob(`/api/requests/${id}/export-pdf`);
}

export type RequestTypeCode = "REPLACEMENT" | "PARTS";

export type RequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING_MANAGER_APPROVAL"
  | "REJECTED"
  | "PENDING_CUSTOMER_CONFIRMATION"
  | "CUSTOMER_CONFIRMED"
  | "READY_TO_SHIP"
  | "ON_HOLD"
  | "CANCELLED"
  | "WAREHOUSE_RECEIVED";

export type CatalogCategory = "INVERTER" | "BATTERY" | "ACCESSORY" | "PART";

export type RejectionSource = "MANAGER" | "CUSTOMER";

export interface CatalogItem {
  id: number;
  sku: string;
  name: string;
  category: CatalogCategory;
  active: boolean;
}

export interface RequestType {
  id: number;
  code: RequestTypeCode;
  name: string;
  requiresManagerApproval: boolean;
  requiresCustomerConfirmation: boolean;
}

export interface Ticket {
  id: number;
  zendeskTicketId: string;
  subject: string | null;
  requesterEmail: string | null;
  createdAt: string;
}

export interface CreateTicketRequest {
  zendeskTicketId: string;
  subject?: string;
  requesterEmail?: string;
}

export interface ShippingAddress {
  line1: string;
  line2?: string | null;
  city: string;
  postalCode: string;
  country: string;
  contactName: string;
  contactPhone: string;
  companyName?: string | null;
  vatNumber?: string | null;
}

export interface RequestItem {
  id: number;
  catalogItemId: number;
  sku: string;
  name: string;
  quantity: number;
  notes: string | null;
}

export interface RequestItemInput {
  catalogItemId: number;
  quantity: number;
  notes?: string;
}

export interface ServiceRequest {
  id: number;
  requestNumber: string;
  zendeskTicketId: string;
  requestType: RequestTypeCode;
  technicianId: number;
  technicianName: string;
  productId: number | null;
  productName: string | null;
  serialNumber: string | null;
  reason: string | null;
  status: RequestStatus;
  heldFromStatus: RequestStatus | null;
  rejectionSource: RejectionSource | null;
  items: RequestItem[];
  shippingAddress: ShippingAddress | null;
  confirmationToken: string | null;
  confirmationStatus: "PENDING" | "CONFIRMED" | "REJECTED" | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  completedAt: string | null;
}

export interface CreateServiceRequestRequest {
  zendeskTicketId: string;
  requestType: RequestTypeCode;
  productId?: number;
  serialNumber?: string;
  reason?: string;
  items?: RequestItemInput[];
  shippingAddress?: ShippingAddress;
}

export interface UpdateServiceRequestRequest {
  productId?: number;
  serialNumber?: string;
  reason?: string;
  items?: RequestItemInput[];
  shippingAddress?: ShippingAddress;
}

export interface AuditLogEntry {
  id: number;
  actorName: string;
  actorRole: string | null;
  actorType: string;
  action: string;
  previousStatus: RequestStatus | null;
  newStatus: RequestStatus | null;
  comment: string | null;
  createdAt: string;
}

export interface DailyRequestCount {
  date: string;
  count: number;
}

export interface TechnicianRequestCount {
  technicianName: string;
  count: number;
}

export interface RequestAnalytics {
  totalRequests: number;
  openRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  avgTurnaroundDays: number | null;
  byStatus: Partial<Record<RequestStatus, number>>;
  byType: Partial<Record<RequestTypeCode, number>>;
  volumeByDay: DailyRequestCount[];
  byTechnician: TechnicianRequestCount[];
}

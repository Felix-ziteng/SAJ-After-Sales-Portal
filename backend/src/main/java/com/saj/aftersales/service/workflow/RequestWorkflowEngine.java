package com.saj.aftersales.service.workflow;

import com.saj.aftersales.auth.AuthenticatedUser;
import com.saj.aftersales.entity.RejectionSource;
import com.saj.aftersales.entity.RequestStatus;
import com.saj.aftersales.entity.RequestType;
import com.saj.aftersales.entity.ServiceRequest;
import com.saj.aftersales.exception.ConflictException;
import com.saj.aftersales.service.AuditLogService;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Set;

/**
 * The only place {@link ServiceRequest#getStatus()} is ever set. Matches the v1 state machine in
 * the Phase 0 blueprint (Fig. 3): which statuses a Replacement request passes through versus a
 * Parts one is a byproduct of {@link RequestType#isRequiresManagerApproval()} /
 * {@link RequestType#isRequiresCustomerConfirmation()} — nothing here branches on the type code
 * itself, so a future request type is a new config row, not a new case in this class.
 *
 * <p>Doesn't know about {@code CustomerConfirmation} rows — {@code ServiceRequestService} creates
 * or reopens one right after a call here lands the request on {@code PENDING_CUSTOMER_CONFIRMATION},
 * keeping this class scoped to "what status is it in," not "who else needs to hear about it."
 */
@Component
public class RequestWorkflowEngine {

    private static final Set<RequestStatus> TERMINAL = Set.of(RequestStatus.CANCELLED, RequestStatus.WAREHOUSE_RECEIVED);

    private final AuditLogService auditLogService;

    public RequestWorkflowEngine(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    public void submit(ServiceRequest request, AuthenticatedUser actor, String ipAddress) {
        requireStatus(request, RequestStatus.DRAFT, "submitted");
        RequestStatus previous = request.getStatus();
        RequestStatus next = nextAfterGate(request.getRequestType(), request.getRequestType().isRequiresManagerApproval());
        request.setStatus(next);
        request.setSubmittedAt(Instant.now());
        auditLogService.record(request, actor, "SUBMITTED", previous, next, null, ipAddress);
    }

    private RequestStatus nextAfterGate(RequestType type, boolean stillNeedsApproval) {
        if (stillNeedsApproval) {
            return RequestStatus.PENDING_MANAGER_APPROVAL;
        }
        if (type.isRequiresCustomerConfirmation()) {
            return RequestStatus.PENDING_CUSTOMER_CONFIRMATION;
        }
        return RequestStatus.READY_TO_SHIP;
    }

    public void approve(ServiceRequest request, AuthenticatedUser actor, String ipAddress) {
        requireStatus(request, RequestStatus.PENDING_MANAGER_APPROVAL, "approved");
        RequestStatus previous = request.getStatus();
        RequestStatus next = nextAfterGate(request.getRequestType(), false);
        request.setStatus(next);
        auditLogService.record(request, actor, "APPROVED", previous, next, null, ipAddress);
    }

    public void reject(ServiceRequest request, AuthenticatedUser actor, String reason, String ipAddress) {
        requireStatus(request, RequestStatus.PENDING_MANAGER_APPROVAL, "rejected");
        RequestStatus previous = request.getStatus();
        request.setStatus(RequestStatus.REJECTED);
        request.setRejectionSource(RejectionSource.MANAGER);
        auditLogService.record(request, actor, "REJECTED", previous, RequestStatus.REJECTED, reason, ipAddress);
    }

    /** The customer confirming via {@code /confirm/{token}} — cascades straight to
     * READY_TO_SHIP; CUSTOMER_CONFIRMED has no separate actor/trigger of its own (Fig. 3), so it
     * isn't persisted as an intermediate state, just logged as part of this one transition. */
    public void customerConfirm(ServiceRequest request, String signatureName, String ipAddress) {
        requireStatus(request, RequestStatus.PENDING_CUSTOMER_CONFIRMATION, "confirmed");
        RequestStatus previous = request.getStatus();
        request.setStatus(RequestStatus.READY_TO_SHIP);
        auditLogService.recordCustomerAction(request, signatureName, "CONFIRMED", previous, RequestStatus.READY_TO_SHIP, null, ipAddress);
    }

    public void customerReject(ServiceRequest request, String reason, String ipAddress) {
        requireStatus(request, RequestStatus.PENDING_CUSTOMER_CONFIRMATION, "rejected");
        RequestStatus previous = request.getStatus();
        request.setStatus(RequestStatus.REJECTED);
        request.setRejectionSource(RejectionSource.CUSTOMER);
        auditLogService.recordCustomerAction(request, "Customer", "REJECTED", previous, RequestStatus.REJECTED, reason, ipAddress);
    }

    /** Technician (or Admin) acknowledging a rejection. Where it lands depends on who rejected
     * (D4): a Manager rejection needs a full rework, back to DRAFT; a Customer rejection usually
     * just needs a shipping/contact fix, so it goes straight back to
     * PENDING_CUSTOMER_CONFIRMATION — {@code ServiceRequestService} reopens the existing
     * confirmation record (same token) right after this call. */
    public void revise(ServiceRequest request, AuthenticatedUser actor, String ipAddress) {
        requireStatus(request, RequestStatus.REJECTED, "revised");
        RequestStatus target = request.getRejectionSource() == RejectionSource.CUSTOMER
                ? RequestStatus.PENDING_CUSTOMER_CONFIRMATION
                : RequestStatus.DRAFT;
        request.setStatus(target);
        request.setRejectionSource(null);
        auditLogService.record(request, actor, "REVISED", RequestStatus.REJECTED, target, null, ipAddress);
    }

    /** Warehouse marking a shipment as physically received/dispatched — the last step in v1
     * (no live picking/tracking, per the Phase 8 scope decision). One-click, no extra fields. */
    public void receive(ServiceRequest request, AuthenticatedUser actor, String ipAddress) {
        requireStatus(request, RequestStatus.READY_TO_SHIP, "received");
        RequestStatus previous = request.getStatus();
        request.setStatus(RequestStatus.WAREHOUSE_RECEIVED);
        request.setCompletedAt(Instant.now());
        auditLogService.record(request, actor, "WAREHOUSE_RECEIVED", previous, RequestStatus.WAREHOUSE_RECEIVED, null, ipAddress);
    }

    public void cancel(ServiceRequest request, AuthenticatedUser actor, String reason, String ipAddress) {
        requireNotTerminal(request, "cancelled");
        RequestStatus previous = request.getStatus();
        request.setStatus(RequestStatus.CANCELLED);
        request.setHeldFromStatus(null);
        auditLogService.record(request, actor, "CANCELLED", previous, RequestStatus.CANCELLED, reason, ipAddress);
    }

    public void hold(ServiceRequest request, AuthenticatedUser actor, String reason, String ipAddress) {
        requireNotTerminal(request, "held");
        if (request.getStatus() == RequestStatus.DRAFT || request.getStatus() == RequestStatus.ON_HOLD) {
            throw new ConflictException("Cannot hold a request in status " + request.getStatus());
        }
        RequestStatus previous = request.getStatus();
        request.setHeldFromStatus(previous);
        request.setStatus(RequestStatus.ON_HOLD);
        auditLogService.record(request, actor, "HELD", previous, RequestStatus.ON_HOLD, reason, ipAddress);
    }

    public void resume(ServiceRequest request, AuthenticatedUser actor, String ipAddress) {
        if (request.getStatus() != RequestStatus.ON_HOLD) {
            throw new ConflictException("Only an ON_HOLD request can be resumed");
        }
        RequestStatus target = request.getHeldFromStatus();
        request.setStatus(target);
        request.setHeldFromStatus(null);
        auditLogService.record(request, actor, "RESUMED", RequestStatus.ON_HOLD, target, null, ipAddress);
    }

    private void requireStatus(ServiceRequest request, RequestStatus required, String verb) {
        if (request.getStatus() != required) {
            throw new ConflictException("Only a " + required + " request can be " + verb + " (currently " + request.getStatus() + ")");
        }
    }

    private void requireNotTerminal(ServiceRequest request, String verb) {
        if (TERMINAL.contains(request.getStatus())) {
            throw new ConflictException("A " + request.getStatus() + " request cannot be " + verb);
        }
    }
}

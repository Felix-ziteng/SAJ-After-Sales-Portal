package com.saj.aftersales.service;

import com.saj.aftersales.auth.AuthenticatedUser;
import com.saj.aftersales.dto.CreateServiceRequestRequest;
import com.saj.aftersales.dto.RequestItemInput;
import com.saj.aftersales.dto.ServiceRequestDto;
import com.saj.aftersales.dto.UpdateServiceRequestRequest;
import com.saj.aftersales.entity.Approval;
import com.saj.aftersales.entity.ApprovalDecision;
import com.saj.aftersales.entity.CustomerConfirmation;
import com.saj.aftersales.entity.RequestItem;
import com.saj.aftersales.entity.RequestStatus;
import com.saj.aftersales.entity.RequestType;
import com.saj.aftersales.entity.RequestTypeCode;
import com.saj.aftersales.entity.ServiceRequest;
import com.saj.aftersales.entity.ShippingAddress;
import com.saj.aftersales.entity.UserEntity;
import com.saj.aftersales.entity.ZendeskTicket;
import com.saj.aftersales.exception.BadRequestException;
import com.saj.aftersales.exception.ConflictException;
import com.saj.aftersales.exception.NotFoundException;
import com.saj.aftersales.mapper.ServiceRequestMapper;
import com.saj.aftersales.repository.ApprovalRepository;
import com.saj.aftersales.repository.CustomerConfirmationRepository;
import com.saj.aftersales.repository.RequestItemRepository;
import com.saj.aftersales.repository.RequestTypeRepository;
import com.saj.aftersales.repository.ServiceRequestRepository;
import com.saj.aftersales.repository.ShippingAddressRepository;
import com.saj.aftersales.repository.UserRepository;
import com.saj.aftersales.repository.ZendeskTicketRepository;
import com.saj.aftersales.service.workflow.RequestWorkflowEngine;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class ServiceRequestService {

    /** D3: Technician/Admin can still edit after Manager Approval — DRAFT is the pre-submission
     * window, the rest is the post-approval window. PENDING_MANAGER_APPROVAL is deliberately
     * excluded (nothing to edit while a decision is in flight) and so is REJECTED (go through
     * {@code revise} first, which is what actually reopens editing). */
    private static final Set<RequestStatus> EDITABLE_STATUSES = Set.of(
            RequestStatus.DRAFT, RequestStatus.PENDING_CUSTOMER_CONFIRMATION,
            RequestStatus.CUSTOMER_CONFIRMED, RequestStatus.READY_TO_SHIP, RequestStatus.ON_HOLD);

    private final ServiceRequestRepository serviceRequestRepository;
    private final ZendeskTicketRepository ticketRepository;
    private final RequestTypeRepository requestTypeRepository;
    private final UserRepository userRepository;
    private final RequestItemRepository requestItemRepository;
    private final ShippingAddressRepository shippingAddressRepository;
    private final ShippingAddressService shippingAddressService;
    private final CustomerConfirmationRepository customerConfirmationRepository;
    private final CustomerConfirmationService customerConfirmationService;
    private final RequestNumberGenerator requestNumberGenerator;
    private final ServiceRequestMapper serviceRequestMapper;
    private final AuditLogService auditLogService;
    private final RequestWorkflowEngine workflowEngine;
    private final ApprovalRepository approvalRepository;

    public ServiceRequestService(ServiceRequestRepository serviceRequestRepository,
                                  ZendeskTicketRepository ticketRepository,
                                  RequestTypeRepository requestTypeRepository,
                                  UserRepository userRepository,
                                  RequestItemRepository requestItemRepository,
                                  ShippingAddressRepository shippingAddressRepository,
                                  ShippingAddressService shippingAddressService,
                                  CustomerConfirmationRepository customerConfirmationRepository,
                                  CustomerConfirmationService customerConfirmationService,
                                  RequestNumberGenerator requestNumberGenerator,
                                  ServiceRequestMapper serviceRequestMapper,
                                  AuditLogService auditLogService,
                                  RequestWorkflowEngine workflowEngine,
                                  ApprovalRepository approvalRepository) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.ticketRepository = ticketRepository;
        this.requestTypeRepository = requestTypeRepository;
        this.userRepository = userRepository;
        this.requestItemRepository = requestItemRepository;
        this.shippingAddressRepository = shippingAddressRepository;
        this.shippingAddressService = shippingAddressService;
        this.customerConfirmationRepository = customerConfirmationRepository;
        this.customerConfirmationService = customerConfirmationService;
        this.requestNumberGenerator = requestNumberGenerator;
        this.serviceRequestMapper = serviceRequestMapper;
        this.auditLogService = auditLogService;
        this.workflowEngine = workflowEngine;
        this.approvalRepository = approvalRepository;
    }

    public List<ServiceRequestDto> listByTicket(String zendeskTicketId) {
        return serviceRequestRepository.findByZendeskTicket_ZendeskTicketIdOrderByCreatedAtDesc(zendeskTicketId)
                .stream().map(this::toDto).toList();
    }

    /** Shared backing query for the Warehouse/Manager/Technician/Overview dashboards — each is
     * just this with a different default status selection applied client-side. Empty status/
     * request-type lists mean "no filter," not "match nothing," since an empty multi-select reads
     * as "show everything"; same for a blank ticket id. */
    public List<ServiceRequestDto> search(List<RequestStatus> statuses, List<RequestTypeCode> requestTypes,
                                           Instant from, Instant to, String ticketId) {
        List<RequestStatus> normalizedStatuses = (statuses == null || statuses.isEmpty()) ? null : statuses;
        List<RequestTypeCode> normalizedRequestTypes = (requestTypes == null || requestTypes.isEmpty()) ? null : requestTypes;
        String normalizedTicketId = (ticketId == null || ticketId.isBlank()) ? null : ticketId.trim();
        return serviceRequestRepository.search(normalizedStatuses, normalizedRequestTypes, from, to, normalizedTicketId)
                .stream().map(this::toDto).toList();
    }

    public ServiceRequestDto getById(Long id) {
        return toDto(findEntity(id));
    }

    private ServiceRequest findEntity(Long id) {
        return serviceRequestRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No request with id " + id));
    }

    private ServiceRequestDto toDto(ServiceRequest sr) {
        List<RequestItem> items = requestItemRepository.findByServiceRequest_Id(sr.getId());
        ShippingAddress address = shippingAddressRepository.findByServiceRequest_Id(sr.getId()).orElse(null);
        CustomerConfirmation confirmation = customerConfirmationRepository.findByServiceRequest_Id(sr.getId()).orElse(null);
        return serviceRequestMapper.toDto(sr, items, address, confirmation);
    }

    @Transactional
    public ServiceRequestDto create(CreateServiceRequestRequest request, AuthenticatedUser currentUser, String ipAddress) {
        ZendeskTicket ticket = ticketRepository.findByZendeskTicketId(request.zendeskTicketId())
                .orElseThrow(() -> new NotFoundException("No ticket reference for " + request.zendeskTicketId()));
        RequestType requestType = requestTypeRepository.findByCode(request.requestType())
                .orElseThrow(() -> new IllegalStateException("Request type not configured: " + request.requestType()));
        UserEntity technician = userRepository.findById(Long.valueOf(currentUser.id()))
                .orElseThrow(() -> new NotFoundException("No user with id " + currentUser.id()));

        validateModel(request.requestType(), request.model());

        ServiceRequest sr = new ServiceRequest();
        sr.setRequestNumber(requestNumberGenerator.next());
        sr.setZendeskTicket(ticket);
        sr.setRequestType(requestType);
        sr.setTechnician(technician);
        sr.setItemCode(request.itemCode());
        sr.setModel(request.model());
        sr.setSerialNumber(request.serialNumber());
        sr.setReason(request.reason());
        sr.setStatus(RequestStatus.DRAFT);
        sr = serviceRequestRepository.save(sr);

        saveItems(sr, request.items());
        shippingAddressService.upsert(sr, request.shippingAddress());

        auditLogService.record(sr, currentUser, "CREATED", null, RequestStatus.DRAFT, null, ipAddress);

        return toDto(sr);
    }

    @Transactional
    public ServiceRequestDto update(Long id, UpdateServiceRequestRequest request, AuthenticatedUser currentUser, String ipAddress) {
        ServiceRequest sr = findEntity(id);

        if (!EDITABLE_STATUSES.contains(sr.getStatus())) {
            throw new ConflictException("A request in status " + sr.getStatus() + " cannot be edited");
        }
        requireCreatorOrAdmin(sr, currentUser);

        if (request.model() != null) {
            validateModel(sr.getRequestType().getCode(), request.model());
            sr.setItemCode(request.itemCode());
            sr.setModel(request.model());
        }
        if (request.serialNumber() != null) {
            sr.setSerialNumber(request.serialNumber());
        }
        if (request.reason() != null) {
            sr.setReason(request.reason());
        }
        if (request.items() != null) {
            requestItemRepository.deleteByServiceRequest_Id(sr.getId());
            saveItems(sr, request.items());
        }
        if (request.shippingAddress() != null) {
            shippingAddressService.upsert(sr, request.shippingAddress());
        }

        auditLogService.record(sr, currentUser, "UPDATED", sr.getStatus(), sr.getStatus(), null, ipAddress);

        return toDto(sr);
    }

    @Transactional
    public ServiceRequestDto submit(Long id, AuthenticatedUser currentUser, String ipAddress) {
        ServiceRequest sr = findEntity(id);
        requireCreatorOrAdmin(sr, currentUser);
        requireCompleteAddressForPartsSubmit(sr);
        workflowEngine.submit(sr, currentUser, ipAddress);
        ensureConfirmationIfNeeded(sr);
        return toDto(sr);
    }

    /** A REPLACEMENT request that's submitted with no shipping address still gets one — the
     * customer fills it in at PENDING_CUSTOMER_CONFIRMATION. A PARTS request skips that step
     * entirely (no manager approval, no customer confirmation — see {@code RequestType} seed
     * data), so submit is the last moment a human can supply it before it becomes Warehouse's
     * problem with nowhere to ship to. */
    private void requireCompleteAddressForPartsSubmit(ServiceRequest sr) {
        if (sr.getRequestType().getCode() != RequestTypeCode.PARTS) {
            return;
        }
        ShippingAddress address = shippingAddressRepository.findByServiceRequest_Id(sr.getId()).orElse(null);
        if (address == null || isBlank(address.getLine1()) || isBlank(address.getCity())
                || isBlank(address.getPostalCode()) || isBlank(address.getCountry())
                || isBlank(address.getContactName()) || isBlank(address.getContactPhone())
                || isBlank(address.getVatNumber())) {
            throw new BadRequestException(
                    "A complete shipping address is required before submitting a Parts request — "
                            + "unlike a Replacement, there's no customer confirmation step to collect it later.");
        }
    }

    /** Lets a Technician/Admin hand a DRAFT Parts request's address-collection link to the
     * customer, mirroring the Replacement flow's auto-issued confirmation link — Parts has no
     * approval/confirmation gate of its own, so this is the only way to get that link out before
     * Submit (which already blocks without a complete address, see
     * {@link #requireCompleteAddressForPartsSubmit}). */
    @Transactional
    public ServiceRequestDto requestCustomerAddressLink(Long id, AuthenticatedUser currentUser) {
        ServiceRequest sr = findEntity(id);
        requireCreatorOrAdmin(sr, currentUser);
        if (sr.getRequestType().getCode() != RequestTypeCode.PARTS) {
            throw new BadRequestException("A customer address link can only be requested for a Parts request");
        }
        if (sr.getStatus() != RequestStatus.DRAFT) {
            throw new ConflictException("A customer address link can only be requested while still a Draft");
        }
        customerConfirmationService.ensure(sr);
        return toDto(sr);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    @Transactional
    public ServiceRequestDto cancel(Long id, String reason, AuthenticatedUser currentUser, String ipAddress) {
        ServiceRequest sr = findEntity(id);
        workflowEngine.cancel(sr, currentUser, reason, ipAddress);
        return toDto(sr);
    }

    @Transactional
    public ServiceRequestDto hold(Long id, String reason, AuthenticatedUser currentUser, String ipAddress) {
        ServiceRequest sr = findEntity(id);
        workflowEngine.hold(sr, currentUser, reason, ipAddress);
        return toDto(sr);
    }

    @Transactional
    public ServiceRequestDto resume(Long id, AuthenticatedUser currentUser, String ipAddress) {
        ServiceRequest sr = findEntity(id);
        workflowEngine.resume(sr, currentUser, ipAddress);
        return toDto(sr);
    }

    @Transactional
    public ServiceRequestDto approve(Long id, AuthenticatedUser currentUser, String ipAddress) {
        ServiceRequest sr = findEntity(id);
        recordApproval(sr, currentUser, ApprovalDecision.APPROVED, null);
        workflowEngine.approve(sr, currentUser, ipAddress);
        ensureConfirmationIfNeeded(sr);
        return toDto(sr);
    }

    /** All-or-nothing, matching {@code receiveBatch}: if any id isn't PENDING_MANAGER_APPROVAL the
     * whole call rolls back. Reject stays a per-request action (a batch reason wouldn't be
     * meaningful across unrelated requests) — see memory. */
    @Transactional
    public List<ServiceRequestDto> approveBatch(List<Long> ids, AuthenticatedUser currentUser, String ipAddress) {
        List<ServiceRequest> requests = ids.stream().map(this::findEntity).toList();
        requests.forEach(sr -> {
            recordApproval(sr, currentUser, ApprovalDecision.APPROVED, null);
            workflowEngine.approve(sr, currentUser, ipAddress);
            ensureConfirmationIfNeeded(sr);
        });
        return requests.stream().map(this::toDto).toList();
    }

    @Transactional
    public ServiceRequestDto reject(Long id, String reason, AuthenticatedUser currentUser, String ipAddress) {
        ServiceRequest sr = findEntity(id);
        recordApproval(sr, currentUser, ApprovalDecision.REJECTED, reason);
        workflowEngine.reject(sr, currentUser, reason, ipAddress);
        return toDto(sr);
    }

    @Transactional
    public ServiceRequestDto revise(Long id, AuthenticatedUser currentUser, String ipAddress) {
        ServiceRequest sr = findEntity(id);
        requireCreatorOrAdmin(sr, currentUser);
        workflowEngine.revise(sr, currentUser, ipAddress);
        if (sr.getStatus() == RequestStatus.PENDING_CUSTOMER_CONFIRMATION) {
            customerConfirmationService.reopen(sr);
        }
        return toDto(sr);
    }

    @Transactional
    public ServiceRequestDto receive(Long id, AuthenticatedUser currentUser, String ipAddress) {
        ServiceRequest sr = findEntity(id);
        workflowEngine.receive(sr, currentUser, ipAddress);
        return toDto(sr);
    }

    /** All-or-nothing: if any id in the batch isn't READY_TO_SHIP, the whole call rolls back
     * rather than silently skipping it — keeps the "what did this button just do" story simple. */
    @Transactional
    public List<ServiceRequestDto> receiveBatch(List<Long> ids, AuthenticatedUser currentUser, String ipAddress) {
        List<ServiceRequest> requests = ids.stream().map(this::findEntity).toList();
        requests.forEach(sr -> workflowEngine.receive(sr, currentUser, ipAddress));
        return requests.stream().map(this::toDto).toList();
    }

    @Transactional
    public ServiceRequestDto resendConfirmation(Long id, AuthenticatedUser currentUser) {
        ServiceRequest sr = findEntity(id);
        requireCreatorOrAdmin(sr, currentUser);
        customerConfirmationService.resend(sr);
        return toDto(sr);
    }

    private void ensureConfirmationIfNeeded(ServiceRequest sr) {
        if (sr.getStatus() == RequestStatus.PENDING_CUSTOMER_CONFIRMATION) {
            customerConfirmationService.ensure(sr);
        }
    }

    private void recordApproval(ServiceRequest sr, AuthenticatedUser currentUser, ApprovalDecision decision, String reason) {
        UserEntity manager = userRepository.getReferenceById(Long.valueOf(currentUser.id()));
        Approval approval = new Approval();
        approval.setServiceRequest(sr);
        approval.setManager(manager);
        approval.setDecision(decision);
        approval.setReason(reason);
        approvalRepository.save(approval);
    }

    private void requireCreatorOrAdmin(ServiceRequest sr, AuthenticatedUser currentUser) {
        boolean isAdmin = currentUser.roles().contains("ADMIN");
        boolean isCreator = sr.getTechnician().getId().equals(Long.valueOf(currentUser.id()));
        if (!isAdmin && !isCreator) {
            throw new AccessDeniedException("Only the creating Technician or an Admin can do this");
        }
    }

    private void validateModel(RequestTypeCode type, String model) {
        if (type == RequestTypeCode.REPLACEMENT && (model == null || model.isBlank())) {
            throw new BadRequestException("model is required for a Replacement request");
        }
    }

    private void saveItems(ServiceRequest sr, List<RequestItemInput> items) {
        if (items == null) {
            return;
        }
        for (RequestItemInput input : items) {
            RequestItem item = new RequestItem();
            item.setServiceRequest(sr);
            item.setItemCode(input.itemCode());
            item.setName(input.name());
            item.setQuantity(input.quantity());
            item.setNotes(input.notes());
            requestItemRepository.save(item);
        }
    }

}

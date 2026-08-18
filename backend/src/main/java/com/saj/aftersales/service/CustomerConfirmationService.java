package com.saj.aftersales.service;

import com.saj.aftersales.dto.ConfirmActionRequest;
import com.saj.aftersales.dto.CustomerConfirmationView;
import com.saj.aftersales.entity.ConfirmationStatus;
import com.saj.aftersales.entity.CustomerConfirmation;
import com.saj.aftersales.entity.RequestStatus;
import com.saj.aftersales.entity.ServiceRequest;
import com.saj.aftersales.entity.ShippingAddress;
import com.saj.aftersales.exception.ConflictException;
import com.saj.aftersales.exception.NotFoundException;
import com.saj.aftersales.mapper.CustomerConfirmationMapper;
import com.saj.aftersales.repository.CustomerConfirmationRepository;
import com.saj.aftersales.repository.ShippingAddressRepository;
import com.saj.aftersales.service.workflow.RequestWorkflowEngine;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Transactional(readOnly = true)
public class CustomerConfirmationService {

    private final CustomerConfirmationRepository customerConfirmationRepository;
    private final ShippingAddressRepository shippingAddressRepository;
    private final ShippingAddressService shippingAddressService;
    private final ConfirmationTokenGenerator tokenGenerator;
    private final CustomerConfirmationMapper mapper;
    private final RequestWorkflowEngine workflowEngine;

    public CustomerConfirmationService(CustomerConfirmationRepository customerConfirmationRepository,
                                        ShippingAddressRepository shippingAddressRepository,
                                        ShippingAddressService shippingAddressService,
                                        ConfirmationTokenGenerator tokenGenerator,
                                        CustomerConfirmationMapper mapper,
                                        RequestWorkflowEngine workflowEngine) {
        this.customerConfirmationRepository = customerConfirmationRepository;
        this.shippingAddressRepository = shippingAddressRepository;
        this.shippingAddressService = shippingAddressService;
        this.tokenGenerator = tokenGenerator;
        this.mapper = mapper;
        this.workflowEngine = workflowEngine;
    }

    /** Creates the confirmation record the first time a request lands on
     * PENDING_CUSTOMER_CONFIRMATION; a no-op if one already exists (e.g. a later re-approval of
     * the same request shouldn't hand out a second link). */
    @Transactional
    public void ensure(ServiceRequest request) {
        if (customerConfirmationRepository.findByServiceRequest_Id(request.getId()).isPresent()) {
            return;
        }
        CustomerConfirmation confirmation = new CustomerConfirmation();
        confirmation.setServiceRequest(request);
        confirmation.setToken(tokenGenerator.next());
        confirmation.setStatus(ConfirmationStatus.PENDING);
        confirmation.setSentToEmail(request.getZendeskTicket().getRequesterEmail());
        customerConfirmationRepository.save(confirmation);
    }

    /** Reopens the *same* link (D6/memory: same token stays valid) after a customer rejection
     * gets revised — clears whatever the customer previously submitted so the form starts clean. */
    @Transactional
    public void reopen(ServiceRequest request) {
        CustomerConfirmation confirmation = customerConfirmationRepository.findByServiceRequest_Id(request.getId())
                .orElseThrow(() -> new IllegalStateException("No confirmation record to reopen for request " + request.getId()));
        confirmation.setStatus(ConfirmationStatus.PENDING);
        confirmation.setSignatureName(null);
        confirmation.setRejectionReason(null);
        confirmation.setDecidedAt(null);
        customerConfirmationRepository.save(confirmation);
    }

    /** Staff-triggered: issues a brand-new token, invalidating the old link (D6: "revocable on
     * resend"). Only while still PENDING — nothing to resend once the customer has acted. */
    @Transactional
    public void resend(ServiceRequest request) {
        CustomerConfirmation confirmation = customerConfirmationRepository.findByServiceRequest_Id(request.getId())
                .orElseThrow(() -> new NotFoundException("No confirmation link exists yet for this request"));
        if (confirmation.getStatus() != ConfirmationStatus.PENDING) {
            throw new ConflictException("Only a PENDING confirmation can be resent");
        }
        confirmation.setToken(tokenGenerator.next());
        customerConfirmationRepository.save(confirmation);
    }

    public CustomerConfirmationView getPublicView(String token) {
        CustomerConfirmation confirmation = findByToken(token);
        ServiceRequest serviceRequest = confirmation.getServiceRequest();
        ShippingAddress address = shippingAddressRepository
                .findByServiceRequest_Id(serviceRequest.getId()).orElse(null);
        ShippingAddress previous = confirmation.getStatus() == ConfirmationStatus.PENDING
                ? findPreviousUnderSameTicket(serviceRequest)
                : null;
        return mapper.toView(confirmation, address, previous);
    }

    /** No shared customer master data (see memory) — the only reuse mechanism is "did the
     * customer already confirm a different request under this same ticket," offered as an
     * optional prefill on the form rather than anything persisted or cross-ticket. */
    private ShippingAddress findPreviousUnderSameTicket(ServiceRequest serviceRequest) {
        return shippingAddressRepository
                .findByServiceRequest_ZendeskTicket_IdOrderByServiceRequest_CreatedAtDesc(serviceRequest.getZendeskTicket().getId())
                .stream()
                .filter(a -> !a.getServiceRequest().getId().equals(serviceRequest.getId()))
                .filter(a -> a.getCompanyName() != null)
                .findFirst()
                .orElse(null);
    }

    @Transactional
    public CustomerConfirmationView confirm(String token, ConfirmActionRequest request, String ipAddress) {
        CustomerConfirmation confirmation = findByToken(token);
        requirePending(confirmation);

        ServiceRequest serviceRequest = confirmation.getServiceRequest();
        shippingAddressService.upsert(serviceRequest, request.shippingAddress());

        confirmation.setStatus(ConfirmationStatus.CONFIRMED);
        confirmation.setSignatureName(request.signatureName());
        confirmation.setDecidedAt(Instant.now());
        customerConfirmationRepository.save(confirmation);

        // A Parts request sitting in DRAFT has no PENDING_CUSTOMER_CONFIRMATION gate to clear —
        // this link is only collecting the address for the Technician to submit later, so there's
        // no status transition to make (see ServiceRequestService.requestCustomerAddressLink).
        if (serviceRequest.getStatus() == RequestStatus.PENDING_CUSTOMER_CONFIRMATION) {
            workflowEngine.customerConfirm(serviceRequest, request.signatureName(), ipAddress);
        }

        ShippingAddress address = shippingAddressRepository.findByServiceRequest_Id(serviceRequest.getId()).orElse(null);
        return mapper.toView(confirmation, address, null);
    }

    @Transactional
    public CustomerConfirmationView reject(String token, String reason, String ipAddress) {
        CustomerConfirmation confirmation = findByToken(token);
        requirePending(confirmation);

        ServiceRequest serviceRequest = confirmation.getServiceRequest();

        confirmation.setStatus(ConfirmationStatus.REJECTED);
        confirmation.setRejectionReason(reason);
        confirmation.setDecidedAt(Instant.now());
        customerConfirmationRepository.save(confirmation);

        if (serviceRequest.getStatus() == RequestStatus.PENDING_CUSTOMER_CONFIRMATION) {
            workflowEngine.customerReject(serviceRequest, reason, ipAddress);
        }

        ShippingAddress address = shippingAddressRepository.findByServiceRequest_Id(serviceRequest.getId()).orElse(null);
        return mapper.toView(confirmation, address, null);
    }

    private CustomerConfirmation findByToken(String token) {
        return customerConfirmationRepository.findByToken(token)
                .orElseThrow(() -> new NotFoundException("No confirmation found for this link"));
    }

    private void requirePending(CustomerConfirmation confirmation) {
        if (confirmation.getStatus() != ConfirmationStatus.PENDING) {
            throw new ConflictException("This link has already been used");
        }
    }
}

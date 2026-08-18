package com.saj.aftersales.controller;

import com.saj.aftersales.auth.CurrentUser;
import com.saj.aftersales.dto.ActionReasonRequest;
import com.saj.aftersales.dto.AuditLogDto;
import com.saj.aftersales.dto.CreateServiceRequestRequest;
import com.saj.aftersales.dto.RejectRequestBody;
import com.saj.aftersales.dto.ServiceRequestDto;
import com.saj.aftersales.dto.UpdateServiceRequestRequest;
import com.saj.aftersales.entity.RequestStatus;
import com.saj.aftersales.entity.RequestTypeCode;
import com.saj.aftersales.service.AuditLogService;
import com.saj.aftersales.service.RequestPdfExportService;
import com.saj.aftersales.service.ServiceRequestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class ServiceRequestController {

    private final ServiceRequestService serviceRequestService;
    private final AuditLogService auditLogService;
    private final RequestPdfExportService requestPdfExportService;

    public ServiceRequestController(ServiceRequestService serviceRequestService, AuditLogService auditLogService,
                                     RequestPdfExportService requestPdfExportService) {
        this.serviceRequestService = serviceRequestService;
        this.auditLogService = auditLogService;
        this.requestPdfExportService = requestPdfExportService;
    }

    /** Backs the Warehouse/Manager/Technician/Overview dashboards — all params optional,
     * oldest-first. Guest (VIEWER) is deliberately excluded: that role only looks up one ticket
     * at a time (GET /api/tickets/{id}/requests, unrestricted below), never browses/searches
     * everything. */
    @GetMapping
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'MANAGER', 'WAREHOUSE', 'ADMIN')")
    public List<ServiceRequestDto> list(@RequestParam(required = false) List<RequestStatus> status,
                                         @RequestParam(required = false) List<RequestTypeCode> requestType,
                                         @RequestParam(required = false) Instant from,
                                         @RequestParam(required = false) Instant to,
                                         @RequestParam(required = false) String ticketId) {
        return serviceRequestService.search(status, requestType, from, to, ticketId);
    }

    @GetMapping("/{id}")
    public ServiceRequestDto get(@PathVariable Long id) {
        return serviceRequestService.getById(id);
    }

    @GetMapping("/{id}/audit-log")
    public List<AuditLogDto> auditLog(@PathVariable Long id) {
        return auditLogService.listForRequest(id);
    }

    @GetMapping("/{id}/export-pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable Long id) {
        byte[] pdf = requestPdfExportService.buildPdf(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"request-" + id + ".pdf\"")
                .body(pdf);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<ServiceRequestDto> create(@Valid @RequestBody CreateServiceRequestRequest request,
                                                      Authentication authentication, HttpServletRequest httpRequest) {
        var dto = serviceRequestService.create(request, CurrentUser.from(authentication), httpRequest.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ServiceRequestDto update(@PathVariable Long id, @Valid @RequestBody UpdateServiceRequestRequest request,
                                     Authentication authentication, HttpServletRequest httpRequest) {
        return serviceRequestService.update(id, request, CurrentUser.from(authentication), httpRequest.getRemoteAddr());
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ServiceRequestDto submit(@PathVariable Long id, Authentication authentication, HttpServletRequest httpRequest) {
        return serviceRequestService.submit(id, CurrentUser.from(authentication), httpRequest.getRemoteAddr());
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'MANAGER', 'WAREHOUSE', 'ADMIN')")
    public ServiceRequestDto cancel(@PathVariable Long id, @RequestBody(required = false) ActionReasonRequest body,
                                     Authentication authentication, HttpServletRequest httpRequest) {
        String reason = body != null ? body.reason() : null;
        return serviceRequestService.cancel(id, reason, CurrentUser.from(authentication), httpRequest.getRemoteAddr());
    }

    @PostMapping("/{id}/hold")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'MANAGER', 'WAREHOUSE', 'ADMIN')")
    public ServiceRequestDto hold(@PathVariable Long id, @RequestBody(required = false) ActionReasonRequest body,
                                   Authentication authentication, HttpServletRequest httpRequest) {
        String reason = body != null ? body.reason() : null;
        return serviceRequestService.hold(id, reason, CurrentUser.from(authentication), httpRequest.getRemoteAddr());
    }

    @PostMapping("/{id}/resume")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'MANAGER', 'WAREHOUSE', 'ADMIN')")
    public ServiceRequestDto resume(@PathVariable Long id, Authentication authentication, HttpServletRequest httpRequest) {
        return serviceRequestService.resume(id, CurrentUser.from(authentication), httpRequest.getRemoteAddr());
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ServiceRequestDto approve(@PathVariable Long id, Authentication authentication, HttpServletRequest httpRequest) {
        return serviceRequestService.approve(id, CurrentUser.from(authentication), httpRequest.getRemoteAddr());
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ServiceRequestDto reject(@PathVariable Long id, @Valid @RequestBody RejectRequestBody body,
                                     Authentication authentication, HttpServletRequest httpRequest) {
        return serviceRequestService.reject(id, body.reason(), CurrentUser.from(authentication), httpRequest.getRemoteAddr());
    }

    @PostMapping("/{id}/revise")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ServiceRequestDto revise(@PathVariable Long id, Authentication authentication, HttpServletRequest httpRequest) {
        return serviceRequestService.revise(id, CurrentUser.from(authentication), httpRequest.getRemoteAddr());
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('WAREHOUSE', 'ADMIN')")
    public ServiceRequestDto receive(@PathVariable Long id, Authentication authentication, HttpServletRequest httpRequest) {
        return serviceRequestService.receive(id, CurrentUser.from(authentication), httpRequest.getRemoteAddr());
    }

    @PostMapping("/{id}/confirmation/resend")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ServiceRequestDto resendConfirmation(@PathVariable Long id, Authentication authentication) {
        return serviceRequestService.resendConfirmation(id, CurrentUser.from(authentication));
    }

    @PostMapping("/{id}/confirmation/request-address")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ServiceRequestDto requestCustomerAddressLink(@PathVariable Long id, Authentication authentication) {
        return serviceRequestService.requestCustomerAddressLink(id, CurrentUser.from(authentication));
    }
}

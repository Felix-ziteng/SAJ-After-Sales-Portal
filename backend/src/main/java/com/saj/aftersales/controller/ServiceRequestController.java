package com.saj.aftersales.controller;

import com.saj.aftersales.auth.CurrentUser;
import com.saj.aftersales.dto.CreateServiceRequestRequest;
import com.saj.aftersales.dto.ServiceRequestDto;
import com.saj.aftersales.dto.UpdateServiceRequestRequest;
import com.saj.aftersales.service.ServiceRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class ServiceRequestController {

    private final ServiceRequestService serviceRequestService;

    public ServiceRequestController(ServiceRequestService serviceRequestService) {
        this.serviceRequestService = serviceRequestService;
    }

    @GetMapping
    public List<ServiceRequestDto> list() {
        return serviceRequestService.listAll();
    }

    @GetMapping("/{id}")
    public ServiceRequestDto get(@PathVariable Long id) {
        return serviceRequestService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<ServiceRequestDto> create(@Valid @RequestBody CreateServiceRequestRequest request,
                                                      Authentication authentication) {
        var dto = serviceRequestService.create(request, CurrentUser.from(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ServiceRequestDto update(@PathVariable Long id, @Valid @RequestBody UpdateServiceRequestRequest request,
                                     Authentication authentication) {
        return serviceRequestService.update(id, request, CurrentUser.from(authentication));
    }
}

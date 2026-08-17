package com.saj.aftersales.controller;

import com.saj.aftersales.auth.CurrentUser;
import com.saj.aftersales.dto.BatchIdsRequest;
import com.saj.aftersales.dto.ServiceRequestDto;
import com.saj.aftersales.service.ServiceRequestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/approvals")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class ApprovalController {

    private final ServiceRequestService serviceRequestService;

    public ApprovalController(ServiceRequestService serviceRequestService) {
        this.serviceRequestService = serviceRequestService;
    }

    @PostMapping("/approve-batch")
    public List<ServiceRequestDto> approveBatch(@Valid @RequestBody BatchIdsRequest body,
                                                 Authentication authentication, HttpServletRequest httpRequest) {
        return serviceRequestService.approveBatch(body.ids(), CurrentUser.from(authentication), httpRequest.getRemoteAddr());
    }
}

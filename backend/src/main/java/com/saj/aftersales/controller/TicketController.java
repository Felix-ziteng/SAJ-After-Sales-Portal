package com.saj.aftersales.controller;

import com.saj.aftersales.dto.CreateTicketRequest;
import com.saj.aftersales.dto.ServiceRequestDto;
import com.saj.aftersales.dto.TicketDto;
import com.saj.aftersales.service.ServiceRequestService;
import com.saj.aftersales.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final ServiceRequestService serviceRequestService;

    public TicketController(TicketService ticketService, ServiceRequestService serviceRequestService) {
        this.ticketService = ticketService;
        this.serviceRequestService = serviceRequestService;
    }

    @GetMapping("/{ticketId}")
    public TicketDto get(@PathVariable String ticketId) {
        return ticketService.getByTicketId(ticketId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<TicketDto> create(@Valid @RequestBody CreateTicketRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.create(request));
    }

    @GetMapping("/{ticketId}/requests")
    public List<ServiceRequestDto> listRequests(@PathVariable String ticketId) {
        return serviceRequestService.listByTicket(ticketId);
    }
}

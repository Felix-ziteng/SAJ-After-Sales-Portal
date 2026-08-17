package com.saj.aftersales.controller;

import com.saj.aftersales.auth.CurrentUser;
import com.saj.aftersales.dto.BatchIdsRequest;
import com.saj.aftersales.dto.ServiceRequestDto;
import com.saj.aftersales.service.ServiceRequestService;
import com.saj.aftersales.service.WarehouseExportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/warehouse")
@PreAuthorize("hasAnyRole('WAREHOUSE', 'ADMIN')")
public class WarehouseController {

    private final ServiceRequestService serviceRequestService;
    private final WarehouseExportService warehouseExportService;

    public WarehouseController(ServiceRequestService serviceRequestService, WarehouseExportService warehouseExportService) {
        this.serviceRequestService = serviceRequestService;
        this.warehouseExportService = warehouseExportService;
    }

    @PostMapping("/receive-batch")
    public List<ServiceRequestDto> receiveBatch(@Valid @RequestBody BatchIdsRequest body,
                                                 Authentication authentication, HttpServletRequest httpRequest) {
        return serviceRequestService.receiveBatch(body.ids(), CurrentUser.from(authentication), httpRequest.getRemoteAddr());
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(@RequestParam List<Long> ids) {
        byte[] csv = warehouseExportService.buildCsv(ids).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"warehouse-export.csv\"")
                .body(csv);
    }
}

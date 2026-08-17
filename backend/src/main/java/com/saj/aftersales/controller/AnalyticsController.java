package com.saj.aftersales.controller;

import com.saj.aftersales.dto.RequestAnalyticsDto;
import com.saj.aftersales.service.RequestAnalyticsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {

    private final RequestAnalyticsService requestAnalyticsService;

    public AnalyticsController(RequestAnalyticsService requestAnalyticsService) {
        this.requestAnalyticsService = requestAnalyticsService;
    }

    @GetMapping("/requests")
    public RequestAnalyticsDto requests(@RequestParam(required = false) Instant from,
                                         @RequestParam(required = false) Instant to) {
        return requestAnalyticsService.summarize(from, to);
    }
}

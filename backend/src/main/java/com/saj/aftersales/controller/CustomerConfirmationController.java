package com.saj.aftersales.controller;

import com.saj.aftersales.dto.ConfirmActionRequest;
import com.saj.aftersales.dto.CustomerConfirmationView;
import com.saj.aftersales.dto.RejectRequestBody;
import com.saj.aftersales.service.CustomerConfirmationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public — no staff login, no {@code X-Mock-User}. The token in the URL is the entire identity
 * proxy (D6/memory: guest mode, no customer account, no OTP for v1). Permitted in SecurityConfig.
 */
@RestController
@RequestMapping("/api/confirm")
public class CustomerConfirmationController {

    private final CustomerConfirmationService customerConfirmationService;

    public CustomerConfirmationController(CustomerConfirmationService customerConfirmationService) {
        this.customerConfirmationService = customerConfirmationService;
    }

    @GetMapping("/{token}")
    public CustomerConfirmationView get(@PathVariable String token) {
        return customerConfirmationService.getPublicView(token);
    }

    @PostMapping("/{token}/confirm")
    public CustomerConfirmationView confirm(@PathVariable String token, @Valid @RequestBody ConfirmActionRequest request,
                                             HttpServletRequest httpRequest) {
        return customerConfirmationService.confirm(token, request, httpRequest.getRemoteAddr());
    }

    @PostMapping("/{token}/reject")
    public CustomerConfirmationView reject(@PathVariable String token, @Valid @RequestBody RejectRequestBody body,
                                            HttpServletRequest httpRequest) {
        return customerConfirmationService.reject(token, body.reason(), httpRequest.getRemoteAddr());
    }
}

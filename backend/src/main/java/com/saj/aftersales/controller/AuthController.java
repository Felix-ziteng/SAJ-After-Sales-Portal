package com.saj.aftersales.controller;

import com.saj.aftersales.auth.AuthenticatedUser;
import com.saj.aftersales.auth.CurrentUser;
import com.saj.aftersales.auth.PasswordAuthProvider;
import com.saj.aftersales.dto.ChangePasswordRequest;
import com.saj.aftersales.dto.LoginRequest;
import com.saj.aftersales.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final boolean cookieSecure;

    public AuthController(AuthService authService,
                           @Value("${app.auth.cookie-secure:false}") boolean cookieSecure) {
        this.authService = authService;
        this.cookieSecure = cookieSecure;
    }

    @GetMapping("/me")
    public ResponseEntity<AuthenticatedUser> me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(user);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticatedUser> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.email(), request.password())
                .map(result -> ResponseEntity.ok()
                        .header(HttpHeaders.SET_COOKIE, sessionCookie(result.token(), AuthService.SESSION_TTL).toString())
                        .body(result.user()))
                .orElseGet(() -> ResponseEntity.status(401).build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = PasswordAuthProvider.COOKIE_NAME, required = false) String token) {
        authService.logout(token);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, sessionCookie("", Duration.ZERO).toString())
                .build();
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                                Authentication authentication) {
        authService.changeOwnPassword(CurrentUser.id(authentication), request.currentPassword(), request.newPassword());
        return ResponseEntity.noContent().build();
    }

    private ResponseCookie sessionCookie(String value, Duration maxAge) {
        return ResponseCookie.from(PasswordAuthProvider.COOKIE_NAME, value)
                .httpOnly(true)
                .secure(cookieSecure) // set COOKIE_SECURE=true once the app is served over HTTPS
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build();
    }
}

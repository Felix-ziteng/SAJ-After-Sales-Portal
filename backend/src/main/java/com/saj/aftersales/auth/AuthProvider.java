package com.saj.aftersales.auth;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Optional;

/**
 * Resolves the caller's identity from an inbound request. {@link MockAuthProvider} is the
 * only implementation today; a future {@code EntraIdAuthProvider} plugs in behind this same
 * interface, selected by the {@code app.auth.provider} property, with no change to
 * {@link com.saj.aftersales.config.SecurityConfig} or any controller.
 */
public interface AuthProvider {

    Optional<AuthenticatedUser> authenticate(HttpServletRequest request);
}

package com.saj.aftersales.auth;

import org.springframework.security.core.Authentication;

/** Pulls the {@link AuthenticatedUser} principal out of an {@link Authentication} — every
 * controller that needs "who's calling" (not just "are they allowed") goes through this instead
 * of casting {@code authentication.getPrincipal()} itself. */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static AuthenticatedUser from(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new IllegalStateException("No authenticated user on this request");
        }
        return user;
    }

    public static Long id(Authentication authentication) {
        return Long.valueOf(from(authentication).id());
    }
}

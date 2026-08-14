package com.saj.aftersales.auth;

import java.util.Set;

/**
 * The identity resolved by whichever {@link AuthProvider} is active — the same shape
 * regardless of whether it came from the mock header or, later, Microsoft Entra ID.
 */
public record AuthenticatedUser(
        String id,
        String email,
        String displayName,
        String department,
        Set<String> roles
) {
}

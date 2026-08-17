package com.saj.aftersales.dto;

import com.saj.aftersales.entity.Role;
import com.saj.aftersales.entity.UserStatus;
import jakarta.validation.constraints.Size;

import java.util.Set;

/**
 * Partial update — every field is optional; only non-null ones are applied. {@code roles}, if
 * present, replaces the full set (and must not be empty: a user always has at least one role).
 * {@code newPassword}, if present, is an Admin-issued reset — the "forgot password, contact your
 * Admin" flow (D: no self-service reset — see memory) — and doesn't require the old one; it also
 * clears any login lockout, same as an explicit {@code unlock}. {@code unlock}, if {@code true},
 * clears a login lockout (see {@code AuthService.MAX_FAILED_ATTEMPTS}) without touching the
 * password.
 */
public record UpdateUserRequest(
        String displayName,
        String department,
        UserStatus status,
        Set<Role> roles,
        @Size(min = 8) String newPassword,
        Boolean unlock
) {
}

package com.saj.aftersales.dto;

import com.saj.aftersales.entity.Role;
import com.saj.aftersales.entity.UserStatus;

import java.util.Set;

/**
 * Partial update — every field is optional; only non-null ones are applied. {@code roles}, if
 * present, replaces the full set (and must not be empty: a user always has at least one role).
 */
public record UpdateUserRequest(
        String displayName,
        String department,
        UserStatus status,
        Set<Role> roles
) {
}

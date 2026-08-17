package com.saj.aftersales.dto;

import com.saj.aftersales.entity.Role;
import com.saj.aftersales.entity.UserStatus;

import java.time.Instant;
import java.util.Set;

public record UserDto(
        Long id,
        String email,
        String displayName,
        String department,
        UserStatus status,
        Set<Role> roles,
        Instant createdAt,
        boolean locked
) {
}

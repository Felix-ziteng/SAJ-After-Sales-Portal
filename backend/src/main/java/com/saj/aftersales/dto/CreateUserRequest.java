package com.saj.aftersales.dto;

import com.saj.aftersales.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.Set;

public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank String displayName,
        String department,
        @NotEmpty Set<Role> roles
) {
}

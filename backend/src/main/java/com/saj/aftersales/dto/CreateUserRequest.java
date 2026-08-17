package com.saj.aftersales.dto;

import com.saj.aftersales.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.Set;

/** Accounts are Admin-issued only — no self-registration — so {@code password} is the initial
 * password the Admin is handing the new user, not something they chose themselves. */
public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank String displayName,
        String department,
        @NotEmpty Set<Role> roles,
        @NotBlank @Size(min = 8) String password
) {
}

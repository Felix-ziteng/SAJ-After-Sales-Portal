package com.saj.aftersales.dto;

import jakarta.validation.constraints.NotBlank;

/** No {@code @Email} constraint — {@code email} is really just "login identifier": whatever an
 * Admin set the account's login name to (usually an email, but not required to be one), or —
 * per {@code AuthService.resolveLoginUser} — the account's display name, if that's unambiguous. */
public record LoginRequest(@NotBlank String email, @NotBlank String password) {
}

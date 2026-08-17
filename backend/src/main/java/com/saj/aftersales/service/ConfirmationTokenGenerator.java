package com.saj.aftersales.service;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Base64;

/** Plaintext, long-lived tokens (D6/memory) — not hashed, since they're a low-blast-radius
 * per-request capability, not a password. 256 bits of entropy makes guessing infeasible. */
@Component
public class ConfirmationTokenGenerator {

    private final SecureRandom random = new SecureRandom();

    public String next() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}

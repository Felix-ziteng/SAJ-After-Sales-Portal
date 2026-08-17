package com.saj.aftersales.auth;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Base64;

/** Opaque session tokens — 256 bits of entropy, same construction as the customer-confirmation
 * tokens, kept as its own small class since this one lives in a different domain (login
 * sessions, not per-request confirmation links). */
@Component
public class SessionTokenGenerator {

    private final SecureRandom random = new SecureRandom();

    public String next() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}

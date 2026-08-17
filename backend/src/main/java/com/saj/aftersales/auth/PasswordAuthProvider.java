package com.saj.aftersales.auth;

import com.saj.aftersales.entity.UserStatus;
import com.saj.aftersales.repository.UserSessionRepository;
import com.saj.aftersales.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;

/**
 * Real local username/password login, replacing the mock header (see memory: no self-registration
 * — Admin issues every account — and no self-service password reset, only an Admin-driven one).
 * The browser carries an HttpOnly session cookie ({@value #COOKIE_NAME}); this resolves it
 * against {@code user_sessions} on every request.
 */
@Component
@ConditionalOnProperty(name = "app.auth.provider", havingValue = "password", matchIfMissing = true)
public class PasswordAuthProvider implements AuthProvider {

    public static final String COOKIE_NAME = "session_token";

    private final UserSessionRepository userSessionRepository;

    public PasswordAuthProvider(UserSessionRepository userSessionRepository) {
        this.userSessionRepository = userSessionRepository;
    }

    @Override
    public Optional<AuthenticatedUser> authenticate(HttpServletRequest request) {
        String token = readCookie(request);
        if (token == null) {
            return Optional.empty();
        }
        return userSessionRepository.findByTokenWithUser(token)
                .filter(session -> session.getExpiresAt().isAfter(Instant.now()))
                .filter(session -> session.getUser().getStatus() == UserStatus.ACTIVE)
                .map(session -> AuthService.toAuthenticatedUser(session.getUser()));
    }

    private String readCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}

package com.saj.aftersales.auth;

import com.saj.aftersales.dto.UserDto;
import com.saj.aftersales.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Dev-only stand-in for real SSO. The frontend picks a demo user and sends their email back on
 * every request as {@value #HEADER}; this resolves it against the real {@code users} table
 * (seeded by {@code V2__seed_demo_users.sql}) rather than a hardcoded list, so role assignment
 * always reflects what Admin has configured. Replace with an {@code EntraIdAuthProvider} that
 * validates a real bearer token instead — {@link UserService} lookup stays the same either way.
 */
@Component
@ConditionalOnProperty(name = "app.auth.provider", havingValue = "mock", matchIfMissing = true)
public class MockAuthProvider implements AuthProvider {

    static final String HEADER = "X-Mock-User";

    private final UserService userService;

    public MockAuthProvider(UserService userService) {
        this.userService = userService;
    }

    @Override
    public Optional<AuthenticatedUser> authenticate(HttpServletRequest request) {
        String email = request.getHeader(HEADER);
        if (email == null) {
            return Optional.empty();
        }
        return userService.findActiveByEmail(email).map(MockAuthProvider::toAuthenticatedUser);
    }

    public static AuthenticatedUser toAuthenticatedUser(UserDto user) {
        return new AuthenticatedUser(
                String.valueOf(user.id()),
                user.email(),
                user.displayName(),
                user.department(),
                user.roles().stream().map(Enum::name).collect(Collectors.toSet()));
    }
}

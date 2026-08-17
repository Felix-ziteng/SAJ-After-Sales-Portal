package com.saj.aftersales.service;

import com.saj.aftersales.auth.AuthenticatedUser;
import com.saj.aftersales.auth.SessionTokenGenerator;
import com.saj.aftersales.entity.UserEntity;
import com.saj.aftersales.entity.UserSession;
import com.saj.aftersales.entity.UserStatus;
import com.saj.aftersales.exception.BadRequestException;
import com.saj.aftersales.exception.NotFoundException;
import com.saj.aftersales.repository.UserRepository;
import com.saj.aftersales.repository.UserSessionRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/** Login/logout/password-change — the one place that touches {@link UserSession} rows or
 * verifies a password hash. */
@Service
@Transactional(readOnly = true)
public class AuthService {

    public static final Duration SESSION_TTL = Duration.ofDays(30);

    /** Consecutive wrong-password attempts before an account locks — see
     * {@code UserEntity.failedLoginAttempts}. */
    public static final int MAX_FAILED_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final SessionTokenGenerator tokenGenerator;

    public AuthService(UserRepository userRepository, UserSessionRepository userSessionRepository,
                        PasswordEncoder passwordEncoder, SessionTokenGenerator tokenGenerator) {
        this.userRepository = userRepository;
        this.userSessionRepository = userSessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenGenerator = tokenGenerator;
    }

    /** Empty on any failure — wrong password, unknown identifier, inactive account, a locked
     * account, and an account with no password set yet all look identical from the outside, so a
     * failed attempt can't be used to enumerate which accounts exist or which are locked. */
    @Transactional
    public Optional<LoginResult> login(String identifier, String rawPassword) {
        UserEntity user = resolveLoginUser(identifier);
        if (user == null || user.getStatus() != UserStatus.ACTIVE || user.getPasswordHash() == null
                || user.getLockedAt() != null) {
            return Optional.empty();
        }
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            registerFailedAttempt(user);
            return Optional.empty();
        }

        user.setFailedLoginAttempts(0);

        UserSession session = new UserSession();
        session.setToken(tokenGenerator.next());
        session.setUser(user);
        session.setExpiresAt(Instant.now().plus(SESSION_TTL));
        userSessionRepository.save(session);

        return Optional.of(new LoginResult(session.getToken(), toAuthenticatedUser(user)));
    }

    private void registerFailedAttempt(UserEntity user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setLockedAt(Instant.now());
        }
    }

    /** Login name first (unique, so always wins if it matches); only if that finds nobody does
     * a typed display name count, and only when it's unambiguous — two people sharing a display
     * name means neither can log in by name, only by their actual login name. */
    private UserEntity resolveLoginUser(String identifier) {
        UserEntity byEmail = userRepository.findByEmailIgnoreCaseWithRoles(identifier).orElse(null);
        if (byEmail != null) {
            return byEmail;
        }
        List<UserEntity> byName = userRepository.findByDisplayNameIgnoreCaseWithRoles(identifier);
        return byName.size() == 1 ? byName.get(0) : null;
    }

    @Transactional
    public void logout(String token) {
        if (token != null) {
            userSessionRepository.deleteByToken(token);
        }
    }

    @Transactional
    public void changeOwnPassword(Long userId, String currentPassword, String newPassword) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("No user with id " + userId));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
    }

    public static AuthenticatedUser toAuthenticatedUser(UserEntity user) {
        return new AuthenticatedUser(
                String.valueOf(user.getId()),
                user.getEmail(),
                user.getDisplayName(),
                user.getDepartment(),
                user.getRoles().stream().map(role -> role.getCode().name()).collect(Collectors.toSet()));
    }

    public record LoginResult(String token, AuthenticatedUser user) {
    }
}

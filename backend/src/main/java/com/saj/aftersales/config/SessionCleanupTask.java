package com.saj.aftersales.config;

import com.saj.aftersales.repository.UserSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/** Expired sessions stop being honored by {@code PasswordAuthProvider} immediately, but the row
 * itself only goes away here — without this, {@code user_sessions} would grow forever since
 * logout is the only other thing that deletes a row. */
@Component
public class SessionCleanupTask {

    private static final Logger log = LoggerFactory.getLogger(SessionCleanupTask.class);

    private final UserSessionRepository userSessionRepository;

    public SessionCleanupTask(UserSessionRepository userSessionRepository) {
        this.userSessionRepository = userSessionRepository;
    }

    @Scheduled(initialDelay = 0, fixedRate = 60 * 60 * 1000)
    @Transactional
    public void purgeExpiredSessions() {
        long deleted = userSessionRepository.deleteByExpiresAtBefore(Instant.now());
        if (deleted > 0) {
            log.info("Purged {} expired session(s)", deleted);
        }
    }
}

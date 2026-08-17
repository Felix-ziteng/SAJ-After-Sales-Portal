package com.saj.aftersales.repository;

import com.saj.aftersales.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    /**
     * Fetch-joins the user and roles so the result is safe to read outside a transaction —
     * needed by {@code PasswordAuthProvider}, which runs in a security filter, not a
     * {@code @Transactional} service method (same reasoning as the old MockAuthProvider's
     * {@code findByEmailIgnoreCaseWithRoles}).
     */
    @Query("select s from UserSession s join fetch s.user u left join fetch u.roles where s.token = :token")
    Optional<UserSession> findByTokenWithUser(@Param("token") String token);

    void deleteByToken(String token);

    /** Used by {@code SessionCleanupTask} to purge rows past their TTL — expiry alone doesn't
     * remove a session row, {@code PasswordAuthProvider} just stops honoring it. */
    long deleteByExpiresAtBefore(Instant cutoff);
}

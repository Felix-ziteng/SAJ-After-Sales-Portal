package com.saj.aftersales.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String displayName;

    private String department;

    /** Reserved for a future real-SSO (Microsoft Entra ID) provider; unused by password auth. */
    private String ssoSubjectId;

    /** BCrypt hash. Null until an Admin issues the account a password (D: no self-registration —
     * see memory) — such an account simply can't log in yet. */
    private String passwordHash;

    /** Consecutive wrong-password attempts since the last success; reset to 0 on a successful
     * login or an Admin-issued password reset/unlock. See {@code AuthService.MAX_FAILED_ATTEMPTS}. */
    @Column(nullable = false)
    private int failedLoginAttempts = 0;

    /** Non-null once {@code failedLoginAttempts} hits the limit — locks the account out of login
     * regardless of password correctness until an Admin clears it (no self-service unlock). */
    private Instant lockedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private UserStatus status = UserStatus.ACTIVE;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<RoleEntity> roles = new HashSet<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}

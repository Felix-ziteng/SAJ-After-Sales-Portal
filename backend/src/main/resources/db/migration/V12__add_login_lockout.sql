-- Login brute-force lockout: 5 consecutive failed passwords locks the account until an Admin
-- unlocks it (no self-service, matching the rest of this app's password-recovery model).
ALTER TABLE users
    ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN locked_at TIMESTAMP NULL;

-- Real local authentication (username/password), replacing the mock header — see memory.
-- Nullable: existing demo accounts have no password until an Admin sets one for them.
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL;

CREATE TABLE user_sessions (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    token      VARCHAR(64) NOT NULL,
    user_id    BIGINT      NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP   NOT NULL,
    CONSTRAINT uq_user_sessions_token UNIQUE (token),
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

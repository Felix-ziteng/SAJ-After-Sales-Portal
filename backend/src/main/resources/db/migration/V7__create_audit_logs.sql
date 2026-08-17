-- Insert-only by convention: no service-layer code ever updates or deletes a row here. (A real
-- DB-grant-level lockdown needs a separate, more-privileged migration user than the app uses —
-- left for later infrastructure hardening, not blocking on it now.)
CREATE TABLE audit_logs (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    service_request_id BIGINT      NOT NULL,
    actor_user_id      BIGINT,
    actor_type         VARCHAR(16) NOT NULL,
    actor_role         VARCHAR(64),
    action             VARCHAR(32) NOT NULL,
    previous_status    VARCHAR(32),
    new_status         VARCHAR(32),
    comment            TEXT,
    ip_address         VARCHAR(64),
    created_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_request FOREIGN KEY (service_request_id) REFERENCES service_requests (id),
    CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

-- Remembers which status a request was in before being put ON_HOLD, so "resume" restores the
-- right state instead of a fixed target (see Phase 0 blueprint, Fig. 3 caption).
ALTER TABLE service_requests ADD COLUMN held_from_status VARCHAR(32) NULL;

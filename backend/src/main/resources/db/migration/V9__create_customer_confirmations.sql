-- Plaintext token by design (D6: long-lived, no OTP, low-friction v1) — always visible to staff
-- on the request so they can copy/share it; "resend" issues a new one, invalidating the old.
CREATE TABLE customer_confirmations (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    service_request_id BIGINT       NOT NULL,
    token              VARCHAR(64)  NOT NULL,
    status             VARCHAR(16)  NOT NULL,
    sent_to_email      VARCHAR(255),
    signature_name     VARCHAR(255),
    decided_at         TIMESTAMP    NULL,
    rejection_reason   TEXT,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_confirmations_request UNIQUE (service_request_id),
    CONSTRAINT uq_customer_confirmations_token UNIQUE (token),
    CONSTRAINT fk_customer_confirmations_request FOREIGN KEY (service_request_id) REFERENCES service_requests (id)
) ENGINE = InnoDB;

-- Which side rejected the request — decides what "Revise" does next (D4): a Manager rejection
-- goes back to DRAFT for a full rework; a Customer rejection goes straight back to
-- PENDING_CUSTOMER_CONFIRMATION since only shipping/contact details usually need fixing.
ALTER TABLE service_requests ADD COLUMN rejection_source VARCHAR(16) NULL;

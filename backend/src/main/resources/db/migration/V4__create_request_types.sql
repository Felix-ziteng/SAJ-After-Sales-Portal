CREATE TABLE request_types (
    id                            BIGINT AUTO_INCREMENT PRIMARY KEY,
    code                          VARCHAR(32)  NOT NULL,
    name                          VARCHAR(100) NOT NULL,
    requires_manager_approval     BOOLEAN      NOT NULL,
    requires_customer_confirmation BOOLEAN     NOT NULL,
    CONSTRAINT uq_request_types_code UNIQUE (code)
) ENGINE = InnoDB;

-- D1 / D5: Replacement always needs both gates, Parts needs neither — a flat rule per type,
-- not a threshold. The workflow engine (Phase 4) reads these two flags; it never branches on
-- the type code itself, so a future type is just a new row here.
INSERT INTO request_types (code, name, requires_manager_approval, requires_customer_confirmation) VALUES
    ('REPLACEMENT', 'Whole Machine Replacement', TRUE, TRUE),
    ('PARTS', 'Parts Shipment', FALSE, FALSE);

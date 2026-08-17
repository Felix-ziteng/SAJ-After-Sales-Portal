-- Ticket numbers are typed in by hand — Zendesk isn't integrated yet (Phase 11), so this table
-- is just a local reference the technician creates, not a synced copy of a real ticket.
CREATE TABLE zendesk_tickets (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    zendesk_ticket_id VARCHAR(64)  NOT NULL,
    customer_id      BIGINT       NOT NULL,
    subject          VARCHAR(255),
    requester_email  VARCHAR(255),
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_zendesk_tickets_ticket_id UNIQUE (zendesk_ticket_id),
    CONSTRAINT fk_zendesk_tickets_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE = InnoDB;

-- "year" is reserved on some engines (e.g. H2) when unquoted, and "last_value" is a reserved
-- MySQL 8 window-function name — hence seq_year / last_number instead of the obvious names.
CREATE TABLE request_number_sequences (
    seq_year    INT PRIMARY KEY,
    last_number INT NOT NULL DEFAULT 0
) ENGINE = InnoDB;

CREATE TABLE service_requests (
    id                        BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_number            VARCHAR(32)  NOT NULL,
    zendesk_ticket_id         BIGINT       NOT NULL,
    request_type_id           BIGINT       NOT NULL,
    customer_id               BIGINT       NOT NULL,
    technician_id             BIGINT       NOT NULL,
    product_id                BIGINT,
    reopened_from_request_id  BIGINT,
    serial_number             VARCHAR(128),
    reason                    TEXT,
    priority                  VARCHAR(16),
    status                    VARCHAR(32)  NOT NULL,
    created_at                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at              TIMESTAMP    NULL,
    completed_at              TIMESTAMP    NULL,
    CONSTRAINT uq_service_requests_number UNIQUE (request_number),
    CONSTRAINT fk_sr_ticket FOREIGN KEY (zendesk_ticket_id) REFERENCES zendesk_tickets (id),
    CONSTRAINT fk_sr_type FOREIGN KEY (request_type_id) REFERENCES request_types (id),
    CONSTRAINT fk_sr_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
    CONSTRAINT fk_sr_technician FOREIGN KEY (technician_id) REFERENCES users (id),
    CONSTRAINT fk_sr_product FOREIGN KEY (product_id) REFERENCES catalog_items (id),
    CONSTRAINT fk_sr_reopened_from FOREIGN KEY (reopened_from_request_id) REFERENCES service_requests (id)
) ENGINE = InnoDB;

CREATE TABLE request_items (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    service_request_id BIGINT      NOT NULL,
    catalog_item_id    BIGINT      NOT NULL,
    quantity           INT         NOT NULL,
    notes              VARCHAR(255),
    CONSTRAINT fk_ri_request FOREIGN KEY (service_request_id) REFERENCES service_requests (id) ON DELETE CASCADE,
    CONSTRAINT fk_ri_catalog_item FOREIGN KEY (catalog_item_id) REFERENCES catalog_items (id)
) ENGINE = InnoDB;

CREATE TABLE shipping_addresses (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    service_request_id BIGINT       NOT NULL,
    line1              VARCHAR(255) NOT NULL,
    line2              VARCHAR(255),
    city               VARCHAR(128) NOT NULL,
    postal_code        VARCHAR(32)  NOT NULL,
    country            VARCHAR(100) NOT NULL,
    contact_name       VARCHAR(255) NOT NULL,
    contact_phone      VARCHAR(64)  NOT NULL,
    CONSTRAINT uq_shipping_addresses_request UNIQUE (service_request_id),
    CONSTRAINT fk_sa_request FOREIGN KEY (service_request_id) REFERENCES service_requests (id) ON DELETE CASCADE
) ENGINE = InnoDB;

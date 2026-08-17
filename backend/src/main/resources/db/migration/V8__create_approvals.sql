CREATE TABLE approvals (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    service_request_id BIGINT      NOT NULL,
    manager_id         BIGINT      NOT NULL,
    decision           VARCHAR(16) NOT NULL,
    reason             TEXT,
    decided_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_approvals_request FOREIGN KEY (service_request_id) REFERENCES service_requests (id),
    CONSTRAINT fk_approvals_manager FOREIGN KEY (manager_id) REFERENCES users (id)
) ENGINE = InnoDB;

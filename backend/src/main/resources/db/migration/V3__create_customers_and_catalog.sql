CREATE TABLE customers (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    vat_number     VARCHAR(64),
    country        VARCHAR(100),
    zendesk_org_id VARCHAR(64),
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE TABLE catalog_items (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    sku      VARCHAR(64)  NOT NULL,
    name     VARCHAR(255) NOT NULL,
    category VARCHAR(32)  NOT NULL,
    active   BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_catalog_items_sku UNIQUE (sku)
) ENGINE = InnoDB;

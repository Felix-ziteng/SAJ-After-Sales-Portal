-- No customer master data (decided 2026-08-16): VAT number and company name are supplied by the
-- customer per-request via /confirm/{token}, scoped to the individual ticket — never a shared,
-- cross-ticket customer record.
ALTER TABLE zendesk_tickets DROP FOREIGN KEY fk_zendesk_tickets_customer;
ALTER TABLE zendesk_tickets DROP COLUMN customer_id;

ALTER TABLE service_requests DROP FOREIGN KEY fk_sr_customer;
ALTER TABLE service_requests DROP COLUMN customer_id;

ALTER TABLE shipping_addresses
    ADD COLUMN company_name VARCHAR(255) NULL,
    ADD COLUMN vat_number   VARCHAR(64)  NULL;

DROP TABLE customers;

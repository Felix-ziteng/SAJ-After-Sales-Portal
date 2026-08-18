-- Technicians now type the replacement model / part name directly instead of picking from a
-- shared catalog dropdown — the catalog_items table and its FKs are no longer needed.
ALTER TABLE service_requests ADD COLUMN item_code VARCHAR(64) NULL, ADD COLUMN model VARCHAR(255) NULL;
ALTER TABLE request_items ADD COLUMN item_code VARCHAR(64) NULL, ADD COLUMN name VARCHAR(255) NULL;

-- Backfill from the catalog before it's dropped, so existing requests keep readable history.
UPDATE service_requests sr
    JOIN catalog_items ci ON sr.product_id = ci.id
    SET sr.item_code = ci.sku, sr.model = ci.name
    WHERE sr.product_id IS NOT NULL;

UPDATE request_items ri
    JOIN catalog_items ci ON ri.catalog_item_id = ci.id
    SET ri.item_code = ci.sku, ri.name = ci.name;

ALTER TABLE service_requests DROP FOREIGN KEY fk_sr_product, DROP COLUMN product_id;
ALTER TABLE request_items DROP FOREIGN KEY fk_ri_catalog_item, DROP COLUMN catalog_item_id;

DROP TABLE catalog_items;

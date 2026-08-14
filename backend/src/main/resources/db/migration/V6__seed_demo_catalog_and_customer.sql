-- Dev-only seed data so the request-creation form has real options without an Admin session first.

INSERT INTO catalog_items (sku, name, category) VALUES
    ('H1-5K-S2', 'H1-5K-S2 Hybrid Inverter', 'INVERTER'),
    ('H1-10K-S2', 'H1-10K-S2 Hybrid Inverter', 'INVERTER'),
    ('BAT-5K', 'Battery Module 5kWh', 'BATTERY'),
    ('BAT-10K', 'Battery Module 10kWh', 'BATTERY'),
    ('CONN-MC4', 'MC4 Connector', 'ACCESSORY'),
    ('CABLE-DC-3M', 'DC Cable 3m', 'ACCESSORY'),
    ('COVER-H1', 'H1 Series Terminal Cover', 'PART');

INSERT INTO customers (name, country) VALUES
    ('ABC Solar S.r.l.', 'Italy');

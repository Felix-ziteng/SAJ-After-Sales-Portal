-- Dev-only seed data so the mock login screen (and MockAuthProvider) has real rows to read.
-- Safe to delete once real Admin-managed users replace these, or once Entra ID lands.

INSERT INTO roles (code, name) VALUES
    ('TECHNICIAN', 'Technician'),
    ('MANAGER', 'Manager'),
    ('WAREHOUSE', 'Warehouse'),
    ('ADMIN', 'Admin'),
    ('VIEWER', 'Viewer');

INSERT INTO users (email, display_name, department) VALUES
    ('technician@demo.local', 'Felix Bianchi', 'Technical Support'),
    ('manager@demo.local', 'Marco Rossi', 'After-Sales Management'),
    ('warehouse@demo.local', 'Erika Conti', 'Warehouse'),
    ('admin@demo.local', 'System Admin', 'IT'),
    ('viewer@demo.local', 'Laura Verdi', 'Management');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE (u.email = 'technician@demo.local' AND r.code = 'TECHNICIAN')
   OR (u.email = 'manager@demo.local' AND r.code = 'MANAGER')
   OR (u.email = 'warehouse@demo.local' AND r.code = 'WAREHOUSE')
   OR (u.email = 'admin@demo.local' AND r.code = 'ADMIN')
   OR (u.email = 'viewer@demo.local' AND r.code = 'VIEWER');

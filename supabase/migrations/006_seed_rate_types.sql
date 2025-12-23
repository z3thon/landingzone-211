-- Seed Rate Types
-- Common rate types for the professional marketplace platform

INSERT INTO rate_types (name, description) VALUES
    ('Hourly', 'Standard hourly billing rate'),
    ('Coaching', 'Coaching and mentoring rate'),
    ('Project-Based', 'Fixed price for entire project'),
    ('Retainer', 'Monthly retainer agreement'),
    ('Consulting', 'Consulting services rate')
ON CONFLICT (name) DO NOTHING;

-- Oturumlara test tipi ekle (idempotent)
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS test_type_id UUID REFERENCES test_types(id) ON DELETE SET NULL;
</｜｜DSML｜｜_command>
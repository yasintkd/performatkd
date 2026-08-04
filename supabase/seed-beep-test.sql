-- 20 Metre Mekik Koşusu test tipi (idempotent)
INSERT INTO test_types (name, unit, higher_is_better, created_by)
SELECT '20 Metre Mekik Koşusu', 'ml/kg/min', true, id
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM test_types WHERE name = '20 Metre Mekik Koşusu')
ORDER BY created_at
LIMIT 1;

-- 1 Dakika Mekik Çekme test tipi (idempotent)
INSERT INTO test_types (name, unit, higher_is_better, created_by)
SELECT 'Mekik Çekme (1 dk)', 'adet', true, id
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM test_types WHERE name = 'Mekik Çekme (1 dk)')
ORDER BY created_at
LIMIT 1;

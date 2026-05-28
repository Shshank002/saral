-- ========================================================
-- SARAL PostgreSQL User Setup
-- ========================================================
-- Run this in pgAdmin in TWO steps:
--
-- STEP 1: Run "PART 1" while connected to 'postgres' database (default)
--   - In pgAdmin, expand PostgreSQL 18 -> Databases -> postgres
--   - Right-click 'postgres' -> Query Tool
--   - Paste PART 1 only, press F5 (Execute)
--
-- STEP 2: Run "PART 2" while connected to 'SaralDB'
--   - Right-click 'SaralDB' -> Query Tool
--   - Paste PART 2 only, press F5 (Execute)
--
-- After both parts succeed, run from terminal:
--   npm run db:push      (creates tables)
--   npm run db:seed      (loads sample data)
-- ========================================================


-- ===================================================
-- PART 1: Run in 'postgres' database
-- (Creates the user account)
-- ===================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'saral') THEN
    CREATE USER saral WITH PASSWORD 'postgres';
    RAISE NOTICE 'User "saral" created successfully';
  ELSE
    ALTER USER saral WITH PASSWORD 'postgres';
    RAISE NOTICE 'User "saral" already existed - password reset to "postgres"';
  END IF;
END
$$;

-- Grant database-level access to SaralDB
GRANT ALL PRIVILEGES ON DATABASE "SaralDB" TO saral;

-- Verify user was created
SELECT rolname AS "Created users" FROM pg_roles WHERE rolname = 'saral';


-- ===================================================
-- PART 2: Run in 'SaralDB' database
-- (Grants schema permissions inside SaralDB)
--
-- IMPORTANT: Right-click 'SaralDB' in pgAdmin sidebar
-- and open Query Tool from there before pasting this part!
-- ===================================================

-- Make saral the owner of the public schema (so Prisma can create tables)
ALTER SCHEMA public OWNER TO saral;

-- Grant all permissions on the schema
GRANT ALL ON SCHEMA public TO saral;

-- Grant permissions on existing objects (in case any exist)
GRANT ALL ON ALL TABLES IN SCHEMA public TO saral;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO saral;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO saral;

-- Grant permissions on future objects (so Prisma's new tables work)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO saral;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO saral;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO saral;

-- Verify the schema is owned by saral
SELECT nspname AS "Schema", pg_catalog.pg_get_userbyid(nspowner) AS "Owner"
FROM pg_catalog.pg_namespace
WHERE nspname = 'public';

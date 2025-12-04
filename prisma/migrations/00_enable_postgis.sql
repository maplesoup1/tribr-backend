-- Enable PostGIS extension for geography support
-- This enables spatial queries for user locations

CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify extension is installed
SELECT PostGIS_version();

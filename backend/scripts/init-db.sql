-- Ejecutar conectado a la base "postgres" (no a "tutorias").
-- Crea la base solo si aún no existe.
DO
$do$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_database
        WHERE datname = 'tutorias'
    ) THEN
        CREATE DATABASE tutorias;
    END IF;
END
$do$;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventoTipo" ADD VALUE 'TRIATHLON';
ALTER TYPE "EventoTipo" ADD VALUE 'TRAIL';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "precio_individual" DOUBLE PRECISION NOT NULL DEFAULT 5.99,
ADD COLUMN     "precio_photopass" DOUBLE PRECISION NOT NULL DEFAULT 11.99;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "helper_expires_at" TIMESTAMP(3),
ADD COLUMN     "helper_permissions" JSONB;

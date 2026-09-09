/*
  Warnings:

  - You are about to drop the column `isVerified` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `isVerified`,
    ADD COLUMN `role` ENUM('ANALISTA', 'TRABAJADOR') NOT NULL DEFAULT 'ANALISTA';

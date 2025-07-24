/*
  Warnings:

  - You are about to drop the column `url` on the `Photo` table. All the data in the column will be lost.
  - Added the required column `imageUrl` to the `Photo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Photo` DROP COLUMN `url`,
    ADD COLUMN `imageUrl` LONGTEXT NOT NULL,
    MODIFY `filename` LONGTEXT NULL,
    MODIFY `originalSrc` LONGTEXT NULL,
    MODIFY `processedSrc` LONGTEXT NULL;

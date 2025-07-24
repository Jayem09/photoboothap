-- AlterTable
ALTER TABLE `Photo` ADD COLUMN `filename` TEXT NULL,
    ADD COLUMN `filtersApplied` JSON NULL,
    ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `originalSrc` TEXT NULL,
    ADD COLUMN `processedSrc` TEXT NULL,
    ADD COLUMN `size` VARCHAR(191) NULL,
    ADD COLUMN `stickers` JSON NULL;

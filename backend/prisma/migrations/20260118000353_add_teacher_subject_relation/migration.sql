-- AlterTable
ALTER TABLE `users` ADD COLUMN `subjectId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `users_subjectId_idx` ON `users`(`subjectId`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

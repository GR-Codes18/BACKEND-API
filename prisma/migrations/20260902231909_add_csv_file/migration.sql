-- CreateTable
CREATE TABLE `CsvFile` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `estado` ENUM('PENDIENTE', 'LIMPIO') NOT NULL DEFAULT 'PENDIENTE',
    `urlArchivo` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `tamanioBytes` INTEGER NOT NULL,
    `filasCount` INTEGER NULL,
    `columnCount` INTEGER NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CsvFile` ADD CONSTRAINT `CsvFile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

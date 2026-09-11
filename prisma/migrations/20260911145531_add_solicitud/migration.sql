-- CreateTable
CREATE TABLE `Solicitud` (
    `id` VARCHAR(191) NOT NULL,
    `nombreCompleto` VARCHAR(191) NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `mensaje` VARCHAR(191) NOT NULL,
    `estado` ENUM('PENDIENTE', 'RESPONDIDA') NOT NULL DEFAULT 'PENDIENTE',
    `respuesta` VARCHAR(191) NULL,
    `respondidaAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

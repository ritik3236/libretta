-- CreateTable
CREATE TABLE `lb_users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `businessName` VARCHAR(191) NULL,
    `baseCurrency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `canCreateParties` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` TIMESTAMP(3) NOT NULL,

    UNIQUE INDEX `lb_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lb_customers` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `balanceMinor` BIGINT NOT NULL DEFAULT 0,
    `note` TEXT NULL,
    `sourcePredefinedId` VARCHAR(191) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` TIMESTAMP(3) NOT NULL,

    INDEX `lb_customers_userId_idx`(`userId`),
    INDEX `lb_customers_userId_name_idx`(`userId`, `name`),
    INDEX `lb_customers_userId_sourcePredefinedId_idx`(`userId`, `sourcePredefinedId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lb_entries` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `direction` ENUM('CREDIT', 'DEBIT') NOT NULL,
    `amountMinor` BIGINT NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED') NOT NULL DEFAULT 'PENDING',
    `version` INTEGER NOT NULL DEFAULT 1,
    `occurredAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lb_entries_customerId_occurredAt_idx`(`customerId`, `occurredAt`),
    INDEX `lb_entries_userId_occurredAt_idx`(`userId`, `occurredAt`),
    INDEX `lb_entries_userId_status_idx`(`userId`, `status`),
    INDEX `lb_entries_customerId_status_idx`(`customerId`, `status`),
    INDEX `lb_entries_userId_currency_occurredAt_idx`(`userId`, `currency`, `occurredAt`),
    INDEX `lb_entries_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lb_entry_versions` (
    `id` VARCHAR(191) NOT NULL,
    `entryId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `direction` ENUM('CREDIT', 'DEBIT') NOT NULL,
    `amountMinor` BIGINT NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `occurredAt` TIMESTAMP(3) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED') NOT NULL,
    `changeType` VARCHAR(191) NOT NULL,
    `changedById` VARCHAR(191) NOT NULL,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `validFrom` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validTo` TIMESTAMP(3) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lb_entry_versions_entryId_validTo_idx`(`entryId`, `validTo`),
    UNIQUE INDEX `lb_entry_versions_entryId_version_key`(`entryId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lb_currencies` (
    `code` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `decimals` INTEGER NOT NULL DEFAULT 2,
    `label` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` TIMESTAMP(3) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lb_predefined_parties` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `note` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` TIMESTAMP(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lb_audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lb_audit_logs_targetType_targetId_idx`(`targetType`, `targetId`),
    INDEX `lb_audit_logs_actorId_createdAt_idx`(`actorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lb_customers` ADD CONSTRAINT `lb_customers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `lb_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lb_entries` ADD CONSTRAINT `lb_entries_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `lb_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lb_entries` ADD CONSTRAINT `lb_entries_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `lb_customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lb_entry_versions` ADD CONSTRAINT `lb_entry_versions_entryId_fkey` FOREIGN KEY (`entryId`) REFERENCES `lb_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


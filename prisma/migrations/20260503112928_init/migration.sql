-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('DESCRIPTION', 'FEATURES', 'IMAGES', 'BADGES', 'TABLE', 'INFO_BOX', 'SEO_TEXT', 'VIDEO', 'FAQ', 'CUSTOM_HTML');

-- CreateEnum
CREATE TYPE "BlockEffect" AS ENUM ('NONE', 'ACCORDION', 'COLLAPSE', 'TABS');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED');

-- CreateTable
CREATE TABLE "stores" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "accessToken" TEXT,
    "scopes" TEXT NOT NULL,
    "storeName" TEXT,
    "storeUrl" TEXT,
    "country" TEXT DEFAULT 'BR',
    "language" TEXT DEFAULT 'pt',
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" TIMESTAMP(3),
    "redactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_configs" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT,
    "productHandle" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metafieldId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" SERIAL NOT NULL,
    "productConfigId" INTEGER NOT NULL,
    "type" "BlockType" NOT NULL,
    "title" TEXT,
    "content" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "effect" "BlockEffect" NOT NULL DEFAULT 'NONE',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "blocks" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_links" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "nuvemshopProductId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedBy" TEXT NOT NULL DEFAULT 'manual',

    CONSTRAINT "product_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_rules" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "ruleValue" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "errorsJson" JSONB,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "templateId" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "eventKey" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_export_requests" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dataJson" TEXT,

    CONSTRAINT "data_export_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_storeId_key" ON "stores"("storeId");

-- CreateIndex
CREATE INDEX "product_configs_storeId_idx" ON "product_configs"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "product_configs_storeId_productId_key" ON "product_configs"("storeId", "productId");

-- CreateIndex
CREATE INDEX "blocks_productConfigId_idx" ON "blocks"("productConfigId");

-- CreateIndex
CREATE INDEX "templates_storeId_idx" ON "templates"("storeId");

-- CreateIndex
CREATE INDEX "product_links_storeId_idx" ON "product_links"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "product_links_storeId_nuvemshopProductId_key" ON "product_links"("storeId", "nuvemshopProductId");

-- CreateIndex
CREATE INDEX "auto_rules_storeId_idx" ON "auto_rules"("storeId");

-- CreateIndex
CREATE INDEX "import_jobs_storeId_status_idx" ON "import_jobs"("storeId", "status");

-- CreateIndex
CREATE INDEX "analytics_events_storeId_productId_idx" ON "analytics_events"("storeId", "productId");

-- CreateIndex
CREATE INDEX "analytics_events_storeId_eventType_idx" ON "analytics_events"("storeId", "eventType");

-- CreateIndex
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");

-- CreateIndex
CREATE INDEX "webhook_events_storeId_idx" ON "webhook_events"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_storeId_eventKey_key" ON "webhook_events"("storeId", "eventKey");

-- CreateIndex
CREATE INDEX "data_export_requests_storeId_status_idx" ON "data_export_requests"("storeId", "status");

-- AddForeignKey
ALTER TABLE "product_configs" ADD CONSTRAINT "product_configs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("storeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_productConfigId_fkey" FOREIGN KEY ("productConfigId") REFERENCES "product_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("storeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_links" ADD CONSTRAINT "product_links_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("storeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_links" ADD CONSTRAINT "product_links_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_rules" ADD CONSTRAINT "auto_rules_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("storeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_rules" ADD CONSTRAINT "auto_rules_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("storeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("storeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("storeId") ON DELETE CASCADE ON UPDATE CASCADE;


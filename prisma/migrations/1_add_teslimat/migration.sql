-- AlterTable
ALTER TABLE "Mut" ADD COLUMN "araciKomisyonOrani" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Teslimat" (
    "id" TEXT NOT NULL,
    "isim" TEXT NOT NULL,
    "miktar" DOUBLE PRECISION NOT NULL,
    "mutId" TEXT NOT NULL,

    CONSTRAINT "Teslimat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Teslimat" ADD CONSTRAINT "Teslimat_mutId_fkey" FOREIGN KEY ("mutId") REFERENCES "Mut"("id") ON DELETE CASCADE ON UPDATE CASCADE;

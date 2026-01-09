-- AlterTable
ALTER TABLE "User" ADD COLUMN     "groupName" TEXT,
ALTER COLUMN "role" SET DEFAULT 'USER';

-- AlterTable
ALTER TABLE "Mut" ADD COLUMN     "isim" TEXT;

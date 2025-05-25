-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_idCabang_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "idCabang" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_idCabang_fkey" FOREIGN KEY ("idCabang") REFERENCES "Cabang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

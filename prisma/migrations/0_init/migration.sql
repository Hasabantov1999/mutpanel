-- CreateTable
CREATE TABLE "Panel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Panel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "panelId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mut" (
    "id" TEXT NOT NULL,
    "panelYatirim" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "panelCekim" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "devir" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "komisyonOrani" DOUBLE PRECISION NOT NULL DEFAULT 1.25,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Mut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManuelYatirim" (
    "id" TEXT NOT NULL,
    "isim" TEXT NOT NULL,
    "miktar" DOUBLE PRECISION NOT NULL,
    "mutId" TEXT NOT NULL,

    CONSTRAINT "ManuelYatirim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManuelCekim" (
    "id" TEXT NOT NULL,
    "isim" TEXT NOT NULL,
    "miktar" DOUBLE PRECISION NOT NULL,
    "mutId" TEXT NOT NULL,

    CONSTRAINT "ManuelCekim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "mutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Panel_name_key" ON "Panel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "Panel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mut" ADD CONSTRAINT "Mut_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mut" ADD CONSTRAINT "Mut_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManuelYatirim" ADD CONSTRAINT "ManuelYatirim_mutId_fkey" FOREIGN KEY ("mutId") REFERENCES "Mut"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManuelCekim" ADD CONSTRAINT "ManuelCekim_mutId_fkey" FOREIGN KEY ("mutId") REFERENCES "Mut"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "cui" TEXT NOT NULL,
    "denumire" TEXT NOT NULL,
    "cod_inmatriculare" TEXT,
    "stare" TEXT,
    "judet" TEXT,
    "localitate" TEXT,
    "adresa" TEXT,
    "cod_postal" TEXT,
    "telefon" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "web" TEXT,
    "cod_caen" TEXT,
    "caen_denumire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_cui_key" ON "Company"("cui");

-- CreateIndex
CREATE INDEX "Company_cui_idx" ON "Company"("cui");

-- CreateIndex
CREATE INDEX "Company_denumire_idx" ON "Company"("denumire");

-- CreateIndex
CREATE INDEX "Company_judet_idx" ON "Company"("judet");

-- CreateIndex
CREATE INDEX "Company_stare_idx" ON "Company"("stare");

-- CreateIndex
CREATE INDEX "Company_cod_caen_idx" ON "Company"("cod_caen");

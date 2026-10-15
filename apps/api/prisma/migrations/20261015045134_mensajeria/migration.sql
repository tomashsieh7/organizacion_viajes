-- AlterTable
ALTER TABLE "membresia" ADD COLUMN     "chat_leido_hasta" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "reaccion" (
    "mensaje_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "emoji" VARCHAR(16) NOT NULL,
    "creada_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reaccion_pkey" PRIMARY KEY ("mensaje_id","usuario_id")
);

-- CreateIndex
CREATE INDEX "reaccion_usuario_id_idx" ON "reaccion"("usuario_id");

-- AddForeignKey
ALTER TABLE "reaccion" ADD CONSTRAINT "reaccion_mensaje_id_fkey" FOREIGN KEY ("mensaje_id") REFERENCES "mensaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaccion" ADD CONSTRAINT "reaccion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Restricciones que Prisma no expresa en schema.prisma (sección 4.3 de PLAN.md)
-- ---------------------------------------------------------------------------

-- Reacción: solo un emoji del conjunto fijo (EMOJIS_REACCION en packages/compartido)
ALTER TABLE "reaccion" ADD CONSTRAINT "reaccion_emoji_valido"
  CHECK ("emoji" IN ('👍', '❤️', '😂', '😮', '😢', '🎉'));


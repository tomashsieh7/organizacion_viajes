-- CreateEnum
CREATE TYPE "tipo_credencial" AS ENUM ('EMAIL_CONTRASENA');

-- CreateEnum
CREATE TYPE "rol_membresia" AS ENUM ('ADMIN', 'VIAJERO');

-- CreateEnum
CREATE TYPE "estado_membresia" AS ENUM ('ACTIVA', 'ELIMINADA', 'RETIRADA');

-- CreateEnum
CREATE TYPE "tipo_propuesta" AS ENUM ('ACTIVIDAD', 'ALOJAMIENTO');

-- CreateEnum
CREATE TYPE "estado_propuesta" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'DENEGADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "valor_voto" AS ENUM ('A_FAVOR', 'EN_CONTRA');

-- CreateEnum
CREATE TYPE "modo_division" AS ENUM ('IGUALES', 'ARBITRARIA');

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "apodo" TEXT,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credencial" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "tipo" "tipo_credencial" NOT NULL,
    "identificador" TEXT NOT NULL,
    "secreto_hash" TEXT,
    "verificada_en" TIMESTAMPTZ(3),
    "creada_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credencial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesion" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "creada_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_en" TIMESTAMPTZ(3) NOT NULL,
    "revocada_en" TIMESTAMPTZ(3),

    CONSTRAINT "sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moneda" (
    "codigo" VARCHAR(3) NOT NULL,
    "nombre" TEXT NOT NULL,
    "decimales" INTEGER NOT NULL,

    CONSTRAINT "moneda_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "viaje" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "moneda_codigo" VARCHAR(3) NOT NULL,
    "creado_por_id" UUID NOT NULL,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membresia" (
    "viaje_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "rol" "rol_membresia" NOT NULL,
    "estado" "estado_membresia" NOT NULL DEFAULT 'ACTIVA',
    "baja_con_deuda" BOOLEAN NOT NULL DEFAULT false,
    "alta_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baja_en" TIMESTAMPTZ(3),

    CONSTRAINT "membresia_pkey" PRIMARY KEY ("viaje_id","usuario_id")
);

-- CreateTable
CREATE TABLE "propuesta" (
    "id" UUID NOT NULL,
    "viaje_id" UUID NOT NULL,
    "autor_id" UUID NOT NULL,
    "tipo" "tipo_propuesta" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio" BIGINT,
    "ubicacion" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "estado" "estado_propuesta" NOT NULL DEFAULT 'PENDIENTE',
    "resuelta_por_id" UUID,
    "resuelta_en" TIMESTAMPTZ(3),
    "creada_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "propuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividad" (
    "propuesta_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME(0) NOT NULL,
    "duracion_min" INTEGER NOT NULL,
    "alternativa_de_id" UUID,

    CONSTRAINT "actividad_pkey" PRIMARY KEY ("propuesta_id")
);

-- CreateTable
CREATE TABLE "alojamiento" (
    "propuesta_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_desde" DATE NOT NULL,
    "fecha_hasta" DATE NOT NULL,

    CONSTRAINT "alojamiento_pkey" PRIMARY KEY ("propuesta_id")
);

-- CreateTable
CREATE TABLE "voto" (
    "propuesta_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "valor" "valor_voto" NOT NULL,
    "emitido_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voto_pkey" PRIMARY KEY ("propuesta_id","usuario_id")
);

-- CreateTable
CREATE TABLE "mensaje" (
    "id" UUID NOT NULL,
    "viaje_id" UUID NOT NULL,
    "autor_id" UUID NOT NULL,
    "contenido" TEXT NOT NULL,
    "enviado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria_gasto" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "categoria_gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gasto" (
    "id" UUID NOT NULL,
    "viaje_id" UUID NOT NULL,
    "pagado_por_id" UUID NOT NULL,
    "registrado_por_id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "monto" BIGINT NOT NULL,
    "modo_division" "modo_division" NOT NULL,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gasto_parte" (
    "gasto_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "monto" BIGINT NOT NULL,

    CONSTRAINT "gasto_parte_pkey" PRIMARY KEY ("gasto_id","usuario_id")
);

-- CreateTable
CREATE TABLE "deuda" (
    "id" UUID NOT NULL,
    "viaje_id" UUID NOT NULL,
    "deudor_id" UUID NOT NULL,
    "acreedor_id" UUID NOT NULL,
    "monto" BIGINT NOT NULL DEFAULT 0,
    "ultima_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deuda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago" (
    "id" UUID NOT NULL,
    "deuda_id" UUID NOT NULL,
    "registrado_por_id" UUID NOT NULL,
    "monto" BIGINT NOT NULL,
    "fecha" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credencial_usuario_id_idx" ON "credencial"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "credencial_tipo_identificador_key" ON "credencial"("tipo", "identificador");

-- CreateIndex
CREATE UNIQUE INDEX "sesion_token_hash_key" ON "sesion"("token_hash");

-- CreateIndex
CREATE INDEX "sesion_usuario_id_idx" ON "sesion"("usuario_id");

-- CreateIndex
CREATE INDEX "membresia_usuario_id_idx" ON "membresia"("usuario_id");

-- CreateIndex
CREATE INDEX "propuesta_viaje_id_tipo_estado_idx" ON "propuesta"("viaje_id", "tipo", "estado");

-- CreateIndex
CREATE INDEX "actividad_alternativa_de_id_idx" ON "actividad"("alternativa_de_id");

-- CreateIndex
CREATE INDEX "voto_usuario_id_idx" ON "voto"("usuario_id");

-- CreateIndex
CREATE INDEX "mensaje_viaje_id_enviado_en_idx" ON "mensaje"("viaje_id", "enviado_en");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_gasto_codigo_key" ON "categoria_gasto"("codigo");

-- CreateIndex
CREATE INDEX "gasto_viaje_id_idx" ON "gasto"("viaje_id");

-- CreateIndex
CREATE INDEX "gasto_parte_usuario_id_idx" ON "gasto_parte"("usuario_id");

-- CreateIndex
CREATE INDEX "deuda_deudor_id_idx" ON "deuda"("deudor_id");

-- CreateIndex
CREATE INDEX "deuda_acreedor_id_idx" ON "deuda"("acreedor_id");

-- CreateIndex
CREATE UNIQUE INDEX "deuda_viaje_id_deudor_id_acreedor_id_key" ON "deuda"("viaje_id", "deudor_id", "acreedor_id");

-- CreateIndex
CREATE INDEX "pago_deuda_id_idx" ON "pago"("deuda_id");

-- AddForeignKey
ALTER TABLE "credencial" ADD CONSTRAINT "credencial_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viaje" ADD CONSTRAINT "viaje_moneda_codigo_fkey" FOREIGN KEY ("moneda_codigo") REFERENCES "moneda"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viaje" ADD CONSTRAINT "viaje_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membresia" ADD CONSTRAINT "membresia_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membresia" ADD CONSTRAINT "membresia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propuesta" ADD CONSTRAINT "propuesta_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propuesta" ADD CONSTRAINT "propuesta_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propuesta" ADD CONSTRAINT "propuesta_resuelta_por_id_fkey" FOREIGN KEY ("resuelta_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_propuesta_id_fkey" FOREIGN KEY ("propuesta_id") REFERENCES "propuesta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_alternativa_de_id_fkey" FOREIGN KEY ("alternativa_de_id") REFERENCES "actividad"("propuesta_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alojamiento" ADD CONSTRAINT "alojamiento_propuesta_id_fkey" FOREIGN KEY ("propuesta_id") REFERENCES "propuesta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voto" ADD CONSTRAINT "voto_propuesta_id_fkey" FOREIGN KEY ("propuesta_id") REFERENCES "propuesta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voto" ADD CONSTRAINT "voto_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensaje" ADD CONSTRAINT "mensaje_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensaje" ADD CONSTRAINT "mensaje_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gasto" ADD CONSTRAINT "gasto_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gasto" ADD CONSTRAINT "gasto_pagado_por_id_fkey" FOREIGN KEY ("pagado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gasto" ADD CONSTRAINT "gasto_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gasto" ADD CONSTRAINT "gasto_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria_gasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gasto_parte" ADD CONSTRAINT "gasto_parte_gasto_id_fkey" FOREIGN KEY ("gasto_id") REFERENCES "gasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gasto_parte" ADD CONSTRAINT "gasto_parte_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deuda" ADD CONSTRAINT "deuda_viaje_id_fkey" FOREIGN KEY ("viaje_id") REFERENCES "viaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deuda" ADD CONSTRAINT "deuda_deudor_id_fkey" FOREIGN KEY ("deudor_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deuda" ADD CONSTRAINT "deuda_acreedor_id_fkey" FOREIGN KEY ("acreedor_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_deuda_id_fkey" FOREIGN KEY ("deuda_id") REFERENCES "deuda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Restricciones que Prisma no expresa en schema.prisma (sección 4.3 de PLAN.md)
-- ---------------------------------------------------------------------------

-- Credencial: el identificador de email se guarda normalizado (D6)
ALTER TABLE "credencial" ADD CONSTRAINT "credencial_email_normalizado"
  CHECK ("tipo" <> 'EMAIL_CONTRASENA' OR "identificador" = lower(btrim("identificador")));

-- Moneda: cantidad de decimales razonable
ALTER TABLE "moneda" ADD CONSTRAINT "moneda_decimales_validos" CHECK ("decimales" BETWEEN 0 AND 4);

-- Viaje: rango de fechas válido
ALTER TABLE "viaje" ADD CONSTRAINT "viaje_rango_fechas" CHECK ("fecha_inicio" <= "fecha_fin");

-- Membresía: un único Admin activo por viaje (P2, P5)
CREATE UNIQUE INDEX "membresia_un_admin_activo" ON "membresia" ("viaje_id")
  WHERE "rol" = 'ADMIN' AND "estado" = 'ACTIVA';

-- Membresía: la fecha de baja existe solo si la membresía no está activa
ALTER TABLE "membresia" ADD CONSTRAINT "membresia_baja_coherente"
  CHECK (("estado" = 'ACTIVA') = ("baja_en" IS NULL));

-- Propuesta: coordenadas completas o ausentes, precio opcional no negativo (P8)
ALTER TABLE "propuesta" ADD CONSTRAINT "propuesta_coordenadas_completas"
  CHECK (("latitud" IS NULL) = ("longitud" IS NULL));
ALTER TABLE "propuesta" ADD CONSTRAINT "propuesta_precio_no_negativo"
  CHECK ("precio" IS NULL OR "precio" >= 0);
ALTER TABLE "propuesta" ADD CONSTRAINT "propuesta_coordenadas_en_rango"
  CHECK ("latitud" IS NULL OR ("latitud" BETWEEN -90 AND 90 AND "longitud" BETWEEN -180 AND 180));

-- Actividad: duración positiva
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_duracion_positiva" CHECK ("duracion_min" > 0);

-- Alojamiento: rango de fechas válido
ALTER TABLE "alojamiento" ADD CONSTRAINT "alojamiento_rango_fechas" CHECK ("fecha_desde" <= "fecha_hasta");

-- Gasto y partes: montos válidos
ALTER TABLE "gasto" ADD CONSTRAINT "gasto_monto_positivo" CHECK ("monto" > 0);
ALTER TABLE "gasto_parte" ADD CONSTRAINT "gasto_parte_monto_no_negativo" CHECK ("monto" >= 0);

-- Deuda: nadie se debe a sí mismo y un saldo nunca es negativo
ALTER TABLE "deuda" ADD CONSTRAINT "deuda_entre_personas_distintas" CHECK ("deudor_id" <> "acreedor_id");
ALTER TABLE "deuda" ADD CONSTRAINT "deuda_monto_no_negativo" CHECK ("monto" >= 0);

-- Pago: monto positivo
ALTER TABLE "pago" ADD CONSTRAINT "pago_monto_positivo" CHECK ("monto" > 0);

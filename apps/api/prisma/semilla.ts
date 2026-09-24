/**
 * Datos de la semilla de la base (F1). `seed.ts` los carga en la base de desarrollo y la prueba
 * de invariante de saldos, en la de prueba.
 * - Catálogos: categorías de gasto y monedas (P16). Se cargan siempre y no se duplican.
 * - Datos de ejemplo: un viaje con cuatro viajeros, propuestas en todos los estados, una actividad
 *   con alternativas, gastos en ambos modos de división, deudas y un pago. Solo se cargan si la
 *   base no tiene usuarios, y nunca con NODE_ENV=test.
 * Los usuarios de ejemplo ingresan con su email (ana@ejemplo.com, tomas@ejemplo.com, luis@ejemplo.com,
 * sofia@ejemplo.com) y la contraseña `CONTRASENA_DE_EJEMPLO`.
 * Los montos están en centavos (D16). Las deudas se calcularon a mano aplicando RN-G6 y P15; el
 * detalle está en los comentarios de cada paso.
 */
import type { PrismaClient } from '../src/compartido/infraestructura/prisma.js';
import { HasheadorArgon2 } from '../src/modulos/auth/infraestructura/adaptadores.js';

/** Contraseña de los usuarios de ejemplo; solo existe en la base de desarrollo. */
export const CONTRASENA_DE_EJEMPLO = 'viaje-de-prueba-2026';

const CATEGORIAS = [
  { codigo: 'ALOJAMIENTO', nombre: 'Alojamiento' },
  { codigo: 'TRANSPORTE', nombre: 'Transporte' },
  { codigo: 'COMIDA', nombre: 'Comida' },
  { codigo: 'ACTIVIDADES', nombre: 'Actividades' },
  { codigo: 'COMPRAS', nombre: 'Compras' },
  { codigo: 'OTROS', nombre: 'Otros' },
];

const MONEDAS = [
  { codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 },
  { codigo: 'USD', nombre: 'Dólar estadounidense', decimales: 2 },
  { codigo: 'EUR', nombre: 'Euro', decimales: 2 },
  { codigo: 'BRL', nombre: 'Real brasileño', decimales: 2 },
  { codigo: 'CLP', nombre: 'Peso chileno', decimales: 0 },
  { codigo: 'UYU', nombre: 'Peso uruguayo', decimales: 2 },
];

const dia = (fecha: string) => new Date(`${fecha}T00:00:00Z`);
const hora = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00Z`);

/** Catálogos: categorías de gasto y monedas (P16). No se duplican. */
export async function cargarCatalogos(prisma: PrismaClient) {
  for (const c of CATEGORIAS) {
    await prisma.categoriaGasto.upsert({
      where: { codigo: c.codigo },
      update: { nombre: c.nombre },
      create: c,
    });
  }
  for (const m of MONEDAS) {
    await prisma.moneda.upsert({ where: { codigo: m.codigo }, update: m, create: m });
  }
}

/** Datos de ejemplo del viaje a Bariloche; también los usa la prueba de invariante de saldos. */
export async function cargarEjemplo(prisma: PrismaClient) {
  const secretoHash = await new HasheadorArgon2().hashear(CONTRASENA_DE_EJEMPLO);
  await prisma.$transaction(async (tx) => {
    const [ana, tomas, luis, sofia] = await Promise.all(
      [
        { nombre: 'Ana Pérez', apodo: 'Ani', email: 'ana@ejemplo.com' },
        { nombre: 'Tomás Gómez', apodo: 'Tomi', email: 'tomas@ejemplo.com' },
        { nombre: 'Luis Díaz', apodo: null, email: 'luis@ejemplo.com' },
        { nombre: 'Sofía Ruiz', apodo: 'Sofi', email: 'sofia@ejemplo.com' },
      ].map(({ email, ...u }) =>
        tx.usuario.create({
          data: {
            ...u,
            credenciales: {
              create: { tipo: 'EMAIL_CONTRASENA', identificador: email, secretoHash },
            },
          },
        }),
      ),
    );
    if (!ana || !tomas || !luis || !sofia) throw new Error('No se crearon los usuarios de ejemplo');

    const viaje = await tx.viaje.create({
      data: {
        nombre: 'Bariloche 2026',
        destino: 'San Carlos de Bariloche',
        fechaInicio: dia('2026-12-10'),
        fechaFin: dia('2026-12-16'),
        monedaCodigo: 'ARS',
        creadoPorId: ana.id,
        membresias: {
          create: [
            { usuarioId: ana.id, rol: 'ADMIN' },
            { usuarioId: tomas.id, rol: 'VIAJERO' },
            { usuarioId: luis.id, rol: 'VIAJERO' },
            { usuarioId: sofia.id, rol: 'VIAJERO' },
          ],
        },
      },
    });
    const base = { viajeId: viaje.id };
    const resuelta = (estado: 'CONFIRMADA' | 'DENEGADA' | 'CANCELADA') => ({
      estado,
      resueltaPorId: ana.id,
      resueltaEn: new Date(),
    });

    // Alojamientos: uno confirmado, uno denegado y uno pendiente.
    await tx.propuesta.create({
      data: {
        ...base,
        autorId: tomas.id,
        tipo: 'ALOJAMIENTO',
        descripcion: 'Habitación compartida para cuatro con desayuno',
        precio: 48_000_000n,
        ubicacion: 'Hostel Patagonia, Bariloche',
        latitud: -41.1335,
        longitud: -71.3103,
        ...resuelta('CONFIRMADA'),
        alojamiento: {
          create: {
            nombre: 'Hostel Patagonia',
            fechaDesde: dia('2026-12-10'),
            fechaHasta: dia('2026-12-16'),
          },
        },
      },
    });
    await tx.propuesta.create({
      data: {
        ...base,
        autorId: sofia.id,
        tipo: 'ALOJAMIENTO',
        descripcion: 'Cabaña frente al lago',
        precio: 90_000_000n,
        ubicacion: 'Villa Los Coihues',
        ...resuelta('DENEGADA'),
        alojamiento: {
          create: {
            nombre: 'Cabaña del lago',
            fechaDesde: dia('2026-12-10'),
            fechaHasta: dia('2026-12-16'),
          },
        },
      },
    });
    await tx.propuesta.create({
      data: {
        ...base,
        autorId: luis.id,
        tipo: 'ALOJAMIENTO',
        descripcion: 'Última noche en el centro, cerca de la terminal',
        ubicacion: 'Hotel Centro, Mitre 100',
        alojamiento: {
          create: {
            nombre: 'Hotel Centro',
            fechaDesde: dia('2026-12-15'),
            fechaHasta: dia('2026-12-16'),
          },
        },
      },
    });

    // Actividades: una confirmada, una cancelada y un grupo de opciones pendientes
    // (el kayak es la original y el trekking y la cabalgata son sus alternativas).
    const actividad = (
      autorId: string,
      titulo: string,
      fecha: string,
      horaInicio: string,
      duracionMin: number,
      ubicacion: string,
      latitud: number,
      longitud: number,
      extra: Record<string, unknown> = {},
      alternativaDeId?: string,
    ) =>
      tx.propuesta.create({
        data: {
          ...base,
          autorId,
          tipo: 'ACTIVIDAD',
          descripcion: titulo,
          ubicacion,
          latitud,
          longitud,
          ...extra,
          actividad: {
            create: {
              titulo,
              fecha: dia(fecha),
              horaInicio: hora(horaInicio),
              duracionMin,
              ...(alternativaDeId ? { alternativaDeId } : {}),
            },
          },
        },
      });

    await actividad(
      ana.id,
      'Esquí en el Cerro Catedral',
      '2026-12-12',
      '09:00',
      480,
      'Cerro Catedral',
      -41.1667,
      -71.4389,
      resuelta('CONFIRMADA'),
    );
    await actividad(
      tomas.id,
      'Circuito Chico en bici',
      '2026-12-11',
      '15:00',
      180,
      'Km 18, Av. Bustillo',
      -41.0604,
      -71.5241,
      resuelta('CONFIRMADA'),
    );
    await actividad(
      sofia.id,
      'Visita a la fábrica de chocolate',
      '2026-12-13',
      '17:00',
      90,
      'Av. San Martín 400',
      -41.1344,
      -71.3048,
      resuelta('CANCELADA'),
    );
    const kayak = await actividad(
      luis.id,
      'Kayak en el lago Gutiérrez',
      '2026-12-14',
      '10:00',
      120,
      'Lago Gutiérrez',
      -41.1667,
      -71.4167,
      { precio: 3_000_000n },
    );
    await actividad(
      sofia.id,
      'Trekking al Cerro Campanario',
      '2026-12-14',
      '10:00',
      150,
      'Cerro Campanario',
      -41.0667,
      -71.4833,
      {},
      kayak.id,
    );
    await actividad(
      tomas.id,
      'Cabalgata en Colonia Suiza',
      '2026-12-14',
      '09:30',
      180,
      'Colonia Suiza',
      -41.0833,
      -71.5167,
      {},
      kayak.id,
    );

    // Votos sobre el kayak (pendiente).
    await tx.voto.createMany({
      data: [
        { propuestaId: kayak.id, usuarioId: luis.id, valor: 'A_FAVOR' },
        { propuestaId: kayak.id, usuarioId: ana.id, valor: 'A_FAVOR' },
        { propuestaId: kayak.id, usuarioId: sofia.id, valor: 'EN_CONTRA' },
      ],
    });

    // Chat.
    await tx.mensaje.createMany({
      data: [
        { ...base, autorId: ana.id, contenido: '¡Ya confirmé el hostel!' },
        { ...base, autorId: tomas.id, contenido: 'Genial. ¿Quién se anota al kayak?' },
      ],
    });

    const categoria = async (codigo: string) =>
      (await tx.categoriaGasto.findUniqueOrThrow({ where: { codigo } })).id;

    // Gasto 1: Tomás paga el supermercado, $12.000,00 en partes iguales entre los cuatro.
    // Cada parte es $3.000,00; Ana, Luis y Sofía quedan debiéndole $3.000,00 a Tomás.
    await tx.gasto.create({
      data: {
        ...base,
        pagadoPorId: tomas.id,
        registradoPorId: tomas.id,
        categoriaId: await categoria('COMIDA'),
        titulo: 'Supermercado',
        monto: 1_200_000n,
        modoDivision: 'IGUALES',
        partes: {
          create: [ana, tomas, luis, sofia].map((u) => ({ usuarioId: u.id, monto: 300_000n })),
        },
      },
    });

    // Gasto 2: Ana paga la nafta, $40.000,00 con división arbitraria:
    // Ana $10.000,00, Tomás $15.000,00 y Luis $15.000,00.
    // Tomás le debería $15.000,00 a Ana, pero Ana ya le debía $3.000,00 a Tomás: se compensan (P15)
    // y queda Tomás → Ana $12.000,00 y Ana → Tomás $0. Luis le debe $15.000,00 a Ana.
    await tx.gasto.create({
      data: {
        ...base,
        pagadoPorId: ana.id,
        registradoPorId: ana.id,
        categoriaId: await categoria('TRANSPORTE'),
        titulo: 'Nafta ida y vuelta',
        monto: 4_000_000n,
        modoDivision: 'ARBITRARIA',
        partes: {
          create: [
            { usuarioId: ana.id, monto: 1_000_000n },
            { usuarioId: tomas.id, monto: 1_500_000n },
            { usuarioId: luis.id, monto: 1_500_000n },
          ],
        },
      },
    });

    const deuda = (deudorId: string, acreedorId: string, monto: bigint) =>
      tx.deuda.create({ data: { ...base, deudorId, acreedorId, monto } });

    await deuda(ana.id, tomas.id, 0n);
    const luisATomas = await deuda(luis.id, tomas.id, 200_000n); // $3.000,00 − pago de $1.000,00
    await deuda(sofia.id, tomas.id, 300_000n);
    await deuda(tomas.id, ana.id, 1_200_000n);
    await deuda(luis.id, ana.id, 1_500_000n);

    // Pago: Luis le paga $1.000,00 a Tomás.
    await tx.pago.create({
      data: { deudaId: luisATomas.id, registradoPorId: luis.id, monto: 100_000n },
    });
  });
}

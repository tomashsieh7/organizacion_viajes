import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app.js';
import { vaciarBase } from '../soporte/baseDePrueba.js';
import { cliente, crearApiDePrueba, ORIGEN, registrar } from '../soporte/apiDePrueba.js';

const { contenedor } = crearApiDePrueba();
let app = crearApp(contenedor);
afterAll(() => contenedor.prisma.$disconnect());

beforeEach(async () => {
  await vaciarBase(contenedor.prisma);
  app = crearApp(contenedor); // app nueva: los contadores de intentos vuelven a cero
});

const credenciales = { email: 'ana@mail.com', password: 'una-clave-segura' };

describe('Autenticación (sección 5.2)', () => {
  it('registro: 201, perfil y cookie de sesión httpOnly y SameSite=Lax', async () => {
    const r = await cliente(app).post('/api/auth/registro', {
      ...credenciales,
      nombre: 'Ana',
      apodo: 'Ani',
    });
    expect(r.status).toBe(201);
    expect(r.body.usuario).toMatchObject({ nombre: 'Ana', apodo: 'Ani' });
    const cookie = String(r.headers['set-cookie']);
    expect(cookie).toMatch(/^sesion=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).not.toMatch(/Secure/);
  });

  it('en producción la cookie además es Secure', async () => {
    const prod = crearApiDePrueba({ NODE_ENV: 'production' });
    const r = await cliente(prod.app).post('/api/auth/registro', {
      ...credenciales,
      nombre: 'Ana',
    });
    expect(String(r.headers['set-cookie'])).toMatch(/Secure/);
    await prod.contenedor.prisma.$disconnect();
  });

  it('registro: valida datos, rechaza contraseñas comunes y emails repetidos', async () => {
    const c = cliente(app);
    const corta = await c.post('/api/auth/registro', {
      email: 'a@b.com',
      password: '1234567',
      nombre: 'A',
    });
    expect(corta.status).toBe(400);
    expect(corta.body.error.detalles).toEqual([expect.objectContaining({ campo: 'password' })]);
    const comun = await c.post('/api/auth/registro', {
      email: 'a@b.com',
      password: 'contraseña',
      nombre: 'A',
    });
    expect(comun.body.error.codigo).toBe('CONTRASENA_COMUN');
    await registrar(app, 'Ana', 'ana@mail.com');
    const repetido = await c.post('/api/auth/registro', {
      ...credenciales,
      email: ' ANA@mail.com',
      nombre: 'Otra',
    });
    expect(repetido.status).toBe(409);
    expect(repetido.body.error.codigo).toBe('EMAIL_EN_USO');
  });

  it('registro: el email tiene hasta 254 caracteres', async () => {
    const conLargo = (n: number) => ({
      email: `${'a'.repeat(n - '@mail.com'.length)}@mail.com`,
      password: credenciales.password,
      nombre: 'Ana',
    });
    expect((await cliente(app).post('/api/auth/registro', conLargo(254))).status).toBe(201);
    const largo = await cliente(app).post('/api/auth/registro', conLargo(3000));
    expect(largo.status).toBe(400);
    expect(largo.body.error.detalles).toEqual([
      { campo: 'email', mensaje: 'Puede tener hasta 254 caracteres' },
    ]);
  });

  it('RN-S7: nombre y apodo sin caracteres de control ni invisibles del todo', async () => {
    const registro = (extra: object, n: number) =>
      cliente(app).post('/api/auth/registro', {
        email: `n${n}@mail.com`,
        password: credenciales.password,
        nombre: 'Ana',
        ...extra,
      });
    const rechazados = [
      { nombre: 'Ana\u0000' },
      { nombre: 'Ana\nMaría' },
      { nombre: 'Ana\u202Eetsil' },
      { nombre: '\u200b\u200b' },
      { apodo: 'Ani\u0000' },
      { apodo: '\u200b' },
    ];
    for (const [i, extra] of rechazados.entries()) {
      const r = await registro(extra, i);
      expect(r.status, JSON.stringify(extra)).toBe(400);
      expect(r.body.error.codigo).toBe('VALIDACION');
    }
    const aceptado = await registro({ nombre: 'José 👩‍👩‍👧', apodo: 'Pepe' }, 99);
    expect(aceptado.status).toBe(201);
    expect(aceptado.body.usuario).toMatchObject({ nombre: 'José 👩‍👩‍👧', apodo: 'Pepe' });
  });

  it('GET /yo necesita sesión', async () => {
    const { c } = await registrar(app, 'Ana', 'ana@mail.com');
    expect((await c.get('/api/auth/yo')).body.usuario.nombre).toBe('Ana');
    const anonimo = await request(app).get('/api/auth/yo');
    expect(anonimo.status).toBe(401);
    expect(anonimo.body.error.codigo).toBe('NO_AUTENTICADO');
  });

  it('RN-S3: mismo mensaje con email existente e inexistente', async () => {
    await registrar(app, 'Ana', 'ana@mail.com');
    const c = cliente(app);
    const malaClave = await c.post('/api/auth/sesion', {
      email: 'ana@mail.com',
      password: 'otra-clave',
    });
    const sinCuenta = await c.post('/api/auth/sesion', {
      email: 'nadie@mail.com',
      password: 'otra-clave',
    });
    expect(malaClave.status).toBe(401);
    expect(sinCuenta.status).toBe(401);
    expect(sinCuenta.body).toEqual(malaClave.body);
    const bien = await c.post('/api/auth/sesion', { ...credenciales, email: 'ANA@MAIL.COM' });
    expect(bien.status).toBe(200);
  });

  it('RN-S4: tras 5 intentos fallidos con un email se bloquean nuevos intentos', async () => {
    await registrar(app, 'Ana', 'ana@mail.com');
    const c = cliente(app);
    for (let i = 0; i < 5; i++) {
      expect(
        (await c.post('/api/auth/sesion', { email: 'ana@mail.com', password: `mala-${i}` })).status,
      ).toBe(401);
    }
    const bloqueado = await c.post('/api/auth/sesion', credenciales);
    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body.error.codigo).toBe('DEMASIADOS_INTENTOS');
  });

  it('RN-S4: detrás del proxy de la web, el límite por IP cuenta por persona', async () => {
    await registrar(app, 'Olga', 'olga@mail.com');
    const desde = (ip: string, cuerpo: object) =>
      request(app)
        .post('/api/auth/sesion')
        .set('Origin', ORIGEN)
        .set('X-Forwarded-For', ip)
        .send(cuerpo);
    for (let i = 0; i < 5; i++) {
      const r = await desde('192.168.0.10', { email: `otro${i}@mail.com`, password: 'mala' });
      expect(r.status).toBe(401);
    }
    expect((await desde('192.168.0.10', credenciales)).status).toBe(429);
    const olga = await desde('192.168.0.11', {
      email: 'olga@mail.com',
      password: credenciales.password,
    });
    expect(olga.status).toBe(200);
  });

  it('RN-S4: solo se cree la dirección que informa un proxy de la misma máquina', () => {
    const confiable = app.get('trust proxy fn') as (direccion: string, salto: number) => boolean;
    expect(confiable('127.0.0.1', 0)).toBe(true);
    expect(confiable('::1', 0)).toBe(true);
    expect(confiable('192.168.0.10', 0)).toBe(false);
  });

  it('RN-S4: los intentos exitosos no cuentan para el límite', async () => {
    await registrar(app, 'Ana', 'ana@mail.com');
    const c = cliente(app);
    for (let i = 0; i < 6; i++)
      expect((await c.post('/api/auth/sesion', credenciales)).status).toBe(200);
  });

  it('RN-S5: cerrar sesión revoca el token aunque se lo vuelva a mandar', async () => {
    const { c } = await registrar(app, 'Ana', 'ana@mail.com');
    const cookie = (await c.post('/api/auth/sesion', credenciales)).headers['set-cookie']!;
    expect((await c.delete('/api/auth/sesion')).status).toBe(204);
    const reutilizada = await request(app).get('/api/auth/yo').set('Cookie', cookie);
    expect(reutilizada.status).toBe(401);
  });

  it('RN-S5: una cookie de sesión alterada se toma como sesión inexistente', async () => {
    const alterada = `sesion=${encodeURIComponent('j:{"a":1}')}`;
    const yo = await request(app).get('/api/auth/yo').set('Cookie', alterada);
    expect(yo.status).toBe(401);
    expect(yo.body.error.codigo).toBe('NO_AUTENTICADO');
    const cerrar = await request(app)
      .delete('/api/auth/sesion')
      .set('Origin', ORIGEN)
      .set('Cookie', alterada);
    expect(cerrar.status).toBe(204);
  });

  it('RN-S6: rechaza peticiones que modifican datos desde otro origen o sin Origin', async () => {
    const otro = await request(app)
      .post('/api/auth/registro')
      .set('Origin', 'https://malicioso.example')
      .send({ ...credenciales, nombre: 'A' });
    const sin = await request(app)
      .post('/api/auth/registro')
      .send({ ...credenciales, nombre: 'A' });
    for (const r of [otro, sin]) {
      expect(r.status).toBe(403);
      expect(r.body.error.codigo).toBe('ORIGEN_NO_PERMITIDO');
    }
    expect(
      (
        await request(app)
          .post('/api/auth/registro')
          .set('Origin', ORIGEN)
          .send({ ...credenciales, nombre: 'A' })
      ).status,
    ).toBe(201);
  });

  it('incluye los encabezados de seguridad de helmet', async () => {
    const r = await request(app).get('/api/salud');
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['x-powered-by']).toBeUndefined();
  });

  it('la contraseña se guarda con argon2id y nunca en claro', async () => {
    await registrar(app, 'Ana', 'ana@mail.com');
    const c = await contenedor.prisma.credencial.findFirstOrThrow();
    expect(c.secretoHash).toMatch(/^\$argon2id\$/);
    expect(c.secretoHash).not.toContain('una-clave-segura');
    const s = await contenedor.prisma.sesion.findFirstOrThrow();
    expect(s.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });
});

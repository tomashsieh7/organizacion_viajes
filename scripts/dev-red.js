// `npm run dev:red`: levanta la app para probarla desde otro dispositivo de la misma red, por
// ejemplo el celular. Busca la IP de la compu, la usa como origen permitido de la API
// (ORIGEN_WEB) y le pide a Vite que atienda a la red (WEB_EN_RED).
import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';

/** La IPv4 de la red local, sin las interfaces virtuales de Docker, WSL o máquinas virtuales. */
function ipLocal() {
  return Object.entries(networkInterfaces())
    .filter(([nombre]) => !/^(docker|br-|veth|virbr|vEthernet|lo)/i.test(nombre))
    .flatMap(([, direcciones]) => direcciones ?? [])
    .find((d) => d.family === 'IPv4' && !d.internal)?.address;
}

const ip = process.env.IP_RED ?? ipLocal();
if (!ip) {
  console.error(
    'No se encontró la IP de la red local. Indicala así: IP_RED=192.168.0.10 npm run dev:red',
  );
  process.exit(1);
}
const origen = `http://${ip}:5173`;
console.log(`\nAbrí ${origen} desde el celular u otro dispositivo conectado al mismo wifi.\n`);

const dev = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, ORIGEN_WEB: origen, WEB_EN_RED: '1' },
});
dev.on('exit', (codigo) => process.exit(codigo ?? 0));

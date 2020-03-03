import { spawn } from 'child_process';

import generateData from './server/src/datagenerator';

function log(namespace: string, data: string): void {
  // eslint-disable-next-line
  console.log(`[${namespace}]`, `${data}`);
}

function logError(namespace: string, data: string): void {
  // eslint-disable-next-line
  console.error(`[${namespace}]`, '\x1b[31m', `${data}`, '\x1b[0m');
}

function startClient(): void {
  const yarn = spawn('yarn', ['client']);
  yarn.stdout.on('data', data => {
    log('client', data);
  });
  yarn.stderr.on('data', data => {
    logError('client', data);
  });
}

async function startServer(): Promise<void> {
  log('server', 'Starting node server...');
  try {
    const yarn = spawn('yarn', ['server']);
    yarn.stdout.on('data', data => {
      log('server', data);
    });
    yarn.stderr.on('data', data => {
      logError('server', data);
    });
    startClient();
  } catch (e) {
    // eslint-disable-next-line
    console.error('Starting node server failed.', e);
  }
}

(async function startDataGenerator(): Promise<void> {
  log('data', 'Starting data generation...');
  try {
    generateData();
  } catch (e) {
    logError('data', `is ksql running? ${e.code}`);
  }
  await startServer();
})();

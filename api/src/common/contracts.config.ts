import * as fs from 'node:fs';
import * as path from 'node:path';

export type DeploymentConfig = {
  network: string;
  registry: `0x${string}`;
  badge: `0x${string}`;
  equalityThresholdBps: number;
  methodologyId: `0x${string}`;
};

export function loadLocalDeploymentConfig(): DeploymentConfig {
  const filePath = path.join(
    process.cwd(),
    '..',
    'contracts',
    'deployments',
    'localhost.json',
  );

  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as DeploymentConfig;
}

import Ajv from 'ajv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import addFormats from 'ajv-formats';
import type { AnySchema } from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const schemaPath = path.join(
  process.cwd(),
  'src',
  'schemas',
  'report.schema.json',
);
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')) as AnySchema;

const validate = ajv.compile(schema);

export function validateReportOrThrow(report: unknown): void {
  const ok = validate(report);
  if (!ok) {
    const errors = (validate.errors ?? [])
      .map((e) => `${e.instancePath} ${e.message}`)
      .join('; ');
    throw new Error(`Report schema validation failed: ${errors}`);
  }
}

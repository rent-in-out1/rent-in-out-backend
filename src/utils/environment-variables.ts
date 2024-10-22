import path from 'path';
import { expand } from 'dotenv-expand';
import { config } from 'dotenv';

const configPath = path.resolve(__dirname, '../../env/', `.env.${process.env.NODE_ENV ?? 'development'}`);

expand(config({ path: configPath })); // take the env from .env.local as default

export const PORT: number = +(process.env.PORT ?? 3001);

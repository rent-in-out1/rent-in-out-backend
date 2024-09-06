import path from 'path';
import { expand } from 'dotenv-expand';
import { config } from 'dotenv';

// TODO - complete it later will support env.local/production/test
const configPath = path.resolve(__dirname, '../..', `.env.${process.env.NODE_ENV ?? 'development'}`);

expand(config({ path: configPath })); // take the env from .env.local as default

export const PORT: number = +(process.env.PORT ?? 3001);
// export const MONGO_URL: string;

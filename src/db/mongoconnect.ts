import mongoose from 'mongoose';
import { envConfig } from '../config/config-env';

main()
	.then(() => {
		const workSpace = envConfig.nodeEnv ?? 'development';
		console.log(`[${new Date().toISOString()}] [INFO]: MongoDB connected successfully in '${workSpace}' mode.`);
	})
	.catch((err) => {
		console.error(`[${new Date().toISOString()}] [ERROR]: Failed to connect to MongoDB: ${err.message}`);
	});

async function main() {
	try {
		console.log(`[${new Date().toISOString()}] [INFO]: Attempting to connect to MongoDB...`);
		await mongoose.connect(envConfig.mongoUrl);
	} catch (err) {
		throw err;
	}
}

import mongoose from 'mongoose';

main().catch((err) => console.error('It looks like the .env file is missing.'));

async function main() {
	const workSpace = process.env.NODE_ENV ?? 'development';
	console.log(workSpace, process.env.MONGO_URL);

	await mongoose.connect(process.env.MONGO_URL);
	console.log(`[${new Date().toISOString()}] [INFO]: MongoDB connected successfully in '${workSpace}' mode.`);
}

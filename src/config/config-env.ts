import dotenv from 'dotenv';
dotenv.config();

export const envConfig = {
	userDb: process.env.USER_DB,
	passDb: process.env.PASS_DB,
	tokenSecret: process.env.TOKEN_SECRET,
	refreshToken: process.env.REFRESH_TOKEN_SECRET,
	mongoUrl: process.env.MONGO_URL,
	nodeEnv: process.env.NODE_ENV,
	superID: process.env.ADMIN_ID,
	google_api: process.env.GOOGLE_API,
	domain: process.env.DOMAIN,
	domain_client: process.env.DOMAIN_CLIENT,
	gmailUser: process.env.AUTH_EMAIL,
	gmailPass: process.env.AUTH_PASS,
	google_client_id: process.env.GOOGLE_CLIENT_ID,
	google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
	// cloudinary
	cloudinary_name: process.env.CLOUDINARY_NAME,
	cloudinary_key: process.env.CLOUDINARY_KEY,
	cloudinary_secret: process.env.CLOUDINARY_SECRET,
};

import session from 'express-session';

export const sessionConfig = session({
	secret: 'cats',
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: false, // Set to true if you're using HTTPS
		maxAge: 1000 * 60 * 60 * 24, // 1 day expiration for the session cookie
	},
});

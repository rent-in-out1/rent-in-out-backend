import jwt from 'jsonwebtoken';
import { envConfig } from '../config/config-env';
import { NextFunction, Request, Response } from 'express';
import { ITokenDataModel } from '../@types/global.types';

export const auth = (req: Request, res: Response, next: NextFunction) => {
	let token = req.header('x-api-key');
	if (!token) {
		return res.status(401).json({ msg: 'please send token this end point url ' });
	}
	try {
		let tokenData = jwt.verify(token, envConfig.tokenSecret) as ITokenDataModel;
		req.tokenData = tokenData;
		next();
	} catch (err) {
		return res.status(401).json({ msg: 'token not valid/expired' });
	}
};

export const authAdmin = (req: Request, res: Response, next: NextFunction) => {
	let token = req.header('x-api-key');
	if (!token) {
		return res.status(401).json({ msg: 'You need to send token to this endpoint url' });
	}
	try {
		let decodeToken = jwt.verify(token, envConfig.tokenSecret) as ITokenDataModel;
		if (decodeToken.role !== 'admin') {
			return res.status(401).json({ msg: 'Token is not admin' });
		}
		req.tokenData = decodeToken;

		next();
	} catch (err) {
		console.error(err);
		return res.status(401).json({ msg: 'Token invalid or expired, log in again or you hacker!' });
	}
};

import { NextFunction, Request, Response } from 'express';
import { validateCategory } from '../validations/categoryValid';
import { AppError } from '../error/appError';
import CommonResponseDict from '../utils/common-response-dict.utils';

export const categoryControl = (req: Request, res: Response, next: NextFunction): void => {
	const { error } = validateCategory(req.body);
	if (error) {
		next(
			new AppError(
				CommonResponseDict.BadRequest.title,
				CommonResponseDict.BadRequest.code,
				error.details[0].message,
				true
			)
		);
	} else {
		next();
	}
};

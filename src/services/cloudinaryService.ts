import { NextFunction, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfig } from '../utils/cloudinary-utils';
import { AppError } from '../error/appError';
import CommonResponseDict from '../utils/common-response-dict.utils';

export interface ICloudinaryResultModel {
	result: string;
}
export interface ICloudinaryErrorModel {
	message: string;
	name: string;
	http_code: number;
}

export const deleteImageCloudinary = (req: Request, res: Response, next: NextFunction) => {
	const { img_id } = req.body;
	try {
		cloudinary.config(cloudinaryConfig);
		cloudinary.uploader.destroy(img_id, (error: ICloudinaryErrorModel, result: ICloudinaryResultModel) => {
			if (error) {
				return next(
					new AppError(CommonResponseDict.BadRequest.title, CommonResponseDict.BadRequest.code, 'BadRequest', false)
				);
			}
			res.status(201).send(result);
		});
	} catch (error) {
		next(
			new AppError(
				CommonResponseDict.InternalServerError.title,
				CommonResponseDict.InternalServerError.code,
				`Couldn't find resource with id - ${img_id}`,
				false
			)
		);
	}
};

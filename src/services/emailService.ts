import { NextFunction, Request, Response } from 'express';
import { createEmailOptions, transporter } from '../config/mail.config';
import { AppError } from '../error/appError';
import CommonResponseDict from '../utils/common-response-dict.utils';

export const sendEmail = (req: Request, res: Response, next: NextFunction) => {
	// TODO - add controller to make sure user send you the params/query/body
	const { phone, firstName, lastName, email, textarea } = req.body;
	let subject = 'mail send from ' + phone;
	let htmlMessage = `<div color:danger> <h2>${firstName} - ${lastName}</h2> <span>${phone}</span> | <span>${email}</span> <p>${textarea}</p> </div>`;
	const emailOptions = createEmailOptions(subject, htmlMessage);
	try {
		transporter.sendMail(emailOptions, () => {
			res.status(201).json({
				status: 201,
				message: 'The message was sent successfully.',
			});
			return;
		});
	} catch (err) {
		next(
			new AppError(
				CommonResponseDict.InternalServerError.title,
				CommonResponseDict.InternalServerError.code,
				'There was an error, please try again later',
				false
			)
		);
	}
};

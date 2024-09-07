import { NextFunction, Request, Response } from 'express';
import { createEmailOptions, transporter } from '../config/mail.config';

export const sendEmail = (req: Request, res: Response, _next: NextFunction) => {
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
		return res.status(500).json({ err: 'An unexpected error occurred.' });
	}
};

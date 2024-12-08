import bcrypt from 'bcrypt';
import { UserModel } from '../models/userModel';
import { sendResetEmail, sendVerificationEmail, createToken } from '../utils/user-utils';
import { UserVerificationModel } from '../models/userVerificationModel';
import path from 'path';
import { PasswordReset } from '../models/passwordReset';
import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import { IUserVerification } from '../interfaces/userVerification.interface';
import { AppError } from '../error/appError';
import CommonResponseDict, { HttpCode } from '../utils/common-response-dict.utils';

dotenv.config();
const saltRounds = 10;

export const signUp = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const user = new UserModel(req.body);
		user.password = await bcrypt.hash(user.password, saltRounds);
		user.email = user.email.toLowerCase();
		await user.save();
		user.password = '********';

		sendVerificationEmail(user, res);
		return res.status(201).json({
			msg: `New user ${user.fullName.firstName} ${user.fullName.lastName} created!`,
		});
	} catch (err: unknown) {
		if (err instanceof Error && (err as any).code === 11000) {
			return next(
				new AppError('Duplicate Field', HttpCode.DuplicateField, 'Email already in system, try logging in', true)
			);
		}
		console.error(err);
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

export const login = async (req: Request, res: Response, next: NextFunction) => {
	// TODO - make sure that the return next() is the best option for handling middlewares
	try {
		const user = await UserModel.findOne({ email: req.body.email.toLowerCase() });
		if (!user) {
			return next(
				new AppError(
					CommonResponseDict.Unauthorized.title,
					CommonResponseDict.Unauthorized.code,
					`User not found`,
					true
				)
			);
		}
		const validPass = await bcrypt.compare(req.body.password, user.password);
		if (!validPass) {
			return next(
				new AppError(
					CommonResponseDict.Unauthorized.title,
					CommonResponseDict.Unauthorized.code,
					'Invalid password',
					true
				)
			);
		}

		if (!user.active) {
			return next(
				new AppError(
					CommonResponseDict.Unauthorized.title,
					CommonResponseDict.Unauthorized.code,
					'User blocked or needs to verify email',
					true
				)
			);
		}
		const newAccessToken = createToken(user._id, user.role);
		return res.json({ token: newAccessToken, user });
	} catch (err) {
		next(
			new AppError(
				CommonResponseDict.InternalServerError.title,
				CommonResponseDict.InternalServerError.code,
				'There was an error signing in',
				false
			)
		);
	}
};

export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
	// TODO - add controller to make sure user send you the params/query/body
	// TODO - check with shay if to send an new AppError after redirect

	const { userId, uniqueString } = req.params;
	let message: string;
	try {
		const user = (await UserVerificationModel.findOne({ userId })) as IUserVerification;
		if (user) {
			if (user.expiresAt < Date.now() + 2 * 60 * 60 * 1000) {
				await UserVerificationModel.deleteOne({ userId });
				await UserModel.deleteOne({ _id: userId });
				message = 'Link has expired. Please sign up again.';
				return res.redirect(`/users/verified/?error=true&message=${message}`);
			} else {
				const result = await bcrypt.compare(uniqueString, user.uniqueString);
				if (result) {
					const update = await UserModel.updateOne({ _id: userId }, { active: true });
					if (update) {
						await UserVerificationModel.deleteOne({ userId });
						message = 'user verified successfully';
						return res.redirect(`/users/verified/?error=false&message=${message}`);
					} else {
						message = 'An error occurred while updating user verification status.';
						return next(
							new AppError(
								CommonResponseDict.Unauthorized.title,
								CommonResponseDict.Unauthorized.code,
								`/users/verified/?error=true&message=${message}`,
								true
							)
						);
					}
				} else {
					await UserVerificationModel.deleteOne({ userId });
					await UserModel.deleteOne({ _id: userId });
					message = 'Invalid verification details passed. Check your inbox.';
					return res.redirect(`/users/verified/?error=true&message=${message}`);
				}
			}
		} else {
			message = 'Account does not exist or has been verified already. Please sign up or log in.';
			return res.redirect(`/users/verified/?error=true&message=${message}`);
		}
	} catch (error) {
		await UserVerificationModel.deleteOne({ uniqueString });
		message = 'An error occurred while checking for existing user verification record.';
		return res.redirect(`/users/verified/?error=true&message=${message}`);
	}
};

export const verifiedUser = (req: Request, res: Response, _next: NextFunction) => {
	// TODO - error=true&message=${message}
	// should handle if error is false/true
	return res.sendFile(path.join(__dirname, '../views/verified.html'));
};

export const requestPasswordReset = (req: Request, res: Response, next: NextFunction) => {
	// TODO - add controller to make sure user send you the params/query/body
	const { email, redirectUrl } = req.body;
	UserModel.findOne({ email }).then((data) => {
		if (data) {
			if (!data.active) {
				return next(
					new AppError(
						CommonResponseDict.Forbidden.title,
						CommonResponseDict.Forbidden.code,
						"Email isn't verified yet or account has been suspended, please check your email",
						true
					)
				);
			} else {
				sendResetEmail(data, redirectUrl, res);
			}
		} else {
			return next(
				new AppError(
					CommonResponseDict.ResourceNotFound.title,
					CommonResponseDict.ResourceNotFound.code,
					'No account with the supplied email found. Please try again.',
					true
				)
			);
		}
	});
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
	// TODO - add controller to make sure user send you the params/query/body
	const { userId, resetString, newPassword } = req.body;
	try {
		const result = await PasswordReset.findOne({ userId });
		if (result) {
			if (result.expiresAt < Date.now() + 2 * 60 * 60 * 1000) {
				await PasswordReset.deleteOne({ userId });
				return res.status(403).json({ msg: 'Password reset link has expired' });
			} else {
				const validReset = await bcrypt.compare(resetString, result.resetString as string);
				if (validReset) {
					const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
					const update = await UserModel.updateOne(
						{ _id: userId },
						{ password: hashedNewPassword, updatedAt: new Date(Date.now() + 2 * 60 * 60 * 1000) }
					);
					if (update) {
						await PasswordReset.deleteOne({ userId });
						return res.status(200).json({ status: 'Success', msg: 'Password reset successfully' });
					} else {
						return next(
							new AppError(
								CommonResponseDict.BadRequest.title,
								CommonResponseDict.BadRequest.code,
								'Failed to update user password',
								true
							)
						);
					}
				} else {
					return next(
						new AppError(
							CommonResponseDict.Unauthorized.title,
							CommonResponseDict.Unauthorized.code,
							'Invalid password reset details',
							true
						)
					);
				}
			}
		} else {
			return next(
				new AppError(
					CommonResponseDict.Unauthorized.title,
					CommonResponseDict.Unauthorized.code,
					'Password reset request not found',
					true
				)
			);
		}
	} catch (error) {
		next(
			new AppError(
				CommonResponseDict.InternalServerError.title,
				CommonResponseDict.InternalServerError.code,
				'Error occurred while checking for existing password record',
				false
			)
		);
	}
};

import bcrypt from 'bcrypt';
import { UserModel } from '../models/userModel';
import { sendResetEmail, sendVerificationEmail, createToken } from '../utils/user-utils';
import { UserVerificationModel } from '../models/userVerificationModel';
import path from 'path';
import { PasswordReset } from '../models/passwordReset';
import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import { IUserVerification } from '../interfaces/userVerification.interface';

dotenv.config();
const saltRounds = 10;

export const signUp = async (req: Request, res: Response, _next: NextFunction) => {
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
			return res.status(409).json({ msg: 'Email already in system, try logging in', code: 11000 });
		}
		console.error(err);
		return res.status(500).json({ msg: 'Error occurred', err });
	}
};

export const login = async (req: Request, res: Response, _next: NextFunction) => {
	try {
		const user = await UserModel.findOne({ email: req.body.email.toLowerCase() });
		if (!user) {
			return res.status(401).json({ msg: 'User not found' });
		}
		const validPass = await bcrypt.compare(req.body.password, user.password);
		if (!validPass) {
			return res.status(401).json({ msg: 'Invalid password' });
		}

		if (!user.active) {
			return res.status(401).json({ msg: 'User blocked or needs to verify email' });
		}
		const newAccessToken = createToken(user._id, user.role);
		return res.json({ token: newAccessToken, user });
	} catch (err) {
		return res.status(500).json({ msg: 'There was an error signing in' });
	}
};

export const verifyUser = async (req: Request, res: Response, _next: NextFunction) => {
	// TODO - add controller to make sure user send you the params/query/body
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
						return res.status(401).json({ msg: `/users/verified/?error=true&message=${message}` });
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

export const requestPasswordReset = (req: Request, res: Response, _next: NextFunction) => {
	// TODO - add controller to make sure user send you the params/query/body
	const { email, redirectUrl } = req.body;
	UserModel.findOne({ email }).then((data) => {
		if (data) {
			if (!data.active) {
				return res.status(403).json({
					status: 'failed',
					message: "Email isn't verified yet or account has been suspended, please check your email",
				});
			} else {
				sendResetEmail(data, redirectUrl, res);
			}
		} else {
			return res
				.status(404)
				.json({ status: 'failed', message: 'No account with the supplied email found. Please try again.' });
		}
	});
};

export const resetPassword = async (req: Request, res: Response, _next: NextFunction) => {
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
						return res.status(400).json({ msg: 'Failed to update user password' });
					}
				} else {
					return res.status(401).json({ msg: 'Invalid password reset details' });
				}
			}
		} else {
			return res.status(401).json({ msg: 'Password reset request not found' });
		}
	} catch (error) {
		return res.status(500).json({ msg: 'Error occurred while checking for existing password record', error });
	}
};

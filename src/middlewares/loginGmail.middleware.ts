import { NextFunction, Request, Response } from 'express';
import { UserModel } from '../models/userModel';
import { createToken, getUserDetailFromAccessToken } from '../utils/user-utils';

export const loginGmail = async (req: Request, res: Response, next: NextFunction) => {
	let google_email;
	if (req.body.token) {
		try {
			const google_token = req.body.token;
			// try to recieve google email from token
			if (google_token) {
				try {
					const response = await getUserDetailFromAccessToken(google_token);
					google_email = response.data?.email;
				} catch (err) {
					return res.status(500).json({ msg: "Couldn't login google", err });
				}
			}
			const user = await UserModel.findOne({
				email: google_email,
			});
			if (!user) return res.status(404).json({ msg: 'User not found' });
			const { active } = user;
			if (!active) return res.status(401).json({ msg: 'User blocked / need to verify your email' });

			let newAccessToken = createToken(user._id, user.role);
			return res.status(200).json({ token: newAccessToken, user });
		} catch (err) {
			return res.status(500).json({ msg: 'There was an error signing' });
		}
	} else {
		next();
	}
};

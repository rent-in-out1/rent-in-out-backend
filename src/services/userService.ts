import { UserModel } from '../models/userModel';
import { envConfig } from '../config/config-env';
import { createToken } from '../utils/user-utils';
import { NextFunction, Request, Response } from 'express';
import { SortOrder } from 'mongoose';
import { Cloudinary } from '../interfaces/userInterface.interface';
import { selectFieldsPopulate } from '../config/populat.config';
import CommonResponseDict from '../utils/common-response-dict.utils';
import { AppError } from '../error/appError';

export const checkToken = (req: Request, res: Response, next: NextFunction) => {
	return res.json(req.tokenData);
};

export const getUserInfoById = async (req: Request, res: Response, next: NextFunction) => {
	// TODO - add controller to make sure user send you the params/query/body
	try {
		const userID = req.params.userID;
		const userInfo = await UserModel.findOne({ _id: userID }, { password: 0 }).populate({
			path: 'wishList',
			populate: { path: 'creator_id', select: selectFieldsPopulate },
		});
		if (!userInfo) {
			return next(
				new AppError(
					CommonResponseDict.ResourceNotFound.title,
					CommonResponseDict.ResourceNotFound.code,
					'User not found',
					true
				)
			);
		}
		return res.status(200).json({ userInfo });
	} catch (err) {
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

export const getUserInfoByIdWithToken = async (req: Request, res: Response, next: NextFunction) => {
	// TODO - add controller to make sure user send you the params/query/body
	try {
		const userID = req.params.userID;
		const userInfo = await UserModel.findOne({ _id: userID }, { password: 0 }).populate({
			path: 'wishList',
			populate: { path: 'creator_id', select: selectFieldsPopulate },
		});
		if (!userInfo) {
			return next(
				new AppError(
					CommonResponseDict.ResourceNotFound.title,
					CommonResponseDict.ResourceNotFound.code,
					'User not found',
					true
				)
			);
		}
		const newAccessToken = await createToken(userInfo._id, userInfo.role);
		return res.status(200).json({ userInfo, newAccessToken });
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

export const getUsersList = async (req: Request, res: Response, next: NextFunction) => {
	const perPage = Math.min(Number(req.query.perPage) || 10, 20);
	const page = Number(req.query.page) || 1;
	const sort = (req.query.sort as string) || 'role';
	const reverse: SortOrder = req.query.reverse === 'yes' ? -1 : 1;
	try {
		const data = await UserModel.find({ _id: { $ne: envConfig.superID } }, { password: 0 })
			.limit(perPage)
			.skip((page - 1) * perPage)
			.sort([[sort, reverse]]);
		return res.json(data);
	} catch (err) {
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

export const countUsers = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const count = await UserModel.countDocuments({});
		return res.status(200).json({ count });
	} catch (err) {
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

export const changeUserRole = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userID = req.params.userID;
		const user = await UserModel.findOne({ _id: userID }).populate({
			path: 'wishList',
			populate: { path: 'creator_id', select: selectFieldsPopulate },
		});
		user.role = user.role === 'admin' ? 'user' : 'admin';
		user.updatedAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
		await user.save();
		return res.status(200).json(user);
	} catch (err) {
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

export const changeUserActiveStatus = async (req: Request, res: Response, next: NextFunction) => {
	// TODO - add controller to make sure user send you the params/query/body
	try {
		const userID = req.params.userID;
		const user = await UserModel.findOne({ _id: userID }).populate({
			path: 'wishList',
			populate: { path: 'creator_id', select: selectFieldsPopulate },
		});
		user.active = !user.active;
		user.updatedAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
		await user.save();
		return res.status(200).json(user);
	} catch (err) {
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

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
	// TODO - add controller to make sure user send you the params/query/body
	try {
		const userID = req.params.userID;
		let userInfo;

		if (req.tokenData.role === 'admin') {
			userInfo = await UserModel.deleteOne({ _id: userID }, { password: 0 });
		} else if (req.tokenData._id === userID) {
			userInfo = await UserModel.deleteOne({ _id: req.tokenData._id }, { password: 0 });
		} else {
			return next(
				new AppError(CommonResponseDict.Unauthorized.title, CommonResponseDict.Unauthorized.code, 'Not allowed', true)
			);
		}
		return res.status(201).json(userInfo);
	} catch (err) {
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

export const editUser = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userID = req.params.userID;
		if (req.body.email || req.body.password) {
			return new AppError(
				CommonResponseDict.Unauthorized.title,
				CommonResponseDict.Unauthorized.code,
				'Email/password change is not allowed',
				true
			);
		}
		let user;
		if (req.tokenData.role === 'admin') {
			user = await UserModel.updateOne({ _id: userID }, req.body);
		} else if (userID !== req.tokenData._id) {
			return next(
				new AppError(CommonResponseDict.Unauthorized.title, CommonResponseDict.Unauthorized.code, 'Not allowed', true)
			);
		} else {
			user = await UserModel.updateOne({ _id: userID }, req.body);
		}
		return res.status(200).json(user);
	} catch (err) {
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

export const rankUser = async (req: Request, res: Response, next: NextFunction) => {
	// TODO - add controller to make sure user send you the params/query/body
	const rankedUserId = req.params.userID;
	const rnk = req.body.rnk;
	if (rnk > 5) {
		return next(
			new AppError(
				CommonResponseDict.Unauthorized.title,
				CommonResponseDict.Unauthorized.code,
				'Cannot rank more than 5',
				true
			)
		);
	}
	if (rankedUserId === req.tokenData._id) {
		return next(
			new AppError(
				CommonResponseDict.Unauthorized.title,
				CommonResponseDict.Unauthorized.code,
				"You can't rank yourself",
				true
			)
		);
	}
	try {
		const user = await UserModel.findOne({
			$and: [{ _id: rankedUserId }, { _id: { $ne: req.tokenData._id } }],
		});
		const found = user.rank.some((el) => el.user_id === req.tokenData._id);
		if (!found) {
			user.rank.push({ user_id: req.tokenData._id as string, rank: rnk });
			await user.save();
			return res.status(200).json({ msg: 'Rank succeeded' });
		} else {
			user.rank.map((el) => {
				if (el.user_id === req.tokenData._id) {
					el.rank = rnk;
				}
			});
			await user.save();
			return res.status(200).json({ msg: 'Rank override succeeded' });
		}
	} catch (err) {
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

export const getUserAvgRank = async (req: Request, res: Response, next: NextFunction) => {
	// TODO - add controller to make sure user send you the params/query/body
	const rankedUserId = req.params.userID;
	const rankingUser = req.query?.rankingUser as string;
	try {
		const user = await UserModel.findOne({ _id: rankedUserId }).limit(1);
		const userRanked = user.rank.find((el) => el.user_id === rankingUser);

		if (userRanked) {
			user.rank[0].rank = userRanked.rank;
		}
		const ranks = user.rank.map((el) => el.rank);
		const average = ranks.reduce((a, b) => a + b, 0) / ranks.length;
		return res.status(200).json({ average, userRank: user.rank[0].rank });
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

export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
	// TODO - add controller to make sure user send you the params/query/body
	const perPage = Math.min(Number(req.query.perPage) || 10, 20);
	const page = Number(req.query.page) || 1;
	const sort = (req.query.sort as string) || 'role';
	const reverse: SortOrder = req.query.reverse === 'yes' ? -1 : 1;
	try {
		const searchQ = req.query?.s as string;
		const searchReg = new RegExp(searchQ, 'i');
		const users = await UserModel.find(
			{
				$and: [
					{ _id: { $ne: envConfig.superID } },
					{
						$or: [
							{ 'fullName.firstName': searchReg },
							{ 'fullName.lastName': searchReg },
							{ email: searchReg },
							{ phone: searchReg },
						],
					},
				],
			},
			{ password: 0 }
		)
			.limit(perPage)
			.skip((page - 1) * perPage)
			.sort([[sort, reverse]]);
		return res.json(users);
	} catch (err) {
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

export const uploadProfileImg = async (req: Request, res: Response, next: NextFunction) => {
	// TODO - add controller to make sure user send you the params/query/body
	const image: Cloudinary = req.body as Cloudinary;

	if (image) {
		try {
			const user = await UserModel.findOne({ _id: req.tokenData._id });
			user.profile_img = image;
			await user.save();
			return res.status(200).json({ res: 'Profile image has been changed' });
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
	} else {
		return next(
			new AppError(
				CommonResponseDict.ResourceNotFound.title,
				CommonResponseDict.ResourceNotFound.code,
				'Must send an image',
				true
			)
		);
	}
};

export const uploadBannerImg = async (req: Request, res: Response, next: NextFunction) => {
	// TODO - add controller to make sure user send you the params/query/body
	const banner: Cloudinary = req.body as Cloudinary;

	if (banner) {
		try {
			const user = await UserModel.findOne({ _id: req.tokenData._id });
			user.cover_img = banner;
			await user.save();
			return res.status(200).json({ res: 'Banner image has been changed' });
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
	} else {
		return next(
			new AppError(
				CommonResponseDict.Unauthorized.title,
				CommonResponseDict.Unauthorized.code,
				'Must send a banner',
				true
			)
		);
	}
};

export const getWishListOfUser = async (req: Request, res: Response, next: NextFunction) => {
	const user: any = await UserModel.findOne({ _id: req.tokenData._id })
		.populate({
			path: 'wishList',
			populate: { path: 'creator_id', select: selectFieldsPopulate },
		})
		.populate({
			path: 'wishList',
			populate: { path: 'likes', select: selectFieldsPopulate },
		});
	try {
		const wishList = user.wishList.sort((a, b) => {
			const keyA = new Date(a.updatedAt);
			const keyB = new Date(b.updatedAt);
			return keyA > keyB ? -1 : keyA < keyB ? 1 : 0;
		});
		return res.status(200).json(wishList);
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

export const getUsersCountByDate = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const data = await UserModel.find({ _id: { $ne: envConfig.superID } }, { password: 0 });
		const usersCreatedDates = data.map((user) => user.createdAt);
		const sortedUsersCreatedDates = usersCreatedDates.sort();

		const now = Date.now();
		const threeYearsAgo = now - 3 * 365 * 24 * 60 * 60 * 1000; // 3 years in milliseconds
		const halfYear = 182.5 * 24 * 60 * 60 * 1000; // half year in milliseconds
		const intervals = [];

		for (let date = threeYearsAgo; date <= now; date += halfYear) {
			intervals.push(date);
		}

		const result = intervals.map((endDate) => {
			return {
				date: endDate,
				count: sortedUsersCreatedDates.filter((ts) => ts <= endDate).length,
			};
		});

		res.status(200).json(result);
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

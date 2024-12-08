import { envConfig } from '../config/config-env';
import { checkUndefinedOrNull } from '../utils/utils';
import { NextFunction, Request, Response } from 'express';
import { PostModel } from '../models/postModel';
import { UserModel } from '../models/userModel';
import { v2 as cloudinary } from 'cloudinary';
import { SortOrder, Types } from 'mongoose';
import { selectFieldsPopulate } from '../config/populat.config';
import CommonResponseDict from '../utils/common-response-dict.utils';
import { AppError } from '../error/appError';

const MAX = 10000000;
const MIN = 0;

export const getAllPosts = async (req: Request, res: Response, next: NextFunction) => {
	const perPage = Math.min(Number(req.query.perPage) || 15, 20);
	const page = Number(req.query.page) || 1;
	const sort = (req.query.sort as string) || 'createdAt';
	const reverse: SortOrder = req.query.reverse === 'yes' ? -1 : 1;
	try {
		const posts = await PostModel.find({})
			.sort([[sort, reverse]])
			.limit(perPage)
			.skip((page - 1) * perPage)
			.populate({ path: 'likes', select: selectFieldsPopulate })
			.populate({ path: 'creator_id', select: selectFieldsPopulate });
		return res.json(posts);
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

export const getPostByID = async (req: Request, res: Response, next: NextFunction) => {
	const postID = req.params.postID;
	try {
		const post = await PostModel.findById(postID).populate({ path: 'creator_id', select: selectFieldsPopulate });
		return res.status(200).json(post);
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

export const uploadPost = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const newPost = new PostModel(req.body);
		newPost.creator_id = req.tokenData._id;
		await newPost.save();

		const post = await PostModel.findById(newPost._id).populate({ path: 'creator_id', select: selectFieldsPopulate });
		return res.status(201).json(post);
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

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const postID = req.params.postID;
		let data;
		if (req.tokenData.role === 'admin') {
			data = await PostModel.updateOne({ _id: postID }, req.body);
		} else {
			data = await PostModel.updateOne({ _id: postID, creator_id: req.tokenData._id }, req.body);
		}
		if (data.modifiedCount === 1) {
			const post = await PostModel.findOne({ _id: postID });
			post.updatedAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
			await post.save();
			return res.status(200).json({ data, msg: 'Post edited' });
		}
		return next(
			new AppError(CommonResponseDict.BadRequest.title, CommonResponseDict.BadRequest.code, 'Cannot edit post', true)
		);
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

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
	const postID = req.params.postID;
	const details = {
		cloud_name: envConfig.cloudinary_name,
		api_key: envConfig.cloudinary_key,
		api_secret: envConfig.cloudinary_secret,
		type: 'upload',
	};

	const post = await PostModel.findById(postID);
	const deleteCloudinaryImages = () => {
		post.img.forEach((img) => {
			cloudinary.uploader.destroy(img.img_id, details, (error) => {
				if (error) {
					return res.json({ error });
				}
			});
		});
	};

	try {
		let data;
		if (req.tokenData.role === 'admin') {
			data = await PostModel.deleteOne({ _id: postID });
		} else {
			data = await PostModel.deleteOne({ _id: postID, creator_id: req.tokenData._id });
		}
		if (data.deletedCount === 1) {
			deleteCloudinaryImages();
			return res.status(200).json({ data, msg: 'Post deleted' });
		}
		return next(
			new AppError(
				CommonResponseDict.BadRequest.title,
				CommonResponseDict.BadRequest.code,
				'User cannot delete this post',
				true
			)
		);
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

export const countAllPosts = async (req: Request, res: Response, _next: NextFunction) => {
	try {
		const count = await PostModel.countDocuments({});
		return res.json({ count });
	} catch (err) {
		return res.status(500).json({ msg: 'Error', err });
	}
};

export const countMyPosts = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const count = await PostModel.countDocuments({ creator_id: req.tokenData._id });
		return res.json({ count });
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

export const searchPosts = async (req: Request, res: Response, next: NextFunction) => {
	const perPage = Math.min(Number(req.query.perPage) || 15, 20);
	const page = Number(req.query.page) || 1;
	const sort = (req.query.sort as string) || 'createdAt';
	const reverse: SortOrder = req.query.reverse === 'yes' ? -1 : 1;

	try {
		const searchQ = checkUndefinedOrNull(req.query?.searchQ) ? '' : (req.query.searchQ as string);
		const max = checkUndefinedOrNull(req.query?.max) ? MAX : req.query.max;
		const min = checkUndefinedOrNull(req.query?.min) ? MIN : req.query?.min;
		const categories = checkUndefinedOrNull(req.query?.categories)
			? null
			: (req.query?.categories as string).split(',');
		const searchReg = new RegExp(searchQ, 'i');
		const posts = categories?.length
			? await PostModel.find({
					title: { $regex: searchReg },
					price: { $gte: min, $lt: max },
					category_url: { $in: categories },
				})
					.limit(perPage)
					.skip((page - 1) * perPage)
					.sort([[sort, reverse]])
					.populate({ path: 'likes', select: selectFieldsPopulate })
					.populate({ path: 'creator_id', select: selectFieldsPopulate })
			: await PostModel.find({
					title: { $regex: searchReg },
					price: { $gte: min, $lt: max },
				})
					.limit(perPage)
					.skip((page - 1) * perPage)
					.sort([[sort, reverse]])
					.populate({ path: 'likes', select: selectFieldsPopulate })
					.populate({ path: 'creator_id', select: selectFieldsPopulate });

		return res.json({ count: posts.length, posts });
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

export const changeActiveStatus = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const postID = req.params.postID;
		if (postID === envConfig.superID) {
			return next(
				new AppError(
					CommonResponseDict.Unauthorized.title,
					CommonResponseDict.Unauthorized.code,
					'You cannot change superadmin to user',
					true
				)
			);
		}
		const post = await PostModel.findOne({ _id: postID });
		post.active = !post.active;
		post.updatedAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
		await post.save();

		return res.status(200).json(post);
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

export const getUserPosts = async (req: Request, res: Response, next: NextFunction) => {
	const perPage = Math.min(Number(req.query.perPage) || 10, 20);
	const page = Number(req.query.page) || 1;
	const sort = (req.query.sort as string) || 'createdAt';
	const reverse: SortOrder = req.query.reverse === 'yes' ? -1 : 1;
	try {
		const id = req.params.userID;
		const posts = await PostModel.find({ creator_id: id })
			.limit(perPage)
			.skip((page - 1) * perPage)
			.sort([[sort, reverse]])
			.populate({ path: 'creator_id', select: selectFieldsPopulate });
		return res.json(posts);
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

export const changePostRange = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const postID = req.params.postID;
		let data;
		if (postID === envConfig.superID) {
			return next(
				new AppError(
					CommonResponseDict.Unauthorized.title,
					CommonResponseDict.Unauthorized.code,
					'You cannot change superadmin to user',
					true
				)
			);
		}
		if (req.tokenData.role === 'admin') {
			data = await PostModel.updateOne({ _id: postID }, { range: req.body.range });
		} else {
			data = await PostModel.updateOne({ _id: postID, creator_id: req.tokenData._id }, { range: req.body.range });
		}
		const post = await PostModel.findOne({ _id: postID });
		post.updatedAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
		await post.save();
		return res.json(data);
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

export const likePost = async (req: Request, res: Response, next: NextFunction) => {
	const user = await UserModel.findById(req.tokenData._id);
	const postID = req.params.postID;
	const post = await PostModel.findOne({ _id: postID })
		.populate({ path: 'likes', select: selectFieldsPopulate })
		.populate({ path: 'creator_id', select: selectFieldsPopulate });

	const found = post.likes.some((el) => String(el.id) === req.tokenData._id);
	if (!found) {
		post.likes.unshift(req.tokenData._id as Types.ObjectId);
		await post.save();

		if (!('creator_id' in post && typeof post.creator_id === 'object' && '_id' in post.creator_id)) {
			return next(
				new AppError(
					CommonResponseDict.InternalServerError.title,
					CommonResponseDict.InternalServerError.code,
					'Post creator_id is not populated correctly',
					false
				)
			);
		}

		const inWishlist = user.wishList.some((el) => String(el) === postID);
		if (!inWishlist && String(post.creator_id._id) !== req.tokenData._id) {
			user.wishList.unshift(post._id);
			await user.save();
		}
		return res.status(201).json({ posts: post.likes, post, msg: 'You liked the post' });
	}

	post.likes = post.likes.filter((e) => String(e._id) !== req.tokenData._id);
	await post.save();

	user.wishList = user.wishList.filter((el) => String(el) !== postID);
	await user.save();
	return res.status(201).json({ posts: post.likes, msg: 'Unliked the post' });
};

export const countPostLikes = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const postID = req.params.postID;
		const post = await PostModel.findOne({ _id: postID });
		const likes = await post.likes;
		return res.json({ count: likes.length });
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

export const getTopThreeLikes = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const postID = req.params.postID;
		const post = await PostModel.findOne({ _id: postID });
		return res.json({ likes: post.likes.splice(0, 3) });
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

export const onCancelDelete = (req: Request, res: Response, next: NextFunction) => {
	try {
		return res.json({ msg: 'Delete all images succeeded' });
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

export const deleteSinglePostImage = async (req: Request, res: Response, _next: NextFunction) => {
	const { postID, imgID } = req.params;
	const details = {
		cloud_name: envConfig.cloudinary_name,
		api_key: envConfig.cloudinary_key,
		api_secret: envConfig.cloudinary_secret,
		type: 'upload',
	};
	const post = await PostModel.findById(postID);
	post.img = post.img.filter((img) => img.img_id !== imgID);
	await post.save();
	cloudinary.uploader.destroy(imgID, details, (error) => {
		if (error) {
			return res.json({ error });
		}
	});
	return res.json({ msg: 'Delete all images succeeded' });
};

export const countPostsByCategory = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const countMap = {};
		const posts = await PostModel.find({});
		const arrayOfCategories = posts.map((post) => post.category_url);

		arrayOfCategories.forEach((category) => {
			countMap[category] = (countMap[category] || 0) + 1;
		});

		const categoriesCount = Object.keys(countMap).map((key) => {
			return { name: key, count: countMap[key] };
		});

		return res.json(categoriesCount);
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

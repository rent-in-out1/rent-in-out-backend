import { NextFunction, Request, Response } from 'express';
import { CategoryModel } from '../models/categoryModel';
import { SortOrder } from 'mongoose';
import { selectFieldsPopulate } from '../config/populat.config';
import { AppError } from '../error/appError';
import CommonResponseDict, { HttpCode } from '../utils/common-response-dict.utils';

// Get Category List
export const getCategorylist = async (req: Request, res: Response, _next: NextFunction) => {
	let sort = (req.query.sort as string) || 'name';
	let reverse: SortOrder = req.query.reverse === 'yes' ? -1 : 1;
	try {
		let data = await CategoryModel.find({})
			.sort([[sort, reverse]])
			.populate({ path: 'creator_id', select: selectFieldsPopulate })
			.populate({ path: 'editor_id', select: selectFieldsPopulate });
		return res.json(data);
	} catch (err) {
		_next(
			new AppError(
				CommonResponseDict.InternalServerError.title,
				CommonResponseDict.InternalServerError.code,
				'There was an error, please try again later',
				false
			)
		);
	}
};

// Search Categories
export const searchCategories = async (req: Request, res: Response, _next: NextFunction) => {
	const perPage = Math.min(Number(req.query.perPage) || 10, 20);
	const page = Number(req.query.page) || 1;
	const sort = (req.query.sort as string) || 'createdAt';
	const reverse: SortOrder = req.query.reverse === 'yes' ? -1 : 1;
	try {
		const searchQ = req.query.s as string;
		const searchReg = new RegExp(searchQ, 'i');
		const categories = await CategoryModel.find({
			$and: [
				{
					$or: [{ name: searchReg }, { info: searchReg }, { url_name: searchReg }],
				},
			],
		})
			.limit(perPage)
			.skip((page - 1) * perPage)
			.sort([[sort, reverse]])
			.populate({ path: 'creator_id', select: selectFieldsPopulate })
			.populate({ path: 'editor_id', select: selectFieldsPopulate });

		return res.json(categories);
	} catch (error) {
		_next(
			new AppError(
				CommonResponseDict.InternalServerError.title,
				CommonResponseDict.InternalServerError.code,
				'There was an error, please try again later',
				false
			)
		);
	}
};

// Add Category
export const addCategory = async (req: Request, res: Response, _next: NextFunction) => {
	try {
		const newCategory = new CategoryModel(req.body);
		newCategory.creator_id = String(req.tokenData._id);
		newCategory.editor_id = String(req.tokenData._id);
		await newCategory.save();
		const category = await CategoryModel.findById(newCategory._id)
			.populate({ path: 'creator_id', select: selectFieldsPopulate })
			.populate({ path: 'editor_id', select: selectFieldsPopulate });

		return res.json(category);
	} catch (error: any) {
		if (error.code === 11000) {
			return _next(
				new AppError(
					'DuplicateField',
					HttpCode.DuplicateField,
					'Category already in system, try a different name',
					true
				)
			);
		}

		_next(
			new AppError(
				CommonResponseDict.InternalServerError.title,
				CommonResponseDict.InternalServerError.code,
				'There was an error, please try again later',
				false
			)
		);
	}
};

// Edit Category
export const editCategory = async (req: Request, res: Response, _next: NextFunction) => {
	try {
		const idEdit = req.params.idEdit;
		await CategoryModel.updateOne({ _id: idEdit }, req.body);
		const category = await CategoryModel.findOne({ _id: idEdit });
		if (category) {
			category.updatedAt = new Date(Date.now());
			category.editor_id = String(req.tokenData._id);
			await category.save();
			return res.status(200).json({ category });
		}
		return _next(
			new AppError(CommonResponseDict.BadRequest.title, CommonResponseDict.BadRequest.code, 'Category not found', true)
		);
	} catch (error) {
		_next(
			new AppError(
				CommonResponseDict.InternalServerError.title,
				CommonResponseDict.InternalServerError.code,
				'There was an error, please try again later',
				false
			)
		);
	}
};

// Delete Category
export const deleteCategory = async (req: Request, res: Response, _next: NextFunction) => {
	try {
		const idDel = req.params.idDel;
		const data = await CategoryModel.deleteOne({ _id: idDel });
		return res.json(data);
	} catch (error) {
		_next(
			new AppError(
				CommonResponseDict.InternalServerError.title,
				CommonResponseDict.InternalServerError.code,
				'There was an error, please try again later',
				false
			)
		);
	}
};

// Count Categories
export const countCategories = async (req: Request, res: Response, _next: NextFunction) => {
	try {
		const count = await CategoryModel.countDocuments({});
		return res.json({ count });
	} catch (error) {
		_next(
			new AppError(
				CommonResponseDict.InternalServerError.title,
				CommonResponseDict.InternalServerError.code,
				'There was an error, please try again later',
				false
			)
		);
	}
};

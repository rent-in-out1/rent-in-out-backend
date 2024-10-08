import { NextFunction, Request, Response } from 'express';
import { MessageModel } from '../models/messageModel';
import { UserModel } from '../models/userModel';

export const chatUpdate = async (req: Request, res: Response, _next: NextFunction) => {
	// TODO - add controller to make sure user sent needed params/query/body
	const message: any = await UserModel.findOne({ _id: req.body.userID }).populate({
		path: 'messages',
		select: 'roomID',
	});
	try {
		if (!message.messages.some((el) => el.roomID === req.body.messageObj.roomID)) {
			const newMessage = new MessageModel(req.body.messageObj);
			await newMessage.save();
			const user = await UserModel.updateOne({ _id: req.body.userID }, { $push: { messages: newMessage._id } });
			const creator = await UserModel.updateOne({ _id: req.body.creatorID }, { $push: { messages: newMessage._id } });
			return res.status(200).json({ user, creator });
		} else {
			const updatedMessage = await MessageModel.findOneAndUpdate(
				{ roomID: req.body.messageObj.roomID },
				{ messagesArr: req.body.messageObj.messagesArr }
			);
			await updatedMessage.save();
			return res.status(200).json(updatedMessage);
		}
	} catch (err) {
		console.error(err);
		return res.status(500).json({ err });
	}
};

export const getChatByRoomID = async (req: Request, res: Response, _next: NextFunction) => {
	// TODO - add controller to make sure user sent needed params/query/body
	const user: any = await UserModel.findOne({ _id: req.tokenData._id }).populate({
		path: 'messages',
	});
	const roomID = req.params.roomID;
	if (roomID) {
		try {
			const messages = user.messages.filter((msg) => msg.roomID === roomID);
			return res.status(200).json(messages);
		} catch (err) {
			return res.status(500).json({ err });
		}
	} else {
		return res.status(404).json({ msg: 'Chat not found' });
	}
};

export const getUserChats = async (req: Request, res: Response, _next: NextFunction) => {
	try {
		const user: any = await UserModel.findOne({ _id: req.tokenData._id }).populate({
			path: 'messages',
		});
		const messages = user.messages.sort((a, b) => {
			const keyA = new Date(a.updatedAt);
			const keyB = new Date(b.updatedAt);
			return keyA > keyB ? -1 : keyA < keyB ? 1 : 0;
		});
		return res.status(200).json(messages);
	} catch (err) {
		return res.status(500).json({ err });
	}
};

export const deleteMessage = async (req: Request, res: Response, _next: NextFunction) => {
	// TODO - add controller to make sure user sent needed params/query/body
	const messageId = req.params.msgID;
	const roomID = req.params.roomID;
	try {
		const chat = await MessageModel.findOne({ roomID });
		chat.messagesArr.splice(Number(messageId), 1);
		await chat.save();

		if (chat.messagesArr.length < 1) {
			try {
				const owner = await UserModel.findById(chat.creatorID).populate({ path: 'messages' });
				owner.messages = owner.messages.filter((msg) => String(msg._id) !== String(chat._id));
				await owner.save();

				const user = await UserModel.findById(req.tokenData._id).populate({ path: 'messages' });
				user.messages = user.messages.filter((msg) => String(msg._id) !== String(chat._id));
				await user.save();

				await MessageModel.deleteOne({ _id: chat._id });
				return res.status(201).json({ user, owner });
			} catch (err) {
				return res.status(400).json({ err });
			}
		}
		return res.sendStatus(200);
	} catch (err) {
		return res.status(500).json({ err });
	}
};

export const deleteChat = async (req: Request, res: Response, _next: NextFunction) => {
	// TODO - add controller to make sure user sent needed params/query/body
	const chatID = req.params.chatID;
	const chat = await MessageModel.findById(chatID);
	try {
		const user = await UserModel.findById(chat.userID).populate({ path: 'messages' });
		user.messages = user.messages.filter((msg) => String(msg._id) !== chatID);
		await user.save();
		const owner = await UserModel.findById(chat.creatorID).populate({ path: 'messages' });
		owner.messages = owner.messages.filter((msg) => String(msg._id) !== chatID);
		await owner.save();
		await MessageModel.deleteOne({ _id: chatID });
		return res.status(200).json({ user, owner });
	} catch (err) {
		return res.status(500).json({ err });
	}
};

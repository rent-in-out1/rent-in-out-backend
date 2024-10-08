import { Types } from 'mongoose';

export interface ITokenDataModel {
	_id: string | Types.ObjectId;
	role: string;
}

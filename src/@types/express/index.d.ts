import { Types } from 'mongoose';
import { IUser } from '../../interfaces/userInterface.interface';
import { ITokenDataModel } from '../global.types';
export {};

declare global {
	namespace Express {
		interface Request {
			_id: Types.ObjectId;
			user: IUser;

			tokenData: ITokenDataModel;
		}
	}
}

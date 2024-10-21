import { HttpCode } from '../utils/common-response-dict.utils';

export class AppError extends Error {
	public readonly name: string;
	public readonly httpCode: HttpCode;
	public readonly isOperational: boolean;

	constructor(name: string, httpCode: HttpCode, description: string, isOperational: boolean) {
		super(description);

		this.name = name;
		this.httpCode = httpCode;
		this.isOperational = isOperational; // this error is predictable

		Error.captureStackTrace(this);
	}
}

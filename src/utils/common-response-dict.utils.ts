interface ICommonResponseDict {
	title: string;
	code: HttpCode;
}
export enum HttpCode {
	OK = 200,
	Created = 201,
	MultipleChoices = 300,
	BadRequest = 400,
	Unauthorized = 401,
	Forbidden = 403,
	NotFound = 404,
	InternalServerError = 500,
	DuplicateField = 409,
}

class CommonResponseDict {
	static readonly ResourceNotFound: ICommonResponseDict = {
		title: 'Resource not found.',
		code: HttpCode.NotFound,
	};

	static readonly BadRequest: ICommonResponseDict = {
		title: 'Bad request.',
		code: HttpCode.BadRequest,
	};

	static readonly Unauthorized: ICommonResponseDict = {
		title: 'Unauthorized.',
		code: HttpCode.Unauthorized,
	};

	static readonly Forbidden: ICommonResponseDict = {
		title: 'Forbidden.',
		code: HttpCode.Forbidden,
	};

	static readonly InternalServerError: ICommonResponseDict = {
		title: 'Internal server error.',
		code: HttpCode.InternalServerError,
	};

	static readonly Success: ICommonResponseDict = {
		title: 'Success',
		code: HttpCode.OK,
	};

	static readonly Created: ICommonResponseDict = {
		title: 'Resource created successfully',
		code: HttpCode.Created,
	};

	static readonly MultipleChoices: ICommonResponseDict = {
		title: 'Multiple choices.',
		code: HttpCode.MultipleChoices,
	};

	static readonly SchemaError: ICommonResponseDict = {
		title: 'Schema validation error.',
		code: HttpCode.BadRequest,
	};
}

export default CommonResponseDict;

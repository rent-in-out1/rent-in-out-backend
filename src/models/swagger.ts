import m2s from 'mongoose-to-swagger';

import { CategoryModel } from './categoryModel';
import { PostModel } from './postModel';
import { UserModel } from './userModel';
import { MessageModel } from './messageModel';

export const schemasDefinitions = {
	category: m2s(CategoryModel),
	post: m2s(PostModel),
	user: m2s(UserModel),
	message: m2s(MessageModel),
	signUpUserBodyRequest: {
		type: 'object',
		requestBody: {
			description: 'User validation request data body',
			required: true,
			content: {
				'application/json': {
					schema: {
						type: 'object',
						required: ['email', 'password', 'phone', 'birthdate', 'country', 'city'],
						properties: {
							email: {
								type: 'string',
							},
							password: {
								type: 'string',
							},
							phone: {
								type: 'string',
							},
							birthdate: {
								type: 'string',
							},
							country: {
								type: 'string',
							},
							city: {
								type: 'string',
							},
							fullName: {
								type: 'object',
								properties: {
									firstName: {
										type: 'string',
										required: true,
									},
									lastName: {
										type: 'string',
										required: true,
									},
								},
							},
						},
					},
				},
			},
		},
	},
};

export const parametersDefinitions = {
	// ------------------ query params ------------------ //
	PerPageQueryParam: {
		name: 'perPage',
		in: 'query',
		schema: {
			type: 'integer',
			default: 10,
			maximum: 20,
		},
		description: 'Number of items per page (maximum is 20)',
	},
	PageQueryParam: {
		name: 'page',
		in: 'query',
		schema: {
			type: 'integer',
			default: 1,
		},
		description: 'The page number to retrieve.',
	},

	SortQueryParam: {
		name: 'sort',
		in: 'query',
		schema: {
			type: 'string',
			default: 'createdAt',
		},
		description: 'The field to sort the posts by.',
	},

	ReverseQueryParam: {
		name: 'reverse',
		in: 'query',
		schema: {
			type: 'string',
			enum: ['yes', 'no'],
			default: 'no',
		},
		description: "Whether to reverse the sort order (use 'yes' for descending order).",
	},

	SearchQueryParam: {
		name: 'searchQ',
		in: 'query',
		schema: {
			type: 'string',
		},
		description: 'Search query to match against post titles.',
	},

	MaxPriceQueryParam: {
		name: 'max',
		in: 'query',
		schema: {
			type: 'number',
		},
		description: 'Maximum price for filtering posts.',
	},

	MinPriceQueryParam: {
		name: 'min',
		in: 'query',
		schema: {
			type: 'number',
		},
		description: 'Minimum price for filtering posts.',
	},

	CategoriesQueryParam: {
		name: 'categories',
		in: 'query',
		schema: {
			type: 'string',
		},
		description: 'Comma-separated list of categories to filter posts by.',
	},

	SearchSQueryParam: {
		name: 's',
		in: 'query',
		schema: {
			type: 'string',
		},
		description: 'search query.',
	},

	// ------------------ params ------------------ //

	PostIdParam: {
		name: 'postID',
		required: true,
		in: 'query',
		schema: {
			type: 'string',
		},
		description: 'The unique identifier of the post id.',
	},

	UserIdParam: {
		name: 'userID',
		required: true,
		in: 'query',
		schema: {
			type: 'string',
		},
		description: 'The unique identifier of the user id.',
	},

	ImageIdParam: {
		name: 'imgID',
		required: true,
		in: 'query',
		schema: {
			type: 'string',
		},
		description: 'The unique identifier of the image id(cloudinary).',
	},

	roomIdParam: {
		name: 'roomID',
		required: true,
		in: 'query',
		schema: {
			type: 'string',
		},
		description: 'The unique identifier of the room id.',
	},

	chatIdParam: {
		name: 'chatID',
		required: true,
		in: 'query',
		schema: {
			type: 'string',
		},
		description: 'The unique identifier of the chat id.',
	},

	messageIdParam: {
		name: 'msgID',
		required: true,
		in: 'query',
		schema: {
			type: 'string',
		},
		description: 'The unique identifier of the message id.',
	},
};

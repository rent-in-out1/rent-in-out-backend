import express from 'express';
import { auth, authAdmin } from '../middlewares/auth';
import {
	countUsers,
	getUserInfoByIdWithToken,
	getUserInfoById,
	getUsersList,
	searchUsers,
	getUserAvgRank,
	getWishListOfUser,
	getUsersCountByDate,
	editUser,
	changeUserRole,
	changeUserActiveStatus,
	rankUser,
	uploadProfileImg,
	uploadBannerImg,
	deleteUser,
} from '../services/userService';
import { login, requestPasswordReset, resetPassword, signUp, verifiedUser, verifyUser } from '../services/authService';
import { chatUpdate, deleteChat, deleteMessage, getChatByRoomID, getUserChats } from '../services/socketService';
import { loginGmail } from '../middlewares/loginGmail.middleware';
import { sendEmail } from '../services/emailService';
import { userControl, userLoginControl, userSuperAdminControl } from '../controllers/userControl';

const router = express();

/**
 * @swagger
 * /users/verified:
 *   get:
 *     tags:
 *       - Users operations
 *     description: Present the verified page.
 */
router.get('/verified', verifiedUser);
/**
 * @swagger
 * /users/verify/{userId}/{uniqueString}:
 *   get:
 *     tags:
 *       - Users operations
 *     description: Check if user verified, once he clicked on the link in gmail.
 */
router.get('/verify/:userId/:uniqueString', verifyUser);
/**
 * @swagger
 * /users/userSearch:
 *   get:
 *     tags:
 *       - Users operations
 *     description: Get filtered users.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PerPageQueryParam'
 *       - $ref: '#/components/parameters/PageQueryParam'
 *       - $ref: '#/components/parameters/SortQueryParam'
 *       - $ref: '#/components/parameters/ReverseQueryParam'
 *       - $ref: '#/components/parameters/SearchSQueryParam'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/user'
 *       500:
 *         description: Internal server error
 */
router.get('/userSearch', searchUsers);
/**
 * @swagger
 * /users/info/{userID}:
 *   get:
 *     tags:
 *       - Users operations
 *     description: Get the count of the users in the system.
 *     security:
 *       - apiKeyAuth: []
 *     summary: Must be connected as admin
 *     responses:
 *       200:
 *         content:
 *             application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                       count:
 *                         type: number
 *       500:
 *         description: Internal server error
 */
router.get('/count', authAdmin, countUsers);
/**
 * @swagger
 * /users/info/{userID}:
 *   get:
 *     tags:
 *       - Users operations
 *     description: Get the average of user by his id.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdParam'
 *     responses:
 *       200:
 *         content:
 *             application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                       userInfo:
 *                         $ref: '#/components/schemas/user'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/info/:userID', getUserInfoById);
/**
 * @swagger
 * /users/infoToken/{userID}:
 *   get:
 *     tags:
 *       - Users operations
 *     description: Get user info.
 *     summary: Must be connected as user
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdParam'
 *     responses:
 *       200:
 *         content:
 *             application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                       userInfo:
 *                         $ref: '#/components/schemas/user'
 *                       newAccessToken:
 *                         type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/infoToken/:userID', auth, getUserInfoByIdWithToken);
/**
 * @swagger
 * /users/getRank/{userID}:
 *   get:
 *     tags:
 *       - Users operations
 *     description: Get user rank.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdParam'
 *     responses:
 *       200:
 *         content:
 *             application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                       average:
 *                         type: number
 *                       userRank:
 *                         type: number
 *       500:
 *         description: Internal server error
 */
router.get('/getRank/:userID', getUserAvgRank);
/**
 * @swagger
 * /users/getChat/{roomID}:
 *   get:
 *     tags:
 *       - Users operations
 *     summary: Must be connected as user
 *     description: Get All user chats by room id.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/roomIdParam'
 *     responses:
 *       200:
 *         content:
 *             application/json:
 *                   schema:
 *                     $ref: '#/components/schemas/message'
 *       500:
 *         description: Internal server error
 */
router.get('/getChat/:roomID', auth, getChatByRoomID);
/**
 * @swagger
 * /users/getAllChat:
 *   get:
 *     tags:
 *       - Users operations
 *     summary: Must be connected as user
 *     description: Get All user chats.
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         content:
 *             application/json:
 *                   schema:
 *                     $ref: '#/components/schemas/message'
 *       500:
 *         description: Internal server error
 */
router.get('/getAllChat', auth, getUserChats);
/**
 * @swagger
 * /users/getWishList:
 *   get:
 *     tags:
 *       - Users operations
 *     summary: Must be connected as user
 *     description: Get Users wish list.
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         content:
 *             application/json:
 *                   schema:
 *                     $ref: '#/components/schemas/post'
 *       500:
 *         description: Internal server error
 */
router.get('/getWishList', auth, getWishListOfUser);
/**
 * @swagger
 * /users/users-by-date:
 *   get:
 *     tags:
 *       - Users operations
 *     summary: Must be connected as user
 *     description: Get Users by date in skips of 6 months.
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Logged in successfully
 *         content:
 *             application/json:
 *                   schema:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         date:
 *                           type: string
 *                         count:
 *                           type: number
 *       500:
 *         description: Internal server error
 */
router.get('/users-by-date', auth, getUsersCountByDate);

/**
 * @swagger
 * /users/{userID}:
 *   put:
 *     tags:
 *       - Users operations
 *     summary: Must be connected as user
 *     description: Update the user fields of specific user.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdParam'
 *     responses:
 *       200:
 *         description: user role has been updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/user"
 *       401:
 *         description: Only User that connected with userID can change the selected userID fields.
 *       500:
 *         description: Internal server error
 */
router.put('/:userID', auth, userControl, editUser);
/**
 * @swagger
 * /users/changeRole/{userID}:
 *   patch:
 *     tags:
 *       - Users operations
 *     summary: Must be connected as admin
 *     description: Update the user role of specific user.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdParam'
 *     responses:
 *       200:
 *         description: user role has been updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/user"
 *       500:
 *         description: Internal server error
 */
router.patch('/changeRole/:userID', authAdmin, userSuperAdminControl, changeUserRole);
/**
 * @swagger
 * /users/changeActive/{userID}:
 *   patch:
 *     tags:
 *       - Users operations
 *     summary: Must be connected as admin
 *     description: Update the user active of specific user.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdParam'
 *     responses:
 *       200:
 *         description: user active status has been updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/user"
 *       500:
 *         description: Internal server error
 */
router.patch('/changeActive/:userID', authAdmin, userSuperAdminControl, changeUserActiveStatus);
/**
 * @swagger
 * /users/rankUser/{userID}:
 *   patch:
 *     tags:
 *       - Users operations
 *     summary: Must be connected as user
 *     description: Update the rank of specific user.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdParam'
 *     requestBody:
 *        description: Need to send rank.
 *        required: true
 *        content:
 *           application/json:
 *               schema:
 *                  type: object
 *                  properties:
 *                      rnk:
 *                          type: number
 *                          required: true
 *     responses:
 *       200:
 *         description: user rank has been updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
router.patch('/rankUser/:userID', auth, rankUser);
/**
 * @swagger
 * /users/chatUpdate:
 *   patch:
 *     tags:
 *       - Users operations
 *     summary: Must be connected as user
 *     description: Update the current chat where user id equals to the data body user id.
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *        description: Need to send user id.
 *        required: true
 *        content:
 *           application/json:
 *               schema:
 *                  type: object
 *                  properties:
 *                      userID:
 *                          type: string
 *                          required: true
 *     responses:
 *       200:
 *         description: Upload profile image banner has been successfully changed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: object
 *       500:
 *         description: Internal server error
 */
router.patch('/chatUpdate', auth, chatUpdate);
/**
 * @swagger
 * /users/uploadProfile:
 *   patch:
 *     tags:
 *       - Users operations
 *     summary: Must be connected as user
 *     description: Change profile image url.
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *        description: User's data
 *        required: true
 *        content:
 *           application/json:
 *               schema:
 *                  type: object
 *                  required: [ "url", "img_id" ]
 *                  properties:
 *                      url:
 *                          type: string
 *                      img_id:
 *                          type: string
 *     responses:
 *       200:
 *         description: Upload profile image banner has been successfully changed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 res:
 *                   type: string
 *       404:
 *         description: Not found should send body props.
 *       500:
 *         description: Internal server error
 */
router.patch('/uploadProfile', auth, uploadProfileImg);
/**
 * @swagger
 * /users/uploadBanner:
 *   patch:
 *     tags:
 *       - Users operations
 *     summary: Must be connected as user
 *     description: Change banner image url.
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *        description: User's data
 *        required: true
 *        content:
 *           application/json:
 *               schema:
 *                  type: object
 *                  required: [ "url", "img_id" ]
 *                  properties:
 *                      url:
 *                          type: string
 *                      img_id:
 *                          type: string
 *     responses:
 *       200:
 *         description: Upload banner image banner has been successfully changed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 res:
 *                   type: string
 *       404:
 *         description: Not found should send body props.
 *       500:
 *         description: Internal server error
 */
router.patch('/uploadBanner', auth, uploadBannerImg);

/**
 * @swagger
 * /users/{userID}:
 *   delete:
 *     tags:
 *       - Users operations
 *     summary: Must be connected as user
 *     description: Deletes a message from chat.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdParam'
 *     responses:
 *       200:
 *         description: Success message indicating that the message was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/user"
 *       400:
 *         description: Bad request error if the messageID is invalid or if there is an issue with deleting the message.
 *       500:
 *         description: Internal server error
 */
router.delete('/:userID', auth, deleteUser);
/**
 * @swagger
 * /users/deleteChat/{chatID}:
 *   delete:
 *     tags:
 *       - Users operations
 *     summary: Must be connected as user
 *     description: Deletes a message from chat.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/chatIdParam'
 *     responses:
 *       200:
 *         description: Chat has been deleted successfully.
 *       400:
 *         description: Bad request error if the messageID is invalid or if there is an issue with deleting the message.
 *       500:
 *         description: Internal server error
 */
router.delete('/deleteChat/:chatID', auth, deleteChat);
/**
 * @swagger
 * /users/deleteMessage/{roomID}/{msgID}:
 *   delete:
 *     tags:
 *       - Users operations
 *     summary: Must be connected as user
 *     description: Deletes a message from chat.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/roomIdParam'
 *       - $ref: '#/components/parameters/messageIdParam'
 *     responses:
 *       201:
 *         description: Message has been deleted successfully.
 *       400:
 *         description: Bad request error if the messageID is invalid or if there is an issue with deleting the message.
 *       500:
 *         description: Internal server error
 */
router.delete('/deleteMessage/:roomID/:msgID', auth, deleteMessage);

/**
 * @swagger
 * /users:
 *   post:
 *     tags:
 *       - Auth operations
 *     description: Login to the app
 *     $ref: "#/components/schemas/signUpUserBodyRequest"
 *     responses:
 *       201:
 *         description: Reset password has been changed successfully.
 *         content:
 *             application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                      msg:
 *                        type: string
 *       409:
 *         description: Email already in system, try logging in.
 *       500:
 *         description: An unexpected error occurred.
 */
router.post('/', userControl, signUp);
/**
 * @swagger
 * /users/login:
 *   post:
 *     tags:
 *       - Auth operations
 *     description: Login to the app
 *     requestBody:
 *        description: User's data
 *        required: true
 *        content:
 *           application/json:
 *               schema:
 *                  type: object
 *                  required: [ "email", "password" ]
 *                  properties:
 *                      email:
 *                          type: string
 *                          example: "johnsnow@gmail.com"
 *                      password:
 *                          type: string
 *                          example: ""
 *     responses:
 *       200:
 *         description: Logged in successfully
 *         content:
 *             application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                      token:
 *                         type: string
 *                         example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                      user:
 *                        $ref: "#/components/schemas/user"
 *       400:
 *         description: Login failed
 *       500:
 *         description: Internal server error
 */
router.post('/login', loginGmail, userLoginControl, login);
/**
 * @swagger
 * /users/requestPasswordReset:
 *   post:
 *     tags:
 *       - Auth operations
 *     description: Login to the app
 *     requestBody:
 *        description: User's data
 *        required: true
 *        content:
 *           application/json:
 *               schema:
 *                  type: object
 *                  required: [ "email", "redirectUrl" ]
 *                  properties:
 *                      email:
 *                          type: string
 *                          example: "shaybush93@gmail.com"
 *                      password:
 *                          type: string
 *     responses:
 *       403:
 *         description: Email isn't verified yet or account has been suspended, please check your email
 *       404:
 *         description: No account with the supplied email found. Please try again.
 */
router.post('/requestPasswordReset', requestPasswordReset);
/**
 * @swagger
 * /users/resetPassword:
 *   post:
 *     tags:
 *       - Auth operations
 *     description: Login to the app
 *     requestBody:
 *        description: User's data
 *        required: true
 *        content:
 *           application/json:
 *               schema:
 *                  type: object
 *                  required: [ "userId", "resetString", "newPassword" ]
 *                  properties:
 *                      userId:
 *                          type: string
 *                      resetString:
 *                          type: string
 *                      newPassword:
 *                          type: string
 *     responses:
 *       200:
 *         description: Reset password has been changed succefully.
 *         content:
 *             application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                      status:
 *                         type: string
 *                      msg:
 *                        type: string
 *       403:
 *         description: Email isn't verified yet or account has been suspended, please check your email
 *       404:
 *         description: No account with the supplied email found. Please try again.
 */
router.post('/resetPassword', resetPassword);
/**
 * @swagger
 * /users/resetPassword:
 *   post:
 *     tags:
 *       - Auth operations
 *     description: Login to the app
 *     requestBody:
 *        description: User's data
 *        required: true
 *        content:
 *           application/json:
 *               schema:
 *                  type: object
 *                  required: [ "phone", "firstName", "lastName", "email", "textarea" ]
 *                  properties:
 *                      phone:
 *                          type: string
 *                      firstName:
 *                          type: string
 *                      lastName:
 *                          type: string
 *                      email:
 *                          type: string
 *                      textarea:
 *                          type: string
 *     responses:
 *       201:
 *         description: Reset password has been changed succefully.
 *         content:
 *             application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                      status:
 *                         type: string
 *                      msg:
 *                        type: string
 *       500:
 *         description: An unexpected error occurred.
 */
router.post('/clientEmail', sendEmail);
/**
 * @swagger
 * /users/login/gmail:
 *   post:
 *     tags:
 *       - Auth operations
 *     description: Login with gmail token
 *     requestBody:
 *        description: User's data
 *        required: true
 *        content:
 *           application/json:
 *               schema:
 *                  type: object
 *                  required: "token"
 *                  properties:
 *                      token:
 *                          type: string
 *                          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
 *     responses:
 *       200:
 *         description: Logged in successfully
 *         content:
 *             application/json:
 *                   schema:
 *                     type: object
 *                     properties:
 *                      token:
 *                         type: string
 *                         example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                      user:
 *                        $ref: "#/components/schemas/user"
 *       401:
 *         description: User blocked / need to verify your email
 *       404:
 *         description: User not found
 *       500:
 *         description: Couldn't login google
 */
router.post('/login/gmail', loginGmail);

export default router;

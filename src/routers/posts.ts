import express from 'express';
import { auth, authAdmin } from '../middlewares/auth';
import {
	changeActiveStatus,
	changePostRange,
	countAllPosts,
	countMyPosts,
	countPostLikes,
	countPostsByCategory,
	deletePost,
	deleteSinglePostImage,
	getAllPosts,
	getPostByID,
	getTopThreeLikes,
	getUserPosts,
	likePost,
	onCancelDelete,
	searchPosts,
	updatePost,
	uploadPost,
} from '../services/postService';
import { postControl, postRangeControl } from '../controllers/postControl';
const router = express();

router.get('/', getAllPosts);
router.get('/getPostByID/:postID', getPostByID);
router.get('/count', countAllPosts);
router.get('/search', searchPosts);
router.get('/checkLikes/:postID', countPostLikes);
router.get('/topThreeLikes/:postID', getTopThreeLikes);
router.get('/countMyPosts', auth, countMyPosts);
router.get('/userPosts/:userID', getUserPosts);
router.get('/count-by-category', countPostsByCategory);

router.post('/', auth, postControl, uploadPost);
router.post('/likePost/:postID', auth, likePost);
router.post('/singleImgDel/:postID/:imgID', auth, deleteSinglePostImage);
router.post('/onCancelImgDel', auth, onCancelDelete);

router.put('/:postID', auth, updatePost);
router.patch('/changeRange/:postID', auth, postRangeControl, changePostRange);
router.patch('/changeActive/:postID', authAdmin, changeActiveStatus);

router.delete('/:postID', auth, deletePost);

export default router;
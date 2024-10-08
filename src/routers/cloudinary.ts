import express from 'express';
import { auth } from '../middlewares/auth';
import { deleteImageCloudinary } from '../services/cloudinaryService';

const router = express();

/**
 * @swagger
 * /cloudinary/image:
 *   delete:
 *     tags:
 *       - Cloudinary operations
 *     summary: Must be connected as user
 *     description: Deletes an image from Cloudinary using its image ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               img_id:
 *                 type: string
 *                 description: The ID of the image to delete from Cloudinary.
 *             required:
 *               - img_id
 *     responses:
 *       201:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   description: The result from Cloudinary after deletion.
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.delete('/image', auth, deleteImageCloudinary);

export default router;

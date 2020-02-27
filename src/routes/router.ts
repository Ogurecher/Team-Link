import express from 'express';
import { getOnlineUsers } from './users';
import { handleClientError } from './clientError';

export const router = express.Router();

router.route('/users').get(getOnlineUsers);
router.route('/clientError').post(handleClientError);

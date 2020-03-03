import express from 'express';
import { getOnlineUsers } from './users';
import { createCall } from './call';
import { handleClientError } from './clientError';

export const router = express.Router();

router.route('/users').get(getOnlineUsers);
router.route('/call').post(createCall);
router.route('/clientError').post(handleClientError);

import express from 'express';
import { getOnlineUsers } from './users';
import { createCall } from './call';
import { handleClientError } from './clientError';
import { callback } from './callback';

export const router = express.Router();

router.route('/users').get(getOnlineUsers);
router.route('/call').post(createCall);
router.route('/clientError').post(handleClientError);
router.route('/callback').post(callback);

import express from 'express';
import { getOnlineUsers } from './users';
import { createCall } from './call';
import { addMe } from './addMe';
import { hangUp } from './hangUp';
import { handleClientError } from './clientError';
import { callback } from './callback';

export const router = express.Router();

router.route('/users').get(getOnlineUsers);
router.route('/call').post(createCall);
router.route('/addMe').post(addMe);
router.route('/hangUp').delete(hangUp);
router.route('/clientError').post(handleClientError);
router.route('/callback').post(callback);

import express from 'express';
import { getOnlineUsers } from './users';

export const router = express.Router();

router.route('/users').get(getOnlineUsers);

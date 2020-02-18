import express from 'express';
import { getOnlineUsers } from './users.js';

export const router = express.Router();

router.route('/users').get(getOnlineUsers);

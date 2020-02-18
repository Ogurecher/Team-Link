const express = require('express');
const { getOnlineUsers } = require('./users');

const router = express.Router();

router.route('/users').get(getOnlineUsers);

module.exports = {
    router
};

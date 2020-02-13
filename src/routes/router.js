const express = require('express');
const { getUsers } = require('./users');

const router = express.Router();

router.route('/users').get(getUsers);

module.exports = { 
    router
}
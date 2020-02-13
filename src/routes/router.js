const express = require('express');
const getUser = require('./users');

const router = express.Router();

router.route('/users', getUser);
const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        authenticate, me);  // Protected — returns current cafe profile

module.exports = router;

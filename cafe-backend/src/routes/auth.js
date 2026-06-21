const express = require('express');
const router = express.Router();
const { register, login, me, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

router.post('/register',        register);
router.post('/login',           login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);
router.get('/me',               authenticate, me);  // Protected — returns current cafe profile

module.exports = router;

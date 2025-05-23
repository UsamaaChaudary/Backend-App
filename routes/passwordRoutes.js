const express = require('express');
const {  sendPasswordResetCode, resetPasswordWithCode } = require('../controllers/passwordController');
const router = express.Router();



router.post('/forgot-password', sendPasswordResetCode);
router.post('/reset-password', resetPasswordWithCode);




module.exports = router;

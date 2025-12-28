const Router = require('express').Router();
const AuthController = require('../controllers/auth.controller');
const { paymentAuth } = require('../middlewares/payment.middleware');

Router.post('/auth', paymentAuth, AuthController.doAuth);

module.exports = Router;
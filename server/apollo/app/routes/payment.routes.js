const express = require('express');

const { createStripeSubMerchantAcc, dashboardRedirection, createPaymentntent, createPaymentRefund } = require('../controllers/stripe.controller');
const { paymentAuth } = require('../middlewares/payment.middleware');

const router = express.Router();

router.post('/create/account',paymentAuth, createStripeSubMerchantAcc);
router.get('/dashboard',paymentAuth, dashboardRedirection);
router.post('/create/payment-intent',paymentAuth, createPaymentntent);
router.post('/payment-refund',paymentAuth, createPaymentRefund);


module.exports = router;
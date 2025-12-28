require('dotenv').config();
const ErrorModules = require('../errors');

const stripeController = require('../services/stripe.service');

const createStripeSubMerchantAcc = async (req, res) => {
    const email = req.body.email;
    const communityId = req.user.selectedOrganizationPortal;
    if(!email) {
        res
        .status(422)
        .send({
            error:true,
            message:"fieldEmailRequired",
            ErrorClass:ErrorModules.ValidationError
        });
    }
    if(!communityId) {
        res
        .status(422)
        .send({
            error:true,
            message:"userNoDefaultCommunityPortal",
            ErrorClass:ErrorModules.ValidationError
        });
    }
    const account = await stripeController.createStripeSubMerchantAcc({ email, communityId });

    res.json(account);
}

const dashboardRedirection = async (req, res) => {
    try {
        const accountId = req.query.accountId;
        if(!accountId) {
            res
            .status(422)
            .send({
                    error:true,
                    message:"Stripe account id is required",
                    ErrorClass:ErrorModules.ValidationError
                });
        }
        const account = await stripeController.stripeDashboardLinkGeneration(accountId);
        
        res.json(account);
    } catch (error) {
        console.log(error);
        
        res.status(500).send({ error: error.message });
    }
}

const createPaymentntent = async (req, res) => {
    try {
        const intent = await stripeController.createPaymentntent( req );
        
        res.json(intent);
    } catch (error) {
        console.log(error);
        
        res.status(500).send({ error: error.message });
    }
}

const createPaymentRefund = async (req, res) => {
    try {
        const result = await stripeController.createPaymentRefund( req );
        
        res.json(result);
    } catch (error) {
        console.log(error);
        
        res.status(500).send({ error: error.message });
    }
}

module.exports = {
    createStripeSubMerchantAcc,
    dashboardRedirection,
    createPaymentntent,
    createPaymentRefund
};

module.exports = {
    validateCreditsRemaining: async function(community, smsCount, emailCount) {
    if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining < smsCount) {
        throw new Error("Insufficient SMS credits");
    }

    if (community.sms_email_global_settings.email_settings && community.email_credits_remaining < emailCount) {
        throw new Error("Insufficient Email credits");
    }
}
}
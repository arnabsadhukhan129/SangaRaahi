const User = Lib.Model('Users');
const Communities = Lib.Model('Communities');
const Events = Lib.Model('Events');
const DatabaseError = require('../errors/database.error');
const ErrorModules = require('../errors');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const notificationServices = require('./notification.service');
const NotificationSettings = Lib.Model('NotificationSettings');
const Tokens = Lib.Model('Tokens');
const UsersTrack = Lib.Model('UsersTrack');
const helperService = require('./helper.service');
const ActivityLogService = require('./activity_log.service')

require('dotenv').config();
const axios = require("axios");
const { error } = require('winston');

module.exports = {

    findUserByPhoneMail: async function (params, communityId) {
        try {
            const email = params.email;
            const phone = params.phone;
            const phoneCode = params.phoneCode;
            const countryCode = params.countryCode;

            if (email || phone) {
                const user = await User.findOne({
                    $or: [
                        // { 'contact.email.address': email },
                        {
                            $and: [
                                { 'contact.phone.number': phone },
                                { 'contact.phone.phone_code': phoneCode },
                                { 'contact.phone.country_code': countryCode }
                            ]
                        }
                    ], "is_deleted": false
                });
                if (user) {
                    if (communityId) {
                        // check searched user is under the selected org or not
                        const community = await Communities.aggregate([
                            {
                                $match: {
                                    _id: new ObjectId(communityId),
                                    is_active: true,
                                    is_deleted: false
                                }
                            },
                            {
                                $unwind: {
                                    path: "$members"
                                }
                            },
                            {
                                $match: {
                                    "members.member_id": new ObjectId(user._id),
                                    'members.is_deleted': false,
                                }
                            }
                        ]);

                        if (!Lib.isEmpty(community)) {
                            const commDetails = community[0];
                            if (commDetails.members.is_approved && !commDetails.members.is_leaved && commDetails.members.is_active) {
                                return {
                                    error: false,
                                    message: "User is already a member.",
                                }
                            }
                            if (!commDetails.members.is_approved && !commDetails.members.is_rejected && !commDetails.members.is_leaved && !commDetails.members.is_active) {
                                return {
                                    error: false,
                                    message: "joinRequestAlreadySend",
                                }
                            }
                        }
                    }
                    return {
                        error: false,
                        message: "generalSuccess",
                        data: {
                            user: Lib.reconstructObjectKeys(Lib.generalizeUser(user.toJSON()), "value", Lib.convertDate),
                        },
                    }
                } else {
                    return { error: true, message: "userNotFound", ErrorClass: ErrorModules.Api404Error };

                }
            }
        } catch (err) {
            console.log(err);
            return { error: true, message: "There is some error found.", ErrorClass: ErrorModules.GeneralApiError };
        }
    },

    onboardPassiveMember: async function (params, _user) {
        const communityId = params.communityId;
        const email = params.email;
        const gender = params.gender;
        const yearOfBirth = params.yearOfBirth;
        const phone = params.phone;
        const phoneCode = params.phoneCode;
        const countryCode = params.countryCode;
        //const name = params.firstname+' '+params.middlename+' '+params.lastname ;
        const firstname = params.firstname;
        const lastname = params.lastname;
        const middlename = params.middlename;
        const userRole = params.userRole; // Community role which this passive member is joining
        const language = params.language;
        const name = middlename ? `${firstname} ${middlename} ${lastname}` : `${firstname} ${lastname}`;

        const emailAnnouncement = params.emailAnnouncement;
        const smsAnnouncement = params.smsAnnouncement;
        const emailEvent = params.emailEvent;
        const smsEvent = params.smsEvent;

        // Checking if the user details is already exist or not
        if (email || phone) {
            const user = await User.findOne({
                $or: [
                    { 'contact.email.address': email },
                    {
                        $and: [
                            { 'contact.phone.number': phone },
                            { 'contact.phone.phone_code': phoneCode },
                            { 'contact.phone.country_code': countryCode }
                        ]
                    }
                ], "is_deleted": false
            });

            if (user) {
                return { error: true, message: "phoneOrEmailExist", ErrorClass: ErrorModules.GeneralApiError };
            }
        }
        // Fetch community details
        const community = await Communities.findOne({
            _id: new ObjectId(communityId),
            is_active: true,
            is_deleted: false
        }, '_id community_name expired_at is_active sms_email_global_settings email_credits_remaining sms_credits_remaining members');
        if (Lib.isEmpty(community)) {
            return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
        }
        // Check if SMS and email settings are enabled
        const { sms_settings, email_settings } = community.sms_email_global_settings;

        // // Generate unique_id
        // const communityAbbreviation = community.community_name.match(/\b\w/g).join('').toUpperCase();
        // const yearOfJoining = new Date().getFullYear().toString();
        // const memberCount = community.members.length + 1;
        // const uniqueId = `${communityAbbreviation}${yearOfJoining}${memberCount.toString().padStart(4, '0')}`;

        // Function to generate unique ID
        const generateUniqueId = (communityAbbreviation, yearOfJoining, count) => {
            return `${communityAbbreviation}${yearOfJoining}${count.toString().padStart(4, '0')}`;
        };

        // Generate unique_id for the main member
        const communityAbbreviation = community.community_name.match(/\b\w/g).join('').toUpperCase();
        const yearOfJoining = new Date().getFullYear().toString();
        let memberCount = community.members.length + 1;
        const uniqueId = generateUniqueId(communityAbbreviation, yearOfJoining, memberCount);

        //Getting lat long based on the user address
        let latitude = "";
        let longitude = "";
        if (params.addressLine1 && params.city) {
            let address = params.addressLine1 + ',' + params.city;
            const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.GEOCODE_KEY}`;


            const response = await axios({
                url: endpoint,
                method: 'get'
            });
            if (response.data.status == 'OK') {
                latitude = response.data.results[0].geometry.location.lat;
                longitude = response.data.results[0].geometry.location.lng;
            }
        }

        // Numeric value on name check
        if (Lib.containsNumbers(name)) {
            return { error: true, message: "nameNotNumeric" };
        }

        // Family member add
        let familyMemberArray = [];
        const familyMembers = params.familyMember;
        var spousecount = 0;
        if (familyMembers && familyMembers.length > 0) {
            const spouse = familyMembers.find(element => element.memberType === "spouse");

            if (spouse) {
                const varifySpouse = await User.findOne({
                    $or: [
                        { 'contact.email.address': spouse.email },
                        {
                            $and: [
                                { 'contact.phone.number': spouse.phone },
                                { 'contact.phone.phone_code': spouse.phoneCode },
                                { 'contact.phone.country_code': spouse.countryCode }
                            ]
                        }
                    ], "is_deleted": false
                });
                if (varifySpouse) {
                    return { error: true, message: "spousePhoneOrEmailExist", ErrorClass: ErrorModules.GeneralApiError };
                }
                if (spouse.phone === phone) {
                    return { error: true, message: "spousePhoneCantSame", ErrorClass: ErrorModules.GeneralApiError };
                }
            }
            familyMembers.forEach((element, index) => {
                if (element.memberType === "spouse" ? !element.email || !element.firstName || !element.lastName || !element.phone : !element.firstName || !element.lastName) {
                    throw new Error("Missing required information for family member email firstName lastName phone");
                }
                if (element.memberType === "spouse") {
                    spousecount++
                }
                // Generate unique_id for family member
                const familyMemberUniqueId = `${uniqueId}FM${(index + 1).toString().padStart(3, '0')}`;
                let object = {
                    age_of_minority: element.memberType,
                    relation_type: element.relationType,
                    member_name: `${element.firstName}${element.middleName ? ' ' + element.middleName : ''} ${element.lastName}`,
                    year_of_birth: element.yearOfBirth,
                    email: element.email,
                    first_address_line: element.address1,
                    second_address_line: element.address2,
                    country_code: element.countryCode,
                    phone_code: element.phoneCode,
                    zipcode: element.zipcode,
                    city: element.city,
                    state: element.state,
                    country: element.country,
                    phone: element.phone,
                    gender: element.gender,
                    community_member_id: familyMemberUniqueId,
                }
                familyMemberArray.push(object);
            });
        }
        if (spousecount > 1) {
            return { error: true, message: "Can't add more than 1 spouse.", ErrorClass: ErrorModules.GeneralApiError };
        }
        // Passive user save
        const user = new User({
            name: `${name}`,
            community_member_id: uniqueId,
            contact: {
                email: {
                    address: params.email,
                    is_verfied: false
                },
                phone: {
                    number: phone,
                    is_verfied: false,
                    country_code: countryCode || "IN",
                    phone_code: phoneCode || "+91"
                },
                first_address_line: params.addressLine1 ? params.addressLine1 : "",
                second_address_line: params.addressLine2 ? params.addressLine2 : "",
                city: params.city ? params.city : "",
                state: params.state ? params.state : "",
                country: params.country ? params.country : "",
                zipcode: params.zipcode ? params.zipcode : "",
                latitude: latitude,
                longitude: longitude
            },
            gender: params.gender ? params.gender : "",
            year_of_birth: params.yearOfBirth ? params.yearOfBirth : "",
            profile_image: params.profileImage ? params.profileImage : "",
            family_members: familyMemberArray,
            is_active: false,
            language: language,
            user_type: Lib.getEnum("USER_TYPE.user")
        });

        // Count the number of users processed
        const usersCount = 1 + familyMembers.length;
        if (
            community.sms_credits_remaining < usersCount
        ) {
            return {
                error: true,
                message: "Insufficient SMS Balance",
                ErrorClass: ErrorModules.GeneralApiError
            };
        }

        if (
            community.email_credits_remaining < usersCount
        ) {
            return {
                error: true,
                message: "Insufficient Email Balance",
                ErrorClass: ErrorModules.GeneralApiError
            };
        }

        const res = await user.save();

        const member = community.members.find(
            (m) => m.member_id.toString() === _user.id.toString()
        );
        const logUserRole = member.roles;

        await ActivityLogService.activityLogActiion({
            communityId: community._id,
            userId: _user.id,
            module: "MEMBERS",
            action: "ONBOARD",
            platForm: "web",
            memberRole: logUserRole,
            newData: res,
            oldData: null
        })

        const memberId = res._id;

        // Add notification settings for the passive user
        let userNotificationSettings = {
            user_id: new ObjectId(memberId),
            community_id: new ObjectId(communityId),
            sms_announcement: smsAnnouncement ? smsAnnouncement : false,
            email_announcement: emailAnnouncement ? emailAnnouncement : false,
            sms_event: smsEvent ? smsEvent : false,
            email_event: emailEvent ? emailEvent : false
        };
        await NotificationSettings.create(userNotificationSettings);

        const communityData = community.toJSON();
        let currentMember = {
            member_id: new ObjectId(memberId),
            community_member_id: uniqueId,
            roles: [userRole],
            is_active: false,
            member_promotions: [{
                type: "Promotion",
                path: {
                    // Old role
                    from: userRole,
                    to: userRole
                }
            }]
        };
        // Member add on member array of community
        if (communityData.members && communityData.members.length > 0) {
            if (typeof index !== 'undefined' && index > 0) {
                community.members[index] = currentMember;
            } else {
                community.members.push(currentMember);
            }
        } else {
            community.members = [currentMember];
        }
        // Update the community
        await community.save();

        await helperService.validateCreditsRemaining(community, usersCount, usersCount);

        //Link token create
        let edetails = {
            communityId: community._id.toString(),
            userId: memberId.toString(),
            adminorgId: _user.id,
            type: "EMAIL"
        }
        let sdetails = {
            communityId: community._id.toString(),
            userId: memberId.toString(),
            adminorgId: _user.id,
            type: "SMS"
        }
        const emailToken = Lib.generateAccessToken(edetails, true, "30d");
        const smsToken = Lib.generateAccessToken(sdetails, true, "30d");

        let elink = await this.tokenShortner(emailToken);
        let slink = await this.tokenShortner(smsToken);

        //Notification to passive member
        /**
         * Send mail and SMS with link
         */
        let to = phoneCode + phone;
        const smspayload = {
            recipient:
            {
                phone: to
            },
            template: {
                type: "SMS",
                slug: "PSSVUSERINVTSMS",
                lang: "en"
            },
            contents: {
                USERNAME: name,
                ORGADMINNAME: _user.name,
                ORGNAME: community.community_name,
                SLINK: slink
            }
        }
        const emailpayload = {
            recipient:
            {
                email: email
            },
            template: {
                type: "Email",
                slug: "PSSVUSERINVTEMAIL",
                lang: "en"
            },
            contents: {
                USERNAME: name,
                ORGADMINNAME: _user.name,
                ORGNAME: community.community_name,
                ELINK: elink
            }
        }
        //Sending SMS
        if (community.sms_credits_remaining > 0 && community.email_credits_remaining > 0) {
            await notificationServices.notifyService(smspayload);
        }
        // sneding email
        if (community.sms_credits_remaining > 0 && community.email_credits_remaining > 0) {
            await notificationServices.notifyService(emailpayload);
        }

        // Deduct credits based on the number of users processed
        if (community.sms_credits_remaining >= usersCount) {
            community.sms_credits_remaining -= usersCount;
            await community.save();
        }

        if (community.email_credits_remaining >= usersCount) {
            community.email_credits_remaining -= usersCount;
            await community.save();
        }

        const userCom = community._id;
        const muser = await User.findOne({ _id: _user.id, is_deleted: false, userCom });
        const payload_Push = {
            recipient:
            {
                user_id: muser._id,
                // fcmToken:[muser.device_details[3].web_token]
                fcmToken: muser.device_details.map(device => device.web_token).filter(Boolean)
            },
            template: {
                type: "All",
                slug: "PSSVUSERINVTPUSH",
                lang: "en"
            },
            contents: {
                ORGADMINNAME: _user.name,
                USERNAME: name,
                ORGNAME: community.community_name,
            }
        }
        //Sending notification
        await notificationServices.notifyService(payload_Push);
        //If spouse in family member then spouse add
        if (familyMembers && familyMembers.length > 0) {
            const spouse = familyMembers.find(element => element.memberType === "spouse");

            if (spouse) {
                const spouseUser = await User.findOne({
                    $or: [
                        { 'contact.email.address': spouse.email },
                        {
                            $and: [
                                { 'contact.phone.number': spouse.phone },
                                { 'contact.phone.phone_code': spouse.phoneCode },
                                { 'contact.phone.country_code': spouse.countryCode }
                            ]
                        }
                    ], "is_deleted": false
                });

                if (!spouseUser) {
                    // While updating spouse reciprocal record
                    await Promise.all(familyMemberArray.map(elem => {
                        if (elem.age_of_minority === 'spouse') {
                            elem.user_id = memberId;
                            elem.age_of_minority = "spouse";
                            elem.member_name = name;
                            elem.email = params.email;
                            elem.phone = phone;
                            elem.year_of_birth = params.yearOfBirth;
                            elem.gender = params.gender;
                            if (elem.relation_type === "wife") {
                                elem.relation_type = "husband";
                            } else if (elem.relation_type === "husband") {
                                elem.relation_type = "wife";
                            }
                        }
                    }));
                    // Spouse passive user save 
                    const spName = `${spouse.firstName}${spouse.middleName ? ' ' + spouse.middleName : ''} ${spouse.lastName}`;
                    const spUser = new User({
                        name: spName,
                        contact: {
                            email: {
                                address: spouse.email,
                                is_verfied: false
                            },
                            phone: {
                                number: spouse.phone,
                                is_verfied: false,
                                country_code: spouse.countryCode,
                                phone_code: spouse.phoneCode
                            },
                            first_address_line: params.addressLine1 ? params.addressLine1 : "",
                            second_address_line: params.addressLine2 ? params.addressLine2 : "",
                            city: params.city ? params.city : "",
                            state: params.state ? params.state : "",
                            zipcode: params.zipcode ? params.zipcode : "",
                            country: params.country ? params.country : "",
                            latitude: latitude,
                            longitude: longitude
                        },
                        gender: spouse.gender ? spouse.gender : "",
                        profile_image: params.profileImage ? params.profileImage : "",
                        family_members: familyMemberArray,
                        year_of_birth: spouse.yearOfBirth ? spouse.yearOfBirth : "",
                        is_active: false,
                        language: language,
                        user_type: Lib.getEnum("USER_TYPE.user"),
                    });
                    let spres = await spUser.save();
                    const spmemberId = spres._id;

                    const member = community.members.find(
                        (m) => m.member_id.toString() === _user.id.toString()
                    );
                    const userRole = member.roles;

                    await ActivityLogService.activityLogActiion({
                        communityId: community._id,
                        userId: _user.id,
                        module: "MEMBERS",
                        action: "ONBOARD",
                        platForm: "web",
                        memberRole: userRole,
                        newData: spUser,
                        oldData: null
                    })

                    // Add notification settings for the Spouse user
                    let db_payload = {
                        user_id: new ObjectId(spmemberId),
                        community_id: new ObjectId(communityId),
                        sms_announcement: spouse.smsAnnouncement ? spouse.smsAnnouncement : false,
                        email_announcement: spouse.emailAnnouncement ? spouse.emailAnnouncement : false,
                        sms_event: spouse.smsEvent ? spouse.smsEvent : false,
                        email_event: spouse.emailEvent ? spouse.emailEvent : false,
                    }
                    await NotificationSettings.create(db_payload);

                    // Add spouse Id on main onboarding member
                    const mainUser = await User.findOne({ _id: new ObjectId(memberId) });
                    await Promise.all(mainUser.family_members.map(element => {
                        if (element.age_of_minority === 'spouse') {
                            element.user_id = new ObjectId(spmemberId)
                        }
                    }));
                    mainUser.save();
                    // Getting community details
                    const spcommunity = await Communities.findOne({
                        _id: ObjectId(communityId),
                        is_active: true,
                        is_deleted: false
                    }, '_id community_name expired_at is_active members');
                    if (Lib.isEmpty(spcommunity)) {
                        return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
                    }
                    const spcommunityData = spcommunity.toJSON();
                    const spouseRole = spouse.userRole ? spouse.userRole : userRole;
                    memberCount++;
                    const spouseUniqueId = generateUniqueId(communityAbbreviation, yearOfJoining, memberCount);
                    let currentMember = {
                        member_id: new ObjectId(spmemberId),
                        community_member_id: spouseUniqueId,
                        roles: [spouseRole],
                        is_active: false,
                        member_promotions: [{
                            type: "Promotion",
                            path: {
                                // Old role
                                from: spouseRole,
                                to: spouseRole
                            }
                        }]
                    };
                    // Member add on member array of community
                    if (spcommunityData.members && spcommunityData.members.length > 0) {
                        if (typeof index !== 'undefined' && index > 0) {
                            spcommunity.members[index] = currentMember;
                        } else {
                            spcommunity.members.push(currentMember);
                        }
                    } else {
                        spcommunity.members = [currentMember];
                    }
                    // Update the community
                    await spcommunity.save();

                    //Link token create
                    let spedetails = {
                        communityId: community._id.toString(),
                        userId: spmemberId.toString(),
                        adminorgId: _user.id,
                        type: "EMAIL"
                    }
                    let spsdetails = {
                        communityId: community._id.toString(),
                        userId: spmemberId.toString(),
                        adminorgId: _user.id,
                        type: "SMS"
                    }
                    const spemailToken = Lib.generateAccessToken(spedetails, true, "30d");
                    const spsmsToken = Lib.generateAccessToken(spsdetails, true, "30d");

                    let esplink = await this.tokenShortner(spemailToken);
                    let ssplink = await this.tokenShortner(spsmsToken);

                    //Notification to passive member
                    /**
                     * Send mail and SMS with link
                     */
                    let spto = phoneCode + spouse.phone;
                    const spsmspayload = {
                        recipient:
                        {
                            phone: spto
                        },
                        template: {
                            type: "SMS",
                            slug: "PSSVUSERINVTSMS",
                            lang: "en"
                        },
                        contents: {
                            USERNAME: spName,
                            ORGADMINNAME: _user.name,
                            ORGNAME: community.community_name,
                            SLINK: ssplink
                        }
                    }
                    const spemailpayload = {
                        recipient:
                        {
                            email: spouse.email
                        },
                        template: {
                            type: "Email",
                            slug: "PSSVUSERINVTEMAIL",
                            lang: "en"
                        },
                        contents: {
                            USERNAME: spName,
                            ORGADMINNAME: _user.name,
                            ORGNAME: community.community_name,
                            ELINK: esplink
                        }
                    }
                    // Sending Sms
                    await notificationServices.notifyService(spsmspayload);

                    // sending email
                    await notificationServices.notifyService(spemailpayload);
                }
            }
        }

        return { error: false, message: "passiveMemberOnboardingSuccess" };
    },

    resendOnboardingInvitation: async function (passiveUserId, context) {
        const communityId = context.user.selectedOrganizationPortal;
        const login_user = context.user;
        const user = await User.findOne({ _id: new ObjectId(passiveUserId), "is_deleted": false });
        const userName = user.name;
        const userEmail = user.contact.email.address;

        if (user) {
            if (communityId) {
                const community = await Communities.findOne({
                    _id: ObjectId(communityId),
                    is_active: true,
                    is_deleted: false
                }, '_id community_name expired_at is_active sms_email_global_settings email_credits_remaining sms_credits_remaining members');
                if (Lib.isEmpty(community)) {
                    return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
                }
                const { sms_settings, email_settings } = community.sms_email_global_settings;
                const usersCount = 1;
                await helperService.validateCreditsRemaining(community, usersCount, usersCount);
                const communityData = community.toJSON();

                let currentMember, index;
                if (communityData.members && communityData.members.length > 0) {
                    currentMember = communityData.members.find((member, i) => {
                        if (member.member_id.toString() === passiveUserId && !member.is_rejected && !member.is_active && !member.is_approved) {
                            index = i;
                            return true;
                        }
                    });
                }
                if (currentMember.is_acknowledged && currentMember.acknowledgement_status !== "Rejected") {
                    return { error: true, message: "userAlreadyAcknowledged", ErrorClass: ErrorModules.GeneralApiError };
                }
                if (currentMember.invitation_date) {
                    // 1 h validation
                    const date1 = new Date(currentMember.invitation_date);
                    const date2 = new Date();
                    const diffMs = date2 - date1;
                    const diffHours = diffMs / (1000 * 60 * 60); // Convert milliseconds to hours

                    if (diffHours < 1) {
                        return {
                            error: true,
                            message: "cantSendInvitation",
                            ErrorClass: ErrorModules.GeneralApiError
                        };
                    }
                    // 30 days Validation

                    // var date1 = new Date(currentMember.invitation_date);
                    // var date2 = new Date();
                    // var diffDays = parseInt((date2 - date1) / (1000 * 60 * 60 * 24));
                    // if (diffDays < 30) {
                    //     return { error: true, message: "cantSendInvitation", ErrorClass: ErrorModules.GeneralApiError };
                    // }
                }
                //Link token create
                let edetails = {
                    communityId: community._id.toString(),
                    userId: passiveUserId,
                    adminorgId: login_user.id,
                    type: "EMAIL"
                }
                let sdetails = {
                    communityId: community._id.toString(),
                    userId: passiveUserId,
                    adminorgId: login_user.id,
                    type: "SMS"
                }
                const emailToken = Lib.generateAccessToken(edetails, true, "30d");
                const smsToken = Lib.generateAccessToken(sdetails, true, "30d");

                let elink = await this.tokenShortner(emailToken);
                let slink = await this.tokenShortner(smsToken);
                //Notification to passive member
                /**
                 * Send mail and SMS with link
                 */
                let to = user.contact.phone.phone_code + user.contact.phone.number;
                // const payload = {
                //     recipient:
                //     {
                //         email: user.contact.email.address,
                //         phone: to,
                //         user_id: user._id
                //     },
                //     template: {
                //         type: "All",
                //         slug: "PSSVUSERINVT",
                //         lang: "en"
                //     },
                //     contents: {
                // USERNAME: user.name,
                // ORGADMINNAME: login_user.name,
                // ORGNAME: community.community_name,
                // ELINK: elink,
                // SLINK: slink
                //     }
                // }
                const smspayload = {
                    recipient:
                    {
                        phone: to
                    },
                    template: {
                        type: "SMS",
                        slug: "PSSVUSERINVTSMS",
                        lang: "en"
                    },
                    contents: {
                        USERNAME: user.name,
                        ORGADMINNAME: login_user.name,
                        ORGNAME: community.community_name,
                        SLINK: slink
                    }
                }
                const emailpayload = {
                    recipient:
                    {
                        email: user.contact.email.address
                    },
                    template: {
                        type: "Email",
                        slug: "PSSVUSERINVTEMAIL",
                        lang: "en"
                    },
                    contents: {
                        USERNAME: user.name,
                        ORGADMINNAME: login_user.name,
                        ORGNAME: community.community_name,
                        ELINK: elink,
                    }
                }
                //Sending SMS
                if (sms_settings) {
                    await notificationServices.notifyService(smspayload);
                }
                // sneding email
                if (email_settings) {
                    await notificationServices.notifyService(emailpayload);
                }
                // Deduct credits based on the number of users processed
                if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= usersCount) {
                    community.sms_credits_remaining -= usersCount;
                    await community.save();
                }

                if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= usersCount) {
                    community.email_credits_remaining -= usersCount;
                    await community.save();
                }

                community.members.map((member, i) => {
                    if (member.member_id.toString() === passiveUserId && !member.is_rejected && !member.is_active && !member.is_approved) {
                        member.invitation_date = new Date();
                    }
                });
                community.save();

                const newData = {
                    user_name: userName,
                    user_email: userEmail
                }

                const member = community.members.find(
                    (m) => m.member_id.toString() === login_user.id.toString()
                );
                const userRole = member.roles;

                await ActivityLogService.activityLogActiion({
                    communityId: communityId,
                    userId: login_user.id,
                    module: "MEMBERS",
                    action: "RESENDINVITATION",
                    platForm: "web",
                    memberRole: userRole,
                    newData: newData,
                    oldData: null

                })
                return { error: false, message: "resendOnboardingInvitationSuccess" };
            } else {
                return { error: true, message: "userNoDefaultCommunityPortal", ErrorClass: ErrorModules.Api404Error };
            }

        } else {
            return { error: true, message: "userNotFound", ErrorClass: ErrorModules.Api404Error };
        }

    },

    passiveUserInvitationDetails: async function (token) {
        let jwtToken = await this.getJwtToken(token);
        if (jwtToken.error) {
            return {
                error: true,
                message: jwtToken.message
            };
        }

        let decoded = await Lib.getDataFromJWT(jwtToken.jwt);

        const userId = decoded.userId;
        const adminorgId = decoded.adminorgId;
        const communityId = decoded.communityId;
        const invitationType = decoded.type;

        const user = await User.findOne({
            is_deleted: false,
            _id: userId
        });
        if (!user || user.length === 0) {
            return {
                error: true,
                message: 'user not found'
            };
        }
        const orgadminuser = await User.findOne({ is_deleted: false, _id: adminorgId }, '_id name');
        if (!orgadminuser || orgadminuser.length === 0) {
            return {
                error: true,
                message: 'orgadminuser not found'
            };
        }
        const community = await Communities.aggregate([

            {
                '$match': {
                    '_id': new ObjectId(communityId),
                    'is_deleted': false,
                    'is_active': true
                },
            }, {
                $lookup: {
                    from: "sr_community_settings",
                    localField: "_id",
                    foreignField: "community_id",
                    as: "communitySetting"
                }
            },
            {
                '$unwind': {
                    'path': '$members',
                },
            },
            {
                '$unwind': {
                    'path': "$communitySetting"
                }
            },
            {
                '$match': {
                    'members.member_id': new ObjectId(userId),
                    'members.is_deleted': false,
                    // 'members.is_active': false,
                    // 'members.is_approved': false,
                    'members.is_leaved': false,
                },
            },
        ]);
        if (!community || community.length === 0) {
            return {
                error: true,
                message: 'Community not found'
            };
        }

        const member = community[0].members;
        if (member.is_active && member.is_approved) {
            return {
                error: true,
                message: 'Already a active member'
            };
        }
        if (member.acknowledgement_status === 'Accepted') {
            return {
                error: true,
                message: 'Already acknowledged and accepted the request'
            };
        } else if (member.acknowledgement_status === 'Rejected') {
            return {
                error: true,
                message: 'Already acknowledged and Rejected the request'
            };
        } else if (member.acknowledgement_status === 'Blocked') {
            return {
                error: true,
                message: 'Already acknowledged and Blocked the request'
            };
        }
        // Count number of family members in the community for the given user
        const totalFamilyMembers = await User.aggregate([
            {
                '$match': {
                    '_id': new ObjectId(userId),
                    'is_deleted': false,
                },
            },
            {
                '$unwind': {
                    'path': '$family_members',
                },
            },
            {
                '$match': {
                    'family_members.is_deleted': false,
                },
            },
            {
                '$project': {
                    'family_members': 1,
                },
            },
        ]);
        user.family_members = totalFamilyMembers.map(familyMember => familyMember.family_members)
        // If there is any pre-existing email sms preferences
        let notificationSettings = await NotificationSettings.findOne({ user_id: new ObjectId(userId), community_id: new ObjectId(communityId) });
        let emailSmsPreferences = {
            smsAnnouncement: true,
            emailAnnouncement: true,
            smsEvent: true,
            emailEvent: true,
        }
        if (!Lib.isEmpty(notificationSettings)) {
            emailSmsPreferences = {
                smsAnnouncement: notificationSettings.sms_announcement ? notificationSettings.sms_announcement : false,
                emailAnnouncement: notificationSettings.email_announcement ? notificationSettings.email_announcement : false,
                smsEvent: notificationSettings.sms_event ? notificationSettings.sms_event : false,
                emailEvent: notificationSettings.email_event ? notificationSettings.email_event : false,
            }
        }
        return {
            error: false,
            message: "generalSuccess",
            totalFamilyMembers: totalFamilyMembers.length,
            communityDetails: Lib.reconstructObjectKeys(community, "value", Lib.convertDate),
            userDetails: Lib.reconstructObjectKeys(Lib.generalizeUser(user.toJSON()), "value", Lib.convertDate),
            orgAdminDetails: Lib.reconstructObjectKeys(orgadminuser, "value", Lib.convertDate),
            emailSmsPreferences: emailSmsPreferences,
            invitationType: invitationType
        };

    },

    invitationResponse: async function (params) {
        const communityId = params.communityId;
        const userId = params.userId;
        const response = params.response; //Accept Reject Block
        const message = params.message ? params.message : '';

        const emailAnnouncement = params.emailAnnouncement;
        const smsAnnouncement = params.smsAnnouncement;
        const emailEvent = params.emailEvent;
        const smsEvent = params.smsEvent;

        const invitationType = params.invitationType;
        // Setting respone name as per the database enum 
        let responseName;
        switch (response) {
            case "Accept":
                responseName = "Accepted"
                break;
            case "Reject":
                responseName = "Rejected"
                break;
            case "Block":
                responseName = "Blocked"
                break;
        }

        // Getting community details
        const community = await Communities.findOne({
            _id: ObjectId(communityId),
            is_active: true,
            is_deleted: false
        }, '_id community_name expired_at is_active members');

        if (Lib.isEmpty(community)) {
            return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
        }

        const user = await User.findOne({ _id: new ObjectId(userId) });

        let spouseId = '';
        let isNotMember = true;
        let isAcknowledged = false;
        //If reject or block automatically spouse will be rejected or blocked
        const familyUser = await User.aggregate([
            {
                $match: {
                    _id: new ObjectId(userId)
                }
            },
            {
                $unwind: {
                    path: "$family_members"
                }
            },
            {
                $match: {
                    "family_members.age_of_minority": "spouse",
                    'family_members.is_deleted': false
                }
            }
        ]);

        if (familyUser.length > 0) {
            spouseId = familyUser[0].family_members.user_id.toString();
        }
        // Accept/Reject/Block response set
        await Promise.all(community.members.map(async member => {
            if (member.member_id.toString() === userId && member.is_deleted === false && member.is_leaved === false) {
                if (member.is_acknowledged === false) {
                    if (response === "Accept") {
                        member.is_approved = true;
                        member.is_active = true;
                        member.joined_at = new Date();
                    }
                    member.acknowledgement_status = responseName;
                    member.is_acknowledged = true;
                    member.acknowledgement_message = message;
                    member.acknowledgement_date = new Date();
                    await UsersTrack.create({
                        user_id: new ObjectId(userId),
                        acknowledgement_status: responseName,
                        platform_type: invitationType
                    });
                } else {
                    isAcknowledged = true;
                }
                isNotMember = false;
            }
            if (member.member_id.toString() === spouseId) {
                if (member.is_acknowledged === false) {
                    if (response === "Reject" || response === "Block") {
                        member.acknowledgement_status = responseName;
                        member.is_acknowledged = true;
                        member.acknowledgement_message = message;
                        member.acknowledgement_date = new Date();
                        await UsersTrack.create({
                            user_id: new ObjectId(spouseId),
                            acknowledgement_status: responseName,
                            platform_type: invitationType
                        });
                        await User.updateOne({ _id: new ObjectId(spouseId) }, { last_activity_at: new Date() });
                    }
                }
            }
        }));
        //If no member then error throw
        if (isNotMember) {
            return { error: true, message: "noMemberFound", ErrorClass: ErrorModules.Api404Error };
        }
        //If user already acknowledged
        if (isAcknowledged) {
            return { error: true, message: "Already acknowledged", ErrorClass: ErrorModules.GeneralApiError };
        }

        if (response === "Accept") {

            const events = await Events.find({
                community_id: new ObjectId(communityId),
                is_active: true,
                is_deleted: false,
                is_cancelled: false,
                invitation_type: "Public",
                rsvp_end_time: { $gte: new Date() }
            });
            for (const event of events) {
                const alreadyRsvped = event.rsvp?.some(
                    r => r.user_id && r.user_id.toString() === userId
                );

                if (!alreadyRsvped) {
                    event.rsvp.push({
                        user_id: new ObjectId(userId),
                        type: "user",
                        is_new: true,
                        invited_by: new ObjectId(event.host_id),
                        created_at: new Date()
                    });

                    await event.save();
                }
            }

            // If accept the email and sms preference set
            let db_payload = {
                user_id: new ObjectId(userId),
                community_id: new ObjectId(communityId),
                sms_announcement: smsAnnouncement ? smsAnnouncement : false,
                email_announcement: emailAnnouncement ? emailAnnouncement : false,
                sms_event: smsEvent ? smsEvent : false,
                email_event: emailEvent ? emailEvent : false,
            }
            await NotificationSettings.create(db_payload);
            if (familyUser.length > 0) {
                spouseId = familyUser[0].family_members.user_id.toString();
                let spNotificationSettings = await NotificationSettings.findOne({ user_id: new ObjectId(spouseId), community_id: new ObjectId(communityId) });
                if (Lib.isEmpty(spNotificationSettings)) {
                    let db_payload = {
                        user_id: new ObjectId(spouseId),
                        community_id: new ObjectId(communityId),
                        sms_announcement: smsAnnouncement ? smsAnnouncement : false,
                        email_announcement: emailAnnouncement ? emailAnnouncement : false,
                        sms_event: smsEvent ? smsEvent : false,
                        email_event: emailEvent ? emailEvent : false,
                    }
                    await NotificationSettings.create(db_payload);
                }
            }
            user.selected_community = new ObjectId(communityId);
            user.selected_organization_portal = new ObjectId(communityId);
            user.is_active = true;
        }

        // save changes
        community.save();
        // Update user activity time
        user.last_activity_at = new Date();
        user.save();

        return { error: false, message: "invitationAcknwoledgedSuccess" };
    },

    userSmsEmailSettingsView: async function (data) {
        const { userId, communityId, deviceType } = data;

        try {
            const smsEmailSetting = await NotificationSettings.findOne({ user_id: userId, community_id: communityId, device_type: deviceType, is_deleted: false });
            if (!smsEmailSetting) {
                return {
                    code: 404,
                    error: true,
                    systemCode: "NOT_FOUND",
                    message: "smsEmailSetting not found",
                    data: null
                };
            }

            // If settings are found, map them to the response structure
            const result = {
                userId: smsEmailSetting.user_id,
                communityId: smsEmailSetting.community_id,
                emailAnnouncement: smsEmailSetting.email_announcement,
                smsAnnouncement: smsEmailSetting.sms_announcement,
                emailEvent: smsEmailSetting.email_event,
                smsEvent: smsEmailSetting.sms_event,
                communityEvent: smsEmailSetting.community_event,
                communityAnnouncement: smsEmailSetting.community_announcement
            };
            return {
                code: 200,
                error: false,
                systemCode: "SUCCESS",
                message: "Settings retrieved successfully",
                data: result
            }
        } catch (error) {
            return {
                code: 500,
                error: true,
                systemCode: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while retrieving the settings",
                data: null
            }
        }

    },

    userSmsEmailSettings: async function (params) {
        const communityId = params.communityId;
        const userId = params.userId;
        const deviceType = params.deviceType;

        const emailAnnouncement = params.emailAnnouncement;
        const smsAnnouncement = params.smsAnnouncement;
        const emailEvent = params.emailEvent;
        const smsEvent = params.smsEvent;
        const communityEvent = params.communityEvent;
        const communityAnnouncement = params.communityAnnouncement;

        // Getting community details
        const community = await Communities.findOne({
            _id: ObjectId(communityId),
            is_active: true,
            is_deleted: false
        }, '_id community_name expired_at is_active members');

        if (Lib.isEmpty(community)) {
            return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
        }

        const user = await User.findOne({ _id: new ObjectId(userId) });

        // Check if a record exists for this user and community
        let notificationSettings = await NotificationSettings.findOne({
            user_id: new ObjectId(userId),
            community_id: new ObjectId(communityId),
            device_type: deviceType
        });

        // Prepare the payload
        let db_payload = {
            device_type: deviceType,
            sms_announcement: smsAnnouncement,
            email_announcement: emailAnnouncement,
            sms_event: smsEvent,
            email_event: emailEvent,
            community_event: communityEvent,
            community_announcement: communityAnnouncement
        };

        let settingsId;
        if (notificationSettings) {
            // Update existing record
            await NotificationSettings.updateOne(
                { _id: notificationSettings._id },
                { $set: db_payload }
            );
            settingsId = notificationSettings._id;
        } else {
            // Create a new record
            db_payload.user_id = new ObjectId(userId);
            db_payload.community_id = new ObjectId(communityId);
            const newNotificationSettings = await NotificationSettings.create(db_payload);
            settingsId = newNotificationSettings._id;
        }

        await user.save();
        // Return the Id of the notification settings
        return {
            error: false,
            systemCode: "SUCCESS",
            code: 200,
            message: "Settings Changes successful",
            data: settingsId.toString() // Return the ID of the created/updated record
        };
    },

    onboardExistUser: async function (params, _user) {
        const communityId = params.communityId;
        const userRole = params.userRole;
        const userId = params.userId;
        const languge = params.languge;

        const user = await User.findOne({ _id: ObjectId(userId), "is_deleted": false });
        if (Lib.isEmpty(user)) {
            return { error: true, message: "userNotFound", ErrorClass: ErrorModules.Api404Error };
        }

        const name = user.name;
        const email = user.contact.email.address;
        const to = user.contact.phone.phone_code + user.contact.phone.number;
        let userIdArray = [{
            id: userId,
            role: userRole,
            email: email,
            phone: to
        }];
        const familyMembers = user.family_members;
        if (familyMembers && familyMembers.length > 0) {
            const spouse = familyMembers.find(element => element.age_of_minority === "spouse");
            if (spouse) {
                userIdArray.push({
                    id: spouse.user_id ? spouse.user_id.toString() : "",
                    role: "member",
                    email: spouse.email,
                    phone: spouse.phone_code + spouse.phone
                });
            }
        }

        userIdArray.forEach(async elem => {
            // Getting community details
            const communityDetails = await Communities.aggregate(
                [
                    {
                        '$match': {
                            '_id': new ObjectId(communityId)
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$members'
                        }
                    },
                    {
                        '$match': {
                            'members.is_deleted': false,
                            'members.is_leaved': false,
                            'members.member_id': new ObjectId(elem.id)
                        }
                    }
                ]);
            const community = communityDetails[0];

            if (!Lib.isEmpty(community)) {
                if (!community.is_active || community.is_deleted) {
                    return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
                }
                if (!community.members.is_approved && !community.members.is_rejected) {
                    return { error: true, message: "invitationAlreadySend", ErrorClass: ErrorModules.ValidationError };
                } else if (community.members.is_approved) {
                    return { error: true, message: "alreadyACommunityMember", ErrorClass: ErrorModules.ValidationError };
                }
            }

            const updateCommunity = await Communities.findOne({
                _id: ObjectId(communityId)
            }, '_id community_name expired_at is_active members');

            const communityData = updateCommunity.toJSON();
            let currentMember = {
                member_id: new ObjectId(elem.id),
                roles: [elem.role],
                is_active: false,
                member_promotions: [{
                    type: "Promotion",
                    path: {
                        // Old role
                        from: elem.role,
                        to: elem.role
                    }
                }]
            };
            // Member add on member array of community
            if (communityData.members && communityData.members.length > 0) {
                if (typeof index !== 'undefined' && index > 0) {
                    updateCommunity.members[index] = currentMember;
                } else {
                    updateCommunity.members.push(currentMember);
                }
            } else {
                updateCommunity.members = [currentMember];
            }
            // Update the Community
            await updateCommunity.save();

            //Link token create
            let edetails = {
                communityId: updateCommunity._id.toString(),
                userId: elem.id.toString(),
                adminorgId: _user.id,
                type: "EMAIL"
            }
            let sdetails = {
                communityId: updateCommunity._id.toString(),
                userId: elem.id.toString(),
                adminorgId: _user.id,
                type: "SMS"
            }
            const emailToken = Lib.generateAccessToken(edetails, true, "30d");
            const smsToken = Lib.generateAccessToken(sdetails, true, "30d");

            let elink = await this.tokenShortner(emailToken);
            let slink = await this.tokenShortner(smsToken);
            //Notification to passive member
            /**
            * Send mail and SMS with link
            */

            const payload = {
                recipient:
                {
                    email: elem.email,
                    phone: elem.phone,
                    user_id: elem.id
                },
                template: {
                    type: "All",
                    slug: "PSSVUSERINVT",
                    lang: "en"
                },
                contents: {
                    USERNAME: name,
                    ORGADMINNAME: _user.name,
                    ORGNAME: updateCommunity.community_name,
                    ELINK: elink,
                    SLINK: slink
                }
            }
            //Sending notification
            await notificationServices.notifyService(payload);
        })


        return { error: false, message: "passiveMemberOnboardingSuccess" };
    },

    updatePassiveUserInvitationDetails: async function (params, id) {
        const firstname = params.firstname;
        const lastname = params.lastname;
        const middlename = params.middlename;
        const name = middlename ? `${firstname} ${middlename} ${lastname}` : `${firstname} ${lastname}`;

        const user = await User.findOne({ is_deleted: false, _id: ObjectId(id) });
        if (Lib.containsNumbers(name)) {
            return { error: true, message: "nameNotNumeric" };
        }
        if (Lib.isEmpty(user)) {
            throw new ErrorModules.Api404Error("noUserFound");
        }

        user.language = params.language ? params.language : user.language;
        user.name = name ? name : user.name;
        user.contact.first_address_line = params.firstAddressLine ? params.firstAddressLine : user.contact.first_address_line;
        user.contact.second_address_line = params.secondAddressLine ? params.secondAddressLine : user.contact.second_address_line;
        user.contact.country = params.country ? params.country : user.contact.country;
        user.contact.state = params.state ? params.state : user.contact.state;
        user.contact.city = params.city ? params.city : user.contact.city;
        user.contact.zipcode = params.zipcode ? params.zipcode : user.contact.zipcode;
        user.hobbies = params.hobbies ? params.hobbies : user.hobbies;
        user.profession = params.profession ? params.profession : user.profession;
        user.about_yourself = params.aboutYourself ? params.aboutYourself : user.about_yourself;

        const familyMembers = user.family_members;
        if (familyMembers && familyMembers.length > 0) {
            const spouse = familyMembers.find(element => element.age_of_minority === "spouse");
            if (spouse) {
                const spouseUser = await User.findOne({ _id: spouse.user_id });
                if (spouseUser) {
                    spouseUser.contact.first_address_line = params.firstAddressLine ? params.firstAddressLine : spouseUser.contact.first_address_line;
                    spouseUser.contact.second_address_line = params.secondAddressLine ? params.secondAddressLine : spouseUser.contact.second_address_line;
                    spouseUser.contact.country = params.country ? params.country : spouseUser.contact.country;
                    spouseUser.contact.state = params.state ? params.state : spouseUser.contact.state;
                    spouseUser.contact.city = params.city ? params.city : spouseUser.contact.city;
                    spouseUser.contact.zipcode = params.zipcode ? params.zipcode : spouseUser.contact.zipcode;
                    await spouseUser.save();
                }
            }
        }

        await user.save();
        return { error: false, message: "userUpdateSuccess", data: user };
    },
    tokenShortner: async function (token) {
        let shortToken = Lib.generateRandomCode();
        await Tokens.create({
            jwt: token.toString(),
            short_token: shortToken.toString()
        });
        // shortToken = "https://sangaraahi.net/invitation/send/" + shortToken.toString();
        shortToken = "https://sangarahinet.demoyourprojects.com/invitation/send/" + shortToken.toString();
        return shortToken;
    },

    getJwtToken: async function (shortToken) {
        const tokenDetails = await Tokens.findOne({ short_token: shortToken });
        if (tokenDetails) {
            return { error: false, jwt: tokenDetails.jwt };
        } else {
            return { error: true, message: "No Token Found" }
        }
    }
}
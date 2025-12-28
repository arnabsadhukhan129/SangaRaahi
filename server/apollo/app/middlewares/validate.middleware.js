const ErrorModules = require('../errors');
module.exports = {
    validateRegistrationPhone: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["registerByPhone"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        //console.log("data....",data);
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }

        if (data.phone.length > 13 || data.phone.length < 5) {
            throw new ErrorModules.ValidationError(Lib.translate("phoneNumberLength"));
        }
        if (fn(data.phone)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneRequired"));
        }
        if (fn(data.phoneCode)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneCodeRequired"));
        }
        if (fn(data.countryCode)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCountryCodeRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },

    validateRegistrationEmail: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["registerUserDetails"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.email)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEmailRequired"));
        }
        if (fn(data.name)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldNameRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },

    validateOTP: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["verifyOtp"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldDataRequired"));
        }
        const otp = data.otp;
        if (fn(otp)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldOTPRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },

    validateAdminLogin: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["adminLogin"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.email)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEmailRequired"));
        }
        if (fn(data.password)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPasswordRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },
    validateCreateAnnouncement: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["createAnnouncement"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.title)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldTitleRequired"));
        }
        if (fn(data.endDate)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEndDateRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },
    validateUpdateAnnouncement: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["updateAnnouncement"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const id = args.id;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.title)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldTitleRequired"));
        }
        if (fn(id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },
    validateAnnouncementById: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getAnnouncementByID"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const id = args.id;
        const fn = Lib.isEmpty;
        if (fn(id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },
    validateAnnouncementDelete: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["deleteAnnouncement"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const id = args.id;
        const fn = Lib.isEmpty;
        if (fn(id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },
    //GROUP VALIDATION
    validateCreateGroup: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["createGroup"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.name)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldNameRequired"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldGroupCommunityIdRequired"));
        }
        if (fn(data.type)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldGroupTypeRequired"));
        }
        if (!Lib.getEnum('GROUP_TYPE')[data.type]) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldGroupTypeInvalid"));
        }
        if (context.user.userType === "admin" && fn(data.userId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldUserIdRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },
    validateGroupById: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getGroupByID"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const id = args.id;
        const fn = Lib.isEmpty;
        if (fn(id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },
    validateUpdateGroup: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["updateGroup"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const id = args.id;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.name)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldNameRequired"));
        }
        if (fn(id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        return resolve(root, args, context, info);
    },
    validateGroupDelete: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["deleteGroup"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }


        const id = args.data.id;
        const fn = Lib.isEmpty;
        if (fn(id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },
    validateCommunityCreate: function (resolve, root, args, context, info) {
        if (!['createCommunity'].includes(info.fieldName)) {
            return resolve(root, args, context, info);
        }
        // Start check of the community fields
        const data = args.data;
        if (Lib.isEmpty(data)) {
            throw new ErrorModules.ValidationError("noCommunityDataProvided");
        }
        if (Lib.isEmpty(data.communityType)) {
            throw new ErrorModules.ValidationError("fieldCommunityTypeRequired");
        }
        const communityTypeEnums = Object.values(Lib.getEnum('COMMUNITY_TYPE'));
        if (!communityTypeEnums.includes(data.communityType)) {
            throw new ErrorModules.ValidationError("fieldCommuniTypeInvalid");
        }
        // if(Lib.isEmpty(data.bannerImage)) {
        //     throw new ErrorModules.ValidationError("fieldBannerImageRequired");
        // }
        if (Lib.isEmpty(data.communityName)) {
            throw new ErrorModules.ValidationError("filedCommunityNameRequired");
        }
        if(Lib.isEmpty(data.community_phone_code)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityPhoneCodeRequired"));
        }
        if(Lib.isEmpty(data.community_number)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityPhoneNumberRequired"));
        }
        if(Lib.isEmpty(data.community_email)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityEmailRequired"));
        }
        // if(Lib.isEmpty(data.address.country)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldCountryRequired"));
        // }
        // if(Lib.isEmpty(data.address.zipcode)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldZipcodeRequired"));
        // }
        if (Lib.isEmpty(data.communityDescription)) {
            throw new ErrorModules.ValidationError("filedCommunityDescriptionRequired");
        }
        // if(Lib.isEmpty(data.communityLocation)) {
        //     throw new ErrorModules.ValidationError("fieldCommunityLocationRequired");
        // }
        return resolve(root, args, context, info);
    },
    validateAddExpiryDateCommunity: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["addExpiryDateToCommunity"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const id = args.data.id;
        const expirydate = args.data.expiryDate;
        const fn = Lib.isEmpty;
        if (fn(id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        if (fn(expirydate)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldExpiryDateRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },
    validateUpdateCommunity: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["updateCommunity"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const id = data.id;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        return resolve(root, args, context, info);
    },
    validateUpdateUser: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["updateUser"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // if(fn(data.email)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldEmailRequired"));
        // }
        // if(fn(data.name)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldNameRequired"));
        // }
        // if(fn(data.phone)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneRequired"));
        // }

        // All OK
        return resolve(root, args, context, info);
    },

    validationAdminPasswordChange: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["adminPasswordChange"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.newPassword)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldNewPassRequired"));
        }
        if (fn(data.confirmPassword)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldConfirmPassRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },

    validationAdminForgotPassword: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["adminForgotPassword"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.email)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEmailRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },

    validationAdminResetPassword: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["adminResetPassword"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.newPassword)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldNewPassRequired"));
        }
        if (fn(data.confirmPassword)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldConfirmPassRequired"));
        }
        if (fn(data.token)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldTokenRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },
    validationCreateEvent: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["createEvent"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // if(fn(data.communityId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        // }
        // if(fn(data.groupId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldGroupIdRequired"));
        // }
        if (fn(data.postEventAsCommunity)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPostEventAsCommunityRequired"));
        }
        if (fn(data.title)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldTitleRequired"));
        }
        if (fn(data.description)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldDescriptionRequired"));
        }
        if (fn(data.type)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldTypeRequired"));
        }
        if (fn(data.invitationType)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldInvitationTypeRequired"));
        }
        if (fn(data.venueDetails)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldVenueDetailsRequired"));
        }
        if (fn(data.venueDetails.firstAddressLine)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldFirstAddressLineRequired"));
        }
        if (fn(data.venueDetails.city)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCityRequired"));
        }
        if (fn(data.venueDetails.state)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldStateRequired"));
        }
        if (fn(data.venueDetails.country)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCountryRequired"));
        }
        if (fn(data.venueDetails.zipcode)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldZipcodeRequired"));
        }
        if (fn(data.venueDetails.phoneNo)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneNoRequired"));
        }
        if (fn(data.date)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldDateRequired"));
        }
        if (fn(data.time)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldTimeRequired"));
        }
        // if (fn(data.rsvpEndTime)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldRsvpEndTimeRequired"));
        // }
        if (fn(data.paymentStatus)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPaymentStatusRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },

    validationUpdateEvent: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["updateEvent"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        // if(fn(data.postEventAsCommunity)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldPostEventAsCommunityRequired"));
        // }
        // if(fn(data.type)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldTypeRequired"));
        // }
        // if(fn(data.venueDetails)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldVenueDetailsRequired"));
        // }
        // if(fn(data.venueDetails.firstAddressLine)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldFirstAddressLineRequired"));
        // }
        // if(fn(data.venueDetails.city)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldCityRequired"));
        // }
        // if(fn(data.venueDetails.state)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldStateRequired"));
        // }
        // if(fn(data.venueDetails.country)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldCountryRequired"));
        // }
        // if(fn(data.venueDetails.zipcode)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldZipcodeRequired"));
        // }
        // if(fn(data.venueDetails.phoneNo)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneNoRequired"));
        // }
        if (data.date && data.date.from) {
            if (fn(data.time.from)) {
                throw new ErrorModules.ValidationError(Lib.translate("fieldFromTimeRequired"));
            }
        }
        if (data.date && data.date.to) {
            if (fn(data.time.to)) {
                throw new ErrorModules.ValidationError(Lib.translate("fieldToTimeRequired"));
            }
        }
        // if(fn(data.time)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldTimeRequired"));
        // }
        // if(fn(data.rsvpEndTime)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldRsvpEndTimeRequired"));
        // }


        // All OK
        return resolve(root, args, context, info);
    },

    validateSwitchCommunity: function (resolve, root, args, context, info) {
        if (info['fieldName'] === 'switchCommunity') {
            if (Lib.isEmpty(args) || Lib.isEmpty(args.data) || Lib.isEmpty(args.data.id)) {
                throw new ErrorModules.ValidationError("switchCommunityCommunityIdRequire");
            }
        }
        return resolve(root, args, context, info);
    },


    validationAdminForgotPassword: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["adminForgotPassword"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.email)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEmailRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },

    removeGroupMember: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["removeGroupMember"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldGroupIdRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },

    communityMemberList: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["communityMemberList"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // if(fn(data.communityId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        // }

        // All OK
        return resolve(root, args, context, info);
    },

    groupMemberList: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["groupMemberList"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.groupId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },

    groupJoinRequest: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["groupJoinRequest"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.groupId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },

    approveCommunity: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["approveCommunity"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },

    joinOrPromoteCommunity: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["joinOrPromoteCommunity"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        // if (data.role) {
        //     if (data.role !== "fan" || data.role !== "member" ) {
        //         throw new ErrorModules.ValidationError(Lib.translate("notAllowed"));
        //     }
        // }

        // All OK
        return resolve(root, args, context, info);
    },

    approveOrRejectMemberRequest: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["approveOrRejectMemberRequest"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // If no community id provided then default will be taken
        // if(fn(data.communityId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        // }
        if (fn(data.memberId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldMemberIdRequired"));
        }
        if (fn(data.approveStatus)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldStatusRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },


    removeCommunityMember: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["removeCommunityMember"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        if (fn(data.memberId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldMemberIdRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },


    removeGroupMember: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["removeGroupMember"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.groupId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        if (fn(data.memberIds)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldMemberIdRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },

    approveOrRejectGroupMemberRequest: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["approveOrRejectGroupMemberRequest"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.groupId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        if (fn(data.memberId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldMemberIdRequired"));
        }
        if (fn(data.approveStatus)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldStatusRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },

    createFeedback: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["createFeedback"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.message)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldMessageRequired"));
        }
        // if(fn(data.subjectId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldSubjectIdRequired"));
        // }


        // All OK
        return resolve(root, args, context, info);
    },

    promoteOrDemoteCommunityMember: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["promoteOrDemoteCommunityMember"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // if(fn(data.communityId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        // }
        if (fn(data.memberId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldMemberIdRequired"));
        }
        if (fn(data.promote)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPromoteRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },

    getPublicProfile: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getPublicProfile"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // if(fn(data.communityId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        // }
        if (fn(data.userId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldMemberIdRequired"));
        }
        // if(fn(data.communityId) && fn(data.groupId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldGroupOrCommunityIdRequired"));
        // }


        // All OK
        return resolve(root, args, context, info);
    },

    addToMyContact: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["addToMyContact"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // if(fn(data.communityId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        // }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldMemberIdRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },


    respondOrEditRSVP: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["respondOrEditRSVP"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // if(fn(data.communityId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        // }
        if (fn(data.eventId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEventIdRequired"));
        }

        if (fn(data.status)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldStatusRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },

    getEventDetails: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getEventDetails"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // if(fn(data.communityId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        // }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEventIdRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },

    getRsvpList: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getRsvpList"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // if(fn(data.communityId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        // }
        if (fn(data.eventId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEventIdRequired"));
        }

        if (fn(data.rsvpType)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldTypeRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },

    privateEventInvite: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["privateEventInvite"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // if(fn(data.communityId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        // }
        if (fn(data.eventId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEventIdRequired"));
        }

        if (fn(data.userIds)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldUserIdRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },

    notificationSettings: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["notificationSettings"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // if(fn(data.deviceId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldDeviceIdRequired"));
        // }

        if (fn(data.deviceType)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldDeviceTypeRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },

    getNotificationSettings: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getNotificationSettings"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // if(fn(data.deviceId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldDeviceIdRequired"));
        // }

        if (fn(data.deviceType)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldDeviceTypeRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },

    sendOtp: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["sendOtp"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.phone)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneRequired"));
        }
        if (fn(data.phoneCode)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneCodeRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },

    findUserByPhoneMail: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["findUserByPhoneMail"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.phone)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneOrEmailRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },
    //Phase II API Validation
    switchOrganiztionPortal: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["switchOrganiztionPortal"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },
    
    currentUserRole: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["currentUserRole"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },

    communityActivePassiveMemberList: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["communityActivePassiveMemberList"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },

    communityActivePassiveMemberDetails: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["communityActivePassiveMemberDetails"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },

    communityMemberStatusChange: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["communityMemberStatusChange"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        if (fn(data.memberId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldMemberIdRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },

    deleteCommunityMember: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["deleteCommunityMember"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        if (fn(data.memberId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldMemberIdRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },

    resendOnboardingInvitation: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["resendOnboardingInvitation"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    onboardPassiveMember: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["onboardPassiveMember"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("communityIdRequired"));
        }
        if (fn(data.email)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEmailRequired"));
        }
        if(!Lib.isEmail(data.email)) {
            throw new ErrorModules.ValidationError(Lib.translate("properEmailRequired"));
        }
        if (data.phone.length > 13 || data.phone.length < 5) {
            throw new ErrorModules.ValidationError(Lib.translate("phoneNumberLength"));
        }
        if (fn(data.phone)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneRequired"));
        }
        if (fn(data.phoneCode)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneCodeRequired"));
        }
        if (fn(data.countryCode)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCountryCodeRequired"));
        }
        if (fn(data.firstname)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldFirstNameRequired"));
        }
        if (fn(data.lastname)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldLastNameRequired"));
        }
        if (fn(data.userRole)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldUserRoleRequired"));
        }
        if (data.familyMember && data.familyMember.length > 0) {
            data.familyMember.forEach((member) => {
                if (member.memberType === "spouse") {
                    if (member.phone.length > 13 || member.phone.length < 9) {
                        throw new ErrorModules.ValidationError(Lib.translate("spousePhoneNumberLength"));
                    }
                    if (fn(member.email)) {
                        throw new ErrorModules.ValidationError(Lib.translate("spouseEmailRequired"));
                    }
                    if(!Lib.isEmail(member.email)) {
                        throw new ErrorModules.ValidationError(Lib.translate("spouseProperEmailRequired"));
                    }
                }
            });
        }
        // All OK
        return resolve(root, args, context, info);
    },

    invitationResponse: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["invitationResponse"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        if (fn(data.userId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldUserIdRequired"));
        }
        if (fn(data.response)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldResponseRequired"));
        }
        if (fn(data.invitationType)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldInvitationTypeRequired"));
        }
        if (data.response === "Accept") {
            if (fn(data.emailAnnouncement)) {
                throw new ErrorModules.ValidationError(Lib.translate("Email Announcement is Required"));
            }
            if (fn(data.smsAnnouncement)) {
                throw new ErrorModules.ValidationError(Lib.translate("SMS Announcement is Required"));
            }
            if (fn(data.emailEvent)) {
                throw new ErrorModules.ValidationError(Lib.translate("Email Event is Required"));
            }
            if (fn(data.smsEvent)) {
                throw new ErrorModules.ValidationError(Lib.translate("SMS Event is Required"));
            }

        }
        if (data.response === "Reject" || data.response === "Block") {
            if (fn(data.message)) {
                throw new ErrorModules.ValidationError(Lib.translate("Message is Required"));
            }
        }

        // All OK
        return resolve(root, args, context, info);
    },

    onboardExistUser: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["onboardExistUser"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.userId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldUserIdRequired"));
        }
        if (fn(data.userRole)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldUserRoleRequired"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    validationcreateMyCommunityEvent: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["createMyCommunityEvent"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // if(fn(data.communityId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        // }
        // if(fn(data.groupId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldGroupIdRequired"));
        // }
        if (fn(data.postEventAsCommunity)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPostEventAsCommunityRequired"));
        }
        if (fn(data.title)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldTitleRequired"));
        }
        if (fn(data.description)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldDescriptionRequired"));
        }
        if (fn(data.type)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldTypeRequired"));
        }
        if (fn(data.venueDetails)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldVenueDetailsRequired"));
        }
        if (fn(data.venueDetails.firstAddressLine)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldFirstAddressLineRequired"));
        }
        if (fn(data.venueDetails.city)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCityRequired"));
        }
        if (fn(data.venueDetails.state)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldStateRequired"));
        }
        if (fn(data.venueDetails.country)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCountryRequired"));
        }
        if (fn(data.venueDetails.zipcode)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldZipcodeRequired"));
        }
        if (fn(data.venueDetails.phoneNo)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneNoRequired"));
        }
        if (fn(data.date)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldDateRequired"));
        }
        if (fn(data.time)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldTimeRequired"));
        }
        if (fn(data.rsvpEndTime)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldRsvpEndTimeRequired"));
        }


        // All OK
        return resolve(root, args, context, info);
    },
    createCommunityFeedback: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["createCommunityFeedback"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.message)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldMessageRequired"));
        }
        if (fn(data.email)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEmailRequired"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    publicityPageStatusChange: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["publicityPageStatusChange"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    updateHomePageOverview: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["updateHomePageOverview"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        if (fn(data.bannerImage)) {
            throw new ErrorModules.ValidationError(Lib.translate("bannerImageRequired"));
        }
        if (fn(data.logoImage)) {
            throw new ErrorModules.ValidationError(Lib.translate("logoImageRequired"));
        }
        if (fn(data.communityDescription)) {
            throw new ErrorModules.ValidationError(Lib.translate("communityDescriptionIsRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    getCommunityHomePageOverviewByID: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getCommunityHomePageOverviewByID"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    getFeaturedCommunities: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getFeaturedCommunities"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.page)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPageRequired"));
        }
        if (fn(data.limit)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldLimitRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    updateCommunityFeaturedStatus: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["updateCommunityFeaturedStatus"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        // if (fn(data.isFeatured)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("isFeaturedRequired"));
        // }
        return resolve(root, args, context, info);
    },
    createAnnouncementOrganization: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["createAnnouncementOrganization"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }

        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.title)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldTitleRequired"));
        }
        if (fn(data.endDate)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEndDateRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    updateCommunityAnnouncementSettings: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["updateCommunityAnnouncementSettings"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        if (fn(data.showPublicAnnouncement)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldShowPublicAnnouncementRequired"));
        }
        if (fn(data.showMemberAnnouncement)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldShowMemberAnnouncementRequired"));
        }
        if (fn(data.showPublicEvents)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldsShowPublicEventsRequired"));
        }
        if (fn(data.showPastEvents)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldShowPastEventsRequired"));
        }
        if (fn(data.showMembersOnlyEvents)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldShowMembersOnlyEventsRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    updateCommunityAboutUsSettings: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["updateCommunityAboutUsSettings"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        if (fn(data.showOrganizationDescription)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldShowOrganizationDescriptionRequired"));
        }
        if (fn(data.showOrganizationAddress)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldShowOrganizationAddressRequired"));
        }
        if (fn(data.showBoardMembers)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldShowBoardMembersRequired"));
        }
        if (fn(data.showExecutiveMembers)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldShowExecutiveMembersRequired"));
        }
        if (fn(data.showContactEmailPublicly)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldShowContactEmailPubliclyRequired"));
        }
        if (fn(data.showContactPhonePublicly)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldShowContactPhonePubliclyRequired"));
        }
        if (fn(data.boardMembersLabelName)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldBoardMembersLabelNameRequired"));
        }
        if (fn(data.executiveMembersLabelName)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldExecutiveMembersLabelNameRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    getMyCommunityGroup:function(resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if(!["getMyCommunityGroup"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if(fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    getMyCommunitiesSettingsView:function(resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if(!["getMyCommunitiesSettingsView"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if(fn(data.communityId) && fn(data.slug)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdOrSlugRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    // getMyCommunityEvents:function(resolve, root, args, context, info) {
    //     const fieldName = info['fieldName'];
    //     if(!["getMyCommunityEvents"].includes(fieldName)) {
    //         return resolve(root, args, context, info);
    //     }
        
    //     const data = args.data;
    //     const fn = Lib.isEmpty;
    //     if(fn(data)) {
    //         throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
    //     }
    //     // if(fn(data.communityId)) {
    //     //     throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
    //     // }
    //     // All OK
    //     return resolve(root, args, context, info);
    // },
    getAllAnnouncementOrganization:function(resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if(!["getAllAnnouncementOrganization"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if(fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    getAnnouncementOrganizationByID:function(resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if(!["getAnnouncementOrganizationByID"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const id = args.id;
        const fn = Lib.isEmpty;
        if(fn(id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    // getMyCommunityEvents: function (resolve, root, args, context, info) {
    //     const fieldName = info['fieldName'];
    //     if (!["getMyCommunityEvents"].includes(fieldName)) {
    //         return resolve(root, args, context, info);
    //     }
    //     const data = args.data;
    //     const fn = Lib.isEmpty;
    //     if (fn(data)) {
    //         throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
    //     }
    //     if (fn(data.communityId)) {
    //         throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
    //     }
    //     // All OK
    //     return resolve(root, args, context, info);
    // },
    getAllAnnouncementOrganization: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getAllAnnouncementOrganization"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    getCommunityBasicDetails: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getCommunityBasicDetails"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        if (fn(data.keyNames)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldKeyNamesRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    communityMemberRoleFilter: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["communityMemberRoleFilter"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldGroupCommunityIdRequired"));
        }
        if (fn(data.memberType)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldmemberTypeRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    // addOrUpdateVideo: function (resolve, root, args, context, info) {
    //     const fieldName = info['fieldName'];
    //     if (!["addOrUpdateVideo"].includes(fieldName)) {
    //         return resolve(root, args, context, info);
    //     }
    //     const data = args.data;
    //     const fn = Lib.isEmpty;
    //     if (fn(data)) {
    //         throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
    //     }
    //     // All OK
    //     return resolve(root, args, context, info);
    // },
    getCommunityVideos: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getCommunityVideos"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    getCommunityPayments: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getCommunityPayments"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    
    orgHomePageAdminApproval: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["orgHomePageAdminApproval"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    
    getOrgPageAdminApproval: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getOrgPageAdminApproval"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    getOrgPaymentPageAdminApproval: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getOrgPaymentPageAdminApproval"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    
    aboutPageAdminApproval: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["aboutPageAdminApproval"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },

    getVideoDetails: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getVideoDetails"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.link)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldLinkRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    
    getCommunityIdFromSlug: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["getCommunityIdFromSlug"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.slug)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldSlugRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },

    communityReplyFeedback: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["communityReplyFeedback"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIdRequired"));
        }
        if (fn(data.to)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldToRequired"));
        }
        if (fn(data.subject)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldSubjectRequired"));
        }
        if (fn(data.body)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldBodyRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    adminLogApproval: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["adminLogApproval"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIdRequired"));
        }
        if (fn(data.isApprove)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldApprovalStatusRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    
    adminLogApprovalList: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["adminLogApprovalList"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        if (fn(data.type)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldTypeRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    
    },
    bankDetailsAdminStatusChange: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["bankDetailsAdminStatusChange"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    
    },
    
    resetVideo: function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (!["resetVideo"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        const data = args.data;
        const fn = Lib.isEmpty;
        if (fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    
    },

    userDotNetSignUp: function (resolve, root, args, context, info) {
        if (!['userDotNetSignUp'].includes(info.fieldName)) {
            return resolve(root, args, context, info);
        }
        // Start check of the community fields
        const data = args.data;
        if (Lib.isEmpty(data)) {
            throw new ErrorModules.ValidationError("noCommunityDataProvided");
        }
        if (Lib.isEmpty(data.community.communityType)) {
            throw new ErrorModules.ValidationError("fieldCommunityTypeRequired");
        }
        const communityTypeEnums = Object.values(Lib.getEnum('COMMUNITY_TYPE'));
        if (!communityTypeEnums.includes(data.community.communityType)) {
            throw new ErrorModules.ValidationError("fieldCommuniTypeInvalid");
        }
        if (Lib.isEmpty(data.community.communityName)) {
            throw new ErrorModules.ValidationError("filedCommunityNameRequired");
        }
        if(Lib.isEmpty(data.community.communityPhoneCode)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityPhoneCodeRequired"));
        }
        if(Lib.isEmpty(data.community.communityNumber)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityPhoneNumberRequired"));
        }
        if(Lib.isEmpty(data.community.communityEmail)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityEmailRequired"));
        }
        // if (Lib.isEmpty(data.community.communityDescription)) {
        //     throw new ErrorModules.ValidationError("filedCommunityDescriptionRequired");
        // }

        if (data.user.phone.length > 13 || data.user.phone.length < 5) {
            throw new ErrorModules.ValidationError(Lib.translate("phoneNumberLength"));
        }
        if (Lib.isEmpty(data.user.phone)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneRequired"));
        }
        if (Lib.isEmpty(data.user.phoneCode)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneCodeRequired"));
        }
        if (Lib.isEmpty(data.user.countryCode)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCountryCodeRequired"));
        }
        if (Lib.isEmpty(data.user.email)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEmailRequired"));
        }
        if (Lib.isEmpty(data.user.name)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldNameRequired"));
        }
        return resolve(root, args, context, info);
    },
    getAvailableGroups:function(resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if(!["getAvailableGroups"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if(fn(data.eventId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEventIdRequired"));
        }
        if(fn(data.type)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldGroupTypeRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    getAllEventTask:function(resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if(!["getAllEventTask"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // if(fn(data.eventId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldEventIdRequired"));
        // }
        // All OK
        return resolve(root, args, context, info);
    },
    createEventTask:function(resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if(!["createEventTask"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if(fn(data.eventId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEventIdRequired"));
        }
        if(fn(data.taskName)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEventTaskNameRequired"));
        }
        if(fn(data.priority)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldpriorityRequired"));
        }
        if(fn(data.taskStartDate)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldtaskStartDateRequired"));
        }
        if(fn(data.taskDeadline)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldtaskDeadlineRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    updateEventTask:function(resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if(!["updateEventTask"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if(fn(data.taskName)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEventTaskNameRequired"));
        }
        if(fn(data.priority)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldpriorityRequired"));
        }
        if(fn(data.taskStartDate)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldtaskStartDateRequired"));
        }
        if(fn(data.taskDeadline)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldtaskDeadlineRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    createEventSupplierManagement:function(resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if(!["createEventSupplierManagement"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if(fn(data.eventId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEventIdRequired"));
        }
        if(fn(data.neededFor)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldNeededForRequired"));
        }
        if(fn(data.requiredDate)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldrequiredDateRequired"));
        }
        if(fn(data.supplyItem)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldsupplyItemRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    getAllEventSupplierManagement:function(resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if(!["getAllEventSupplierManagement"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        // if(fn(data.eventId)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldEventIdRequired"));
        // }
        // All OK
        return resolve(root, args, context, info);
    },
    createBlogs:function(resolve, root, args, context, info){
        const fieldName = info['fieldName'];
        if(!["createBlogs"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if(fn(data.blogTitle)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldblogTitleRequired"));
        }
        if(fn(data.blogCategory)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldblogCategoryRequired"));
        }
        if(fn(data.blogDescription)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldblogDescriptionRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    
    editCurrency:function(resolve, root, args, context, info){
        const fieldName = info['fieldName'];
        if(!["editCurrency"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        if (fn(data.currency)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCurrencyRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    
    verifyCommunityEmail:function(resolve, root, args, context, info){
        const fieldName = info['fieldName'];
        if(!["verifyCommunityEmail"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.email)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEmailRequired"));
        }
        if(!Lib.isEmail(data.email)) {
            throw new ErrorModules.ValidationError(Lib.translate("properEmailRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },

    acceptOrRejectEvent:function(resolve, root, args, context, info){
        const fieldName = info['fieldName'];
        if(!["acceptOrRejectEvent"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }

        if (fn(data.eventId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEventIdRequired"));
        }

        if (fn(data.status)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldStatusRequired"));
        }
        
        // if (data.packageDetails) {
        //     if(fn(data.packageDetails.packageId)) {
        //         throw new ErrorModules.ValidationError(Lib.translate("fieldpackageIdRequired"));
        //     }
        // }
        // All OK
        return resolve(root, args, context, info);
    },
    
    acceptOrRejectOrgEvent:function(resolve, root, args, context, info){
        const fieldName = info['fieldName'];
        if(!["acceptOrRejectOrgEvent"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }

        if (fn(data.eventId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEventIdRequired"));
        }

        if (fn(data.status)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldStatusRequired"));
        }

        // if (fn(data.email)) {
        //     throw new ErrorModules.ValidationError(Lib.translate("fieldEmailRequired"));
        // }

        if (fn(data.phone)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneRequired"));
        }
        if (fn(data.phoneCode)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneCodeRequired"));
        }
        
        // if (data.packageDetails) {
        //     if(fn(data.packageDetails.packageId)) {
        //         throw new ErrorModules.ValidationError(Lib.translate("fieldpackageIdRequired"));
        //     }
        // }
        // All OK
        return resolve(root, args, context, info);
    },

    
    eventAttendingAlert:function(resolve, root, args, context, info){
        const fieldName = info['fieldName'];
        if(!["eventAttendingAlert"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }

        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEventIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    
    getEventPaymentCardDetails:function(resolve, root, args, context, info){
        const fieldName = info['fieldName'];
        if(!["getEventPaymentCardDetails"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }

        if (fn(data.id)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEventIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },

    addCommunitySmsEmailCredit:function(resolve, root, args, context, info){
        const fieldName = info['fieldName'];
        if(!["addCommunitySmsEmailCredit"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },

    updateCommunitySmsEmailCredit:function(resolve, root, args, context, info){
        const fieldName = info['fieldName'];
        if(!["updateCommunitySmsEmailCredit"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.communityId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldCommunityIdRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
    
    webVisitorPhoneVerify:function(resolve, root, args, context, info){
        const fieldName = info['fieldName'];
        if(!["webVisitorPhoneVerify"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }

        if (fn(data.eventId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEventIdRequired"));
        }

        if (fn(data.phone)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneRequired"));
        }
        if (fn(data.phoneCode)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldPhoneCodeRequired"));
        }
        
        // All OK
        return resolve(root, args, context, info);
    },

    acceptOrRejectRecurringEvent:function(resolve, root, args, context, info){
        const fieldName = info['fieldName'];
        if(!["acceptOrRejectRecurringEvent"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }

        if (fn(data.eventId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldEventIdRequired"));
        }

        if (fn(data.status)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldStatusRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },
    addCommunityRole:function(resolve, root, args, context, info){
        const fieldName = info['fieldName'];
        if(!["addCommunityRole"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }

        if (fn(data.name)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldNameRequired"));
        }

        if (fn(data.memberId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldMemberIdRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },
    assignUsherRole:function(resolve, root, args, context, info){
        const fieldName = info['fieldName'];
        if(!["assignUsherRole"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if (fn(data.memberId)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldMemberIdRequired"));
        }

        // All OK
        return resolve(root, args, context, info);
    },
    createBlogs:function(resolve, root, args, context, info){
        const fieldName = info['fieldName'];
        if(!["createBlogs"].includes(fieldName)) {
            return resolve(root, args, context, info);
        }
        
        const data = args.data;
        const fn = Lib.isEmpty;
        if(fn(data)) {
            throw new ErrorModules.ValidationError(Lib.translate("noDataProvideError"));
        }
        if(fn(data.blogTitle)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldblogTitleRequired"));
        }
        if(fn(data.blogCategory)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldblogCategoryRequired"));
        }
        if(fn(data.blogDescription)) {
            throw new ErrorModules.ValidationError(Lib.translate("fieldblogDescriptionRequired"));
        }
        // All OK
        return resolve(root, args, context, info);
    },
}
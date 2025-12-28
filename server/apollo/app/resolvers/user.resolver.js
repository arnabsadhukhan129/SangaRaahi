const UserData = require('../../data.json');
const Services = require('../services');
const ErrorModules = require('../errors');
const CountryCode = require('../../CountryCodes.json');
const State = require('../../states.json');
const City = require('../../cities.json');
const FeedbackSubject = Lib.Model('FeedbackSubject');
let shortUrl = require("node-url-shortener");

// const {
//     GraphQLUpload,
//     graphqlUploadExpress, // A Koa implementation is also exported.
//   } = require('graphql-upload');
module.exports = {
    Query: {
        /** TEST START*/
        async getAllUsers(root, args, context, info) {
            const users = await Services.UserService.getUsers(args.data);
            const allUsersData = users.data;
            const AllUsers = {
                total: users.total,
                from: users.from,
                to: users.to,
                users: allUsersData.map(u => {
                    // u = u.toJSON();
                    u.email = u.contact && u.contact.email ? u.contact.email.address : "";
                    u.phone = u.contact && u.contact.phone ? u.contact.phone.number : "";
                    u.phoneCode = u.contact && u.contact.phone ? u.contact.phone.phone_code : "";
                    u.countryCode = u.contact && u.contact.phone ? u.contact.phone.country_code : "";
                    u.communityMemeberId = u.communityMemberId
                    delete u.contact;
                    Object.keys(u).forEach(k => {
                        if (k !== "_id") {
                            const keyName = k.split("_").map((item, i) => {
                                if (i !== 0) return Lib.toTitleCase(item);
                                return item;
                            }).join("");
                            const value = u[k];
                            delete u[k];
                            u[keyName] = value;
                        } else if (k === "_id") {
                            const value = u[k];
                            delete u[k];
                            u['id'] = value;
                        }
                    })
                    return u;
                })
            }
            return Lib.resSuccess('', AllUsers);
        },
        async getLoggedInUsers(root, args, context, info) {
            const data = args.data;
            const result = await Services.UserService.getLoggedInUsers(data);
            const members = result.data.map(item => ({
                id: item._id?.toString() || null,
                communityName: item.community_name,
                members: {
                    ...item.members,
                    user: {
                        ...item.members.user,
                        id: item.members.user._id?.toString() || null,
                        email: item.members.user.contact.email.address,
                        phone: item.members.user.contact.phone.number
                    }
                }
            }));
            // const members = result.data.map(item => {
            //     return {
            //         id: item._id?.toString() || null,
            //         communityName: item.community_name,
            //         members: {
            //             ...item.members,
            //             user: {
            //                 ...item.members.user,
            //                 id: item.members.user._id?.toString() || null,
            //                 email: item.members.user.contact.email.address
            //             }
            //         }
            //     };
            // });

            const logInUserData = {
                total: result.total,
                from: result.from,
                to: result.to,
                members
            }
            return Lib.resSuccess(logInUserData);
        },

        async getUserByID(root, { id }, context) {

            const User = await Services.UserService.getUserByID(id, context.user);

            // let result;
            // if (User.data.date_of_birth && User.data.date_of_birth.value != null) {
            //     result = Lib.reconstructObjectKeys(User.data, "value", Lib.convertDate);
            // } else {
            //     result = Lib.reconstructObjectKeys(User.data);
            // }

            const result = Lib.reconstructObjectKeys(User.data);

            result.email = result.contact && result.contact.email ? result.contact.email.address : "";
            result.phone = result.contact && result.contact.phone ? result.contact.phone.number : "";
            result.phoneCode = result.contact && result.contact.phone ? result.contact.phone.phoneCode : "";
            result.countryCode = result.contact && result.contact.phone ? result.contact.phone.countryCode : "";
            result.secondaryPhone = result.contact && result.contact.secondaryPhone ? result.contact.secondaryPhone.number : "";
            result.secondaryCountryCode = result.contact && result.contact.secondaryPhone ? result.contact.secondaryPhone.phoneCode : "";
            result.secondaryPhoneCode = result.contact && result.contact.secondaryPhone ? result.contact.secondaryPhone.countryCode : "";
            result.firstAddressLine = result.contact && result.contact.firstAddressLine ? result.contact.firstAddressLine : "";
            result.secondAddressLine = result.contact && result.contact.secondAddressLine ? result.contact.secondAddressLine : "";
            result.city = result.contact && result.contact.city ? result.contact.city : "";
            result.country = result.contact && result.contact.country ? result.contact.country : "";
            result.state = result.contact && result.contact.state ? result.contact.state : "";
            result.zipcode = result.contact && result.contact.zipcode ? result.contact.zipcode : "";
            result.hobbies = result && result.hobbies ? result.hobbies : "";
            result.profession = result && result.profession ? result.profession : "";
            result.subLanguage = Array.isArray(result.futureLanguage) && result.futureLanguage.length > 0
                ? result.futureLanguage[0].subLanguage || ""
                : "";

            // Filter only "spouse" from familyMembers
            // if (Array.isArray(result.familyMembers)) {
            //     result.familyMembers = result.familyMembers.filter(member =>
            //         member.ageOfMinority?.toLowerCase() === "spouse"
            //     );
            // }

            delete result.contact;
            Object.keys(result).forEach(k => {
                if (k !== "_id") {
                    const keyName = k.split("_").map((item, i) => {
                        if (i !== 0) return Lib.toTitleCase(item);
                        return item;
                    }).join("");
                    const value = result[k];
                    delete result[k];
                    result[keyName] = value;
                } else if (k === "_id") {
                    const value = result[k];
                    delete result[k];
                    result['id'] = value;
                }
            })

            return Lib.resSuccess("", result);
        },

        async getMyProfileDetails(root, args, context, info) {
            const profileData = await Services.UserService.getMyProfileDetails(context.user.id);
            return Lib.sendResponse(profileData);
        },
        /** TEST END */
        // async getCountryCodes(root, args, context, info) {
        //     let countryData = Lib.cloneObject(CountryCode);
        //     if (!context.user || context.user.userType !== Lib.getEnum('USER_TYPE.admin')) {
        //         countryData = countryData.sort((_c, __c) => parseInt(_c.dial_code) - parseInt(__c.dial_code))
        //     }
        //     return Lib.resSuccess(Lib.reconstructObjectKeys(countryData));
        // },
        async getCountryCodes(root, args, context, info) {
            let countryData = Lib.cloneObject(CountryCode);
            if (!context.user || context.user.userType !== Lib.getEnum('USER_TYPE.admin')) {
                countryData = countryData.sort((_c, __c) => _c.name.localeCompare(__c.name));
            }
            return Lib.resSuccess(Lib.reconstructObjectKeys(countryData));
        },
        async getState(root, args, context, info) {
            let stateData = Lib.cloneObject(State);

            if (args.data.countryCode) {
                stateData = stateData.filter((state) => state.country_code === args.data.countryCode);
            }

            return Lib.resSuccess(Lib.reconstructObjectKeys(stateData));
        },

        async getCity(root, args, context, info) {
            let cityData = Lib.cloneObject(City);

            if (args.data.stateCode) {
                cityData = cityData.filter((city) => city.stateCode === args.data.stateCode);
            }
            return Lib.resSuccess(Lib.reconstructObjectKeys(cityData));
        },

        async getPublicProfile(root, args, context, info) {
            const groupId = args.data.groupId;
            const communityId = args.data.communityId;
            const userId = args.data.userId;
            const id = context.user.id;

            const profileData = await Services.UserService.getPublicProfile(groupId, communityId, userId, id, context);

            return Lib.sendResponse(profileData);
        },

        async testFunction(root, args, context, info) {
            // let elink = "https://youtu.be/TX9qSaGXFyg";
            // let elink = "https://www.youtube.com/watch?v=TX9qSaGXFyg";

            let elink = "https://vimeo.com/channels/staffpicks/740443819";
            // let elink = "https://vimeo.com/740443819";

            elink = await Lib.getPlayBackLink(elink);
            return ({ error: false, message: "generalSuccess" });
        },
        /**
         * User member Search
         * The followings purpose are being served by this resolver
         * 1. Search user to add as family members
         * 2. Search user details
         * */
        async searchUserByMobile(root, args, context, info) {
            const result = await Services.UserService.searchUserByMobile(args, context.user ? context.user.id : null);
            return Lib.sendResponse(result);
        },
        async getFamilyMembers(root, args, context, info) {
            const userID = context.user.id;
            const familyMemberResult = await Services.UserService.getFamilyMembers(userID, args.data.search, args.data.page);
            return Lib.sendResponse(familyMemberResult);

        },
        async getFamilyMemberDetails(root, args, context, info) {
            const userId = args.data.userId;
            const familyMemberId = args.data.familyMemberId;
            const familyMemberDetailsResult = await Services.UserService.getFamilyMemberDetails(userId, familyMemberId);
            return Lib.sendResponse(familyMemberDetailsResult);
        },
        async getUserFamilyMembers(root, args, context, info) {
            const userId = args.data.userId;
            const communityId = args.data.communityId;

            const familyMemberResult = await Services.UserService.getUserFamilyMembers(userId, args.data.search, args.data.page);
            return Lib.sendResponse(familyMemberResult);
        },
        async getUserCommunityRoles(root, args, context, info) {
            try {
                const result = await Services.UserService.getUserCommunityRoles(context.user.id);
                return Lib.sendResponse(result);
            } catch (e) {
                return Lib.sendResponse({
                    error: true,
                    message: "internalServerError",
                    statusCode: Lib.getHttpErrors("SERVER_ERROR"),
                    ErrorClass: ErrorModules.FatalError,
                    stack: e
                });
            }
        },

        async getContacts(root, args, context, info) {
            // try {
            const userID = context.user.id;
            const filter = args.data && args.data.filter ? args.data.filter : 'community'; //community-wise or alphabetically sort
            const search = args.data && args.data.search ? args.data.search : '';
            const page = args.data && args.data.page ? args.data.page : '';
            const communityId = args.data && args.data.communityId ? args.data.communityId : '';
            const eventId = args.data && args.data.eventId ? args.data.eventId : '';
            const isFavourite = args.data.isFavourite ? true : false;
            const contactMemberResult = await Services.UserService.getContacts(userID, search, page, filter, isFavourite, communityId, eventId);
            return Lib.sendResponse(Lib.reconstructObjectKeys(contactMemberResult));
            // }catch (e) {
            //     clog(e);
            //     return Lib.sendResponse({error:true, message:"internalServerError", stack:e});
            // }
        },

        async getContactsMapList(root, args, context, info) {
            const userID = context.user.id;
            const search = args.data && args.data.search ? args.data.search : '';
            const contactMemberResult = await Services.UserService.getContactsMapList(userID, search);
            return Lib.sendResponse(Lib.reconstructObjectKeys(contactMemberResult));
        },

        async getHomeDetails(root, args, context, info) {
            const userId = context.user.id;
            const result = await Services.UserService.getHomeDetails(context, userId);
            return Lib.sendResponse(result);
        },

        async getAdminDashboardDetails(root, args, context, info) {
            if (context.user.userType !== "admin") {
                return Lib.sendResponse({
                    error: true,
                    message: "permissionDenied",
                    ErrorClass: ErrorModules.AuthError,
                    statusCode: Lib.getHttpErrors('FORBIDDEN')
                });
            }
            const result = await Services.UserService.getAdminDashboardDetails();
            return Lib.sendResponse(result);
        },

        async getSubLanguage(root, args, context, info) {
            const result = await Services.UserService.getSubLanguage(args.data, context)
            return Lib.sendResponse(result);
        }

    },
    Mutation: {
        /** TEST START */
        async createUser(root, args) {
            const data = args.data;
            if (!data.name) {
                throw new ErrorModules.ValidationError("Name if required");
            }
            if (Lib.isEmpty(data.email)) {
                throw new ErrorModules.ValidationError("Email is require");
            }
            if (Lib.isEmpty(data.phone)) {
                throw new ErrorModules.ValidationError("Phone number is require");
            }
            let result = await Services.UserService.createUser(data);
            if (result.error) {
                return Lib.sendResponse(result);
            }
            return Lib.resSuccess("userCreateSuccess", {
                id: result
            });
        },
        /** TEST END**/

        /** Update User **/
        async updateUser(parent, args, context, root) {
            let logUser;
            let admin = false;
            let communityId = null;

            // Check if communityId is provided
            if (args.data && args.data.communityId) {
                communityId = args.data.communityId;

                // Fetch community details
                const community = await Services.CommunityService.communityViewDetails(communityId, context);
                if (community.error) {
                    return Lib.sendResponse(community);
                }

                // Fetch user-community relationship details
                const userCommunity = await Services.UserService.getUserCommunityPortalDetails(context.getAuthUserInfo(), communityId);
                if (userCommunity.error) {
                    return Lib.sendResponse(userCommunity);
                }

                const role = userCommunity.data.role;

                // Check permissions based on role
                if (args.data.id) {
                    if (context.user.userType === "admin" || role === "board_member" || role === "executive_member") {
                        logUser = args.data.id;
                        admin = true;
                    } else {
                        return Lib.sendResponse({
                            error: true,
                            message: "permissionDenied",
                            ErrorClass: ErrorModules.AuthError,
                            statusCode: Lib.getHttpErrors('FORBIDDEN'),
                        });
                    }
                } else {
                    if (context.user.userType === "admin" || role === "board_member" || role === "executive_member") {
                        logUser = args.data.id || context.user.id;
                        admin = true;
                    } else {
                        logUser = context.user.id;
                    }
                }
            } else {
                // If no communityId is provided, allow updates for the user's own profile
                if (args.data.id && args.data.id !== context.user.id) {
                    if (context.user.userType === "admin") {
                        logUser = args.data.id;
                        admin = true;
                    } else {
                        return Lib.sendResponse({
                            error: true,
                            message: "permissionDenied",
                            ErrorClass: ErrorModules.AuthError,
                            statusCode: Lib.getHttpErrors('FORBIDDEN'),
                        });
                    }
                } else {
                    logUser = context.user.id;
                }
            }

            // Update the user's profile
            const profileUpdate = await Services.UserService.updateProfileData(logUser, args, admin);
            return Lib.sendResponse(profileUpdate);
        },

        /** Mask my date of birth */
        async maskDob(parent, args, context, root) {
            let logUser = context.user.id;
            //console.log(logUser);
            const mask = await Services.UserService.maskDob(logUser, args);
            //console.log(mask.date_of_birth.is_masked);
            //return mask.date_of_birth.is_masked
            return Lib.resSuccess('', {
                isMasked: mask.date_of_birth.is_masked
            });
        },

        /** Add member */
        async addFamilyMember(root, args, context, info) {
            let userId = context.user.id;
            const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), '');
            const communityId = userCommunity.data.community._id;
            const addMember = await Services.UserService.addFamilyMember(userId, args.data, communityId);
            return Lib.sendResponse(addMember);
        },

        async editFamilyMember(root, args, context, info) {
            let userId = context.user.id;
            const addMember = await Services.UserService.editFamilyMember(userId, args.data);

            return Lib.sendResponse(addMember);
        },
        async adminUpdateFamilyMember(root, args, context, info) {
            let userId = args.data.userId;
            const loginUserId = context.user.id;
            const User = await Services.UserService.getUserByID(loginUserId, context.user);

            const communityId = User.data.selected_organization_portal;
            const community_id = communityId.toString();

            const userCommunity = await Services.UserService.getUserCommunityPortalDetails(context.getAuthUserInfo(), community_id);
            if (userCommunity.error) {
                return Lib.sendResponse(userCommunity);
            }
            // Now check if the role is allowed to fetch the details
            const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
            if ([ROLES_ENUM.board_member, ROLES_ENUM.executive_member].includes(userCommunity.data.role)) {
                const addMember = await Services.UserService.adminUpdateFamilyMember(userId, args.data);
                console.log(addMember, "addMember..........");

                // Allowed as board_member or executive_member
                return Lib.sendResponse({
                    error: false,
                    message: "Updated successfull!",
                    statusCode: Lib.getHttpErrors('OK'),
                    data: addMember
                });
            } else {
                // Not allowed for other roles
                return Lib.sendResponse({
                    error: true,
                    message: "permissionDenied",
                    ErrorClass: ErrorModules.AuthError,
                    statusCode: Lib.getHttpErrors('FORBIDDEN')
                });
            }
        },
        /*Upload File*/
        async singleUpload(parent, { file }) {
            const { filename, mimetype, encoding } = await file;
            console.log("file.........", { filename, mimetype, encoding });
        },

        async userStatusChange(root, args, context, info) {
            const result = await Services.UserService.userStatusChange(args.id);
            if (result.error) {
                throw new result.ErrorClass(result.message);
            }
            return Lib.resSuccess("statusChangedSuccess", null);
        },
        async deleteUser(root, args, context, info) {
            const id = args.id;
            const adminId = context.user.id;
            let result = await Services.UserService.deleteUser(id, adminId);
            return Lib.resSuccess("userDeleteSuccess");

        },

        async resetUserPassword(root, args, context, info) {
            const id = args.id;
            const adminId = context.user.id;
            let result = await Services.UserService.resetUserPassword(id, adminId);
            return Lib.sendResponse(result);

        },

        async removeFamilyMember(root, args, context, info) {
            const userId = context.user.id;
            const familyMemberId = args.data.familyMemberId;
            const result = await Services.UserService.removeFamilyMember(userId, familyMemberId);
            return Lib.sendResponse(result);
        },

        async adminRemoveFamilyMember(root, args, context, info) {
            const userId = args.data.userId;
            const loginUserId = context.user.id;
            const familyMemberId = args.data.familyMemberId;

            // find logInUser CommunityID
            const User = await Services.UserService.getUserByID(loginUserId, context.user);
            const communityId = User.data.selected_organization_portal;
            console.log(communityId, "communityId................");
            const userCommunity = await Services.UserService.getUserCommunityPortalDetails(context.getAuthUserInfo(), communityId);
            if (userCommunity.error) {
                return Lib.sendResponse(userCommunity);
            }
            // Now check if the role is allowed to fetch the details
            const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
            if ([ROLES_ENUM.board_member, ROLES_ENUM.executive_member].includes(userCommunity.data.role)) {
                const result = await Services.UserService.removeFamilyMember(userId, familyMemberId);
                // Allowed as board_member or executive_member
                return Lib.sendResponse({
                    error: false,
                    message: "Removed Successfully!",
                    stateCode: Lib.getHttpErrors('OK'),
                    data: result
                })
            } else {
                // Not allowed for others roll
                return Lib.sendResponse({
                    error: true,
                    message: "permissionDenied!",
                    ErrorClass: ErrorModules.AuthError,
                    statusCode: Lib.getHttpErrors('FORBIDDEN')
                })
            }
        },

        async addToMyContact(root, args, context, info) {
            const userId = context.user.id;
            const contactId = args.data.id;
            const result = await Services.UserService.addToMyContact(userId, contactId);
            return Lib.sendResponse(result);
        },

        async addOrRemoveFavouriteContact(root, args, context, info) {
            const userId = context.user.id;
            const result = await Services.UserService.addOrRemoveFavouriteContact(userId, args.data);
            return Lib.sendResponse(result);
        },

        async removeMyContact(root, args, context, info) {
            const userId = context.user.id;
            const contactId = args.data.id;
            const result = await Services.UserService.removeMyContact(userId, contactId);
            return Lib.sendResponse(result);
        },

        async sendOtp(root, args, context, info) {
            const userId = context.user.id;
            const phone = args.data.phone;
            const phoneCode = args.data.phoneCode;
            const result = await Services.UserService.sendOtp(userId, phone, phoneCode);
            return Lib.sendResponse(result);
        },

        async deleteOwnAccount(root, args, context, info) {
            const userId = context.user.id;
            const result = await Services.UserService.deleteOwnAccount(userId);
            return Lib.sendResponse(result);
        },

        async verifySecondaryPhone(root, args, context, info) {
            const data = args.data;
            const userId = context.user.id;
            const result = await Services.UserService.verifySecondaryPhone(data, userId);
            return Lib.sendResponse(result);
        },

        async verifySecondaryPhoneOTP(root, args, context, info) {
            const otp = args.data.otp;
            const userId = context.user.id;
            const result = await Services.UserService.verifySecondaryPhoneOTP(otp, userId);
            return Lib.sendResponse(result);
        },

        async deleteSecondaryPhone(root, args, context, info) {
            const userId = context.user.id;
            const result = await Services.UserService.deleteSecondaryPhone(userId);
            return Lib.sendResponse(result);
        },

        async verifyUserEmail(root, args, context, info) {
            const email = args.data.email;
            const userId = context.user.id;
            const result = await Services.UserService.verifyUserEmail(email, userId);
            return Lib.sendResponse(result);
        },

        async verifyUserEmailOTP(root, args, context, info) {
            const otp = args.data.otp;
            const userId = context.user.id;
            const result = await Services.UserService.verifyUserEmailOTP(otp, userId);
            return Lib.sendResponse(result);
        },

        async secondaryContactAsDefault(root, args, context, info) {
            const userId = context.user.id;
            const result = await Services.UserService.secondaryContactAsDefault(userId);
            return Lib.sendResponse(result);
        },

        async bulkContactImport(root, args, context, info) {
            const userId = context.user.id;
            const communityId = args.data.id;
            const result = await Services.UserService.bulkContactImport(userId, communityId);
            return Lib.sendResponse(result);
        },

        async updateFutureLanguage(root, args, context, info) {
            const result = await Services.UserService.updateFutureLanguage(args.data);
            return Lib.sendResponse(result);
        },
    }
}
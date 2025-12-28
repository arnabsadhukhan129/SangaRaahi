const Services = require("../services");
const ErrorModules = require("../errors");
module.exports = {
    Query: {
        async getCommunityHomePageOverviewByID(root, args, context, info) {
            const id = args.data.id;
            const isOrgPortal = args.data.isOrgPortal;
            const community = await Services.CommunityWebpageService.getCommunityHomePageOverviewByID(id);
            if (community.error) {
                throw new ErrorModules.GeneralApiError(Lib.translate(community.message));
            } else {
                const communityAdminSettings = community.communityAdminSettings;
                const communitySettings = community.communitySettings;
                let result = Lib.reconstructObjectKeys(community.data);
                result.backgroupColor = communitySettings.backgroup_color;
               
                if(isOrgPortal) {
                    result.logoImage = result.orgLogoImage;
                    result.bannerImage = result.orgBannerImage;
                    result.communityDescription = result.orgCommunityDescription;
                    if(!result.logoImageApproval || !communityAdminSettings.is_approve_community_logo_image) {
                        result.logoImage = null;
                    }
                    if(!result.bannerImageApproval || !communityAdminSettings.is_approve_community_banner_image) {
                        result.bannerImage = null;
                    }
                    if(!community.isDescription || !communityAdminSettings.is_approve_community_description) {
                        result.communityDescription = null;
                    }
                    
                }
                
                return Lib.sendResponse({
                    error: community.error,
                    message: community.message,
                    ErrorClass: community.ErrorClass,
                    data: result
                });
            }
        },
        async getFeaturedCommunities(root, args, context, info) {
            const result = await Services.CommunityWebpageService.getFeaturedCommunities(args.data);
            const featuredCommunities = Lib.reconstructObjectKeys(
                result.data,
                ["created_at"],
                Lib.convertDate
            );
            const featuredCommunitiesData = {
                total: result.total,
                featuredCommunities: featuredCommunities
            }
            return Lib.sendResponse({
                error: result.error,
                message: result.message,
                ErrorClass: result.ErrorClass,
                data: featuredCommunitiesData
            });
        },
        
        async getSangaraahiCommunity(root, args, context, info) {
            const result = await Services.CommunityWebpageService.getSangaraahiCommunity(args.data);
            const featuredCommunities = Lib.reconstructObjectKeys(
                result.data,
                ["created_at"],
                Lib.convertDate
            );
            const featuredCommunitiesData = {
                total: result.total,
                featuredCommunities: featuredCommunities
            }
            return Lib.sendResponse({
                error: result.error,
                message: result.message,
                ErrorClass: result.ErrorClass,
                data: featuredCommunitiesData
            });
        },
        async getCommunityBasicDetails(root, args, context, info) {
            const id = args.data.id;
            const keyNames = args.data.keyNames;
            const isOrgPortal = args.data.isOrgPortal;
            const community = await Services.CommunityWebpageService.getCommunityBasicDetails(id, keyNames, isOrgPortal);
            if (community.error) {
                throw new ErrorModules.GeneralApiError(Lib.translate(community.message));
            } else {
                let result = Lib.reconstructObjectKeys(
                    community.data,
                    ["created_at", "updated_at", "expired_at"],
                    Lib.convertDate
                );
                return Lib.sendResponse({
                    error: community.error,
                    message: community.message,
                    ErrorClass: community.ErrorClass,
                    data: result
                });
            }
        },
        
        async getEventPaymentStatus(root, args, context, info) {
            const communityId = args.data.id;
            const community = await Services.CommunityWebpageService.getEventPaymentStatus(communityId);
            if (community.error) {
                throw new ErrorModules.GeneralApiError(Lib.translate(community.message));
            }
            return Lib.sendResponse(community);
            
        },
    },
    Mutation: {
        /**
         * ==> Update Operation of community organization
         */
        async updateHomePageOverview(root, args, context, info) {
            const data = args.data;
            const id = args.data.id;
            const userId = context.user.id;
            let result = await Services.CommunityWebpageService.updateHomePageOverview(id, data, userId);
            if (result.error) {
                throw new ErrorModules.GeneralApiError(Lib.translate(result.message));
            } else {
                return Lib.sendResponse(result);
            }
        },
        async updateCommunityFeaturedStatus(root, args, context, info) {
            const data = args.data;
            const id = args.data.id;
            const userId = context.user.id;
            let result = await Services.CommunityWebpageService.updateCommunityFeaturedStatus(id,userId);
            if (result.error) {
                throw new ErrorModules.GeneralApiError(Lib.translate(result.message));
            } else {
                return Lib.sendResponse(result);
            }
        },
        async updatefreezePaneStatus(root, args, context, info) {
            const data = args.data;
            const id = args.data.id;
            const userId = context.user.id;
            let result = await Services.CommunityWebpageService.updatefreezePaneStatus(id, userId);
            if (result.error) {
                throw new ErrorModules.GeneralApiError(Lib.translate(result.message));
            } else {
                return Lib.sendResponse(result);
            }
        },
        async updateEventPaymentStatus(root, args, context, info) {
            const data = args.data;
            const id = args.data.id;
            const userId = context.user.id;
            let result = await Services.CommunityWebpageService.updateEventPaymentStatus(id, userId);
            if (result.error) {
                throw new ErrorModules.GeneralApiError(Lib.translate(result.message));
            } else {
                return Lib.sendResponse(result);
            }
        },
        async updateCommunityAnnouncementSettings(root, args, context, info) {
            const data = args.data;
            const id = args.data.id;
            const userId = context.user.id;
            let result = await Services.CommunityWebpageService.updateCommunityAnnouncementSettings(id, data, userId);
            if (result.error) {
                throw new ErrorModules.GeneralApiError(Lib.translate(result.message));
            } else {
                return Lib.sendResponse(result);
            }
        },
        async updateCommunityAboutUsSettings(root, args, context, info) {
            const data = args.data;
            const id = args.data.id;
            const userId = context.user.id;
            let result = await Services.CommunityWebpageService.updateCommunityAboutUsSettings(id, data, userId);
            if (result.error) {
                throw new ErrorModules.GeneralApiError(Lib.translate(result.message));
            } else {
                return Lib.sendResponse(result);
            }
        }
    }
};
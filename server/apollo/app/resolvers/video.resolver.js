const Services = require("../services");
/**
 * Here write your main logic
 */
module.exports = {
    Query:{
        async getCommunityVideos(root, args, context, info) {
            const result = await Services.VideoService.getCommunityVideos(args.data);
            return Lib.sendResponse(result);
        },
        
        async getVideoDetails(root, args, context, info) {
            const link = args.data.link;
            const result = await Services.VideoService.getVideoDetails(link);
            return Lib.sendResponse(result);
        }
    },
    Mutation:{
        async addOrUpdateVideo(root, args, context, info) {
            const communityId = context.user.selectedOrganizationPortal;
            const videoData = args.data;
            const result = await Services.VideoService.addOrUpdateVideo(videoData,communityId);
            return Lib.sendResponse(result);
        },
        
        async videoSettingsAdminApproval(root, args, context, info) {
            const result = await Services.VideoService.videoSettingsAdminApproval(args.data);
            return Lib.sendResponse(result);
        },

        async resetVideo(root, args, context, info) {
            const videoId = args.data.id;
            const communityId = context.user.selectedOrganizationPortal;
            const result = await Services.VideoService.resetVideo(videoId, communityId);
            return Lib.sendResponse(result);
        },
    }
}
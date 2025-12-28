const User = Lib.Model('Users');
const Communities = Lib.Model('Communities');
const CommunitySettings = Lib.Model('CommunitySettings');
const Videos = Lib.Model('Videos');
const DatabaseError = require('../errors/database.error');
const ErrorModules = require('../errors');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const axios = require("axios");
const CommunityApprovalLog = Lib.Model('CommunityApprovalLog');
const notificationServices = require('./notification.service');

require('dotenv').config();

module.exports = {
    getCommunityVideos: async function (params) {
        const communityId = params.id;
        
        let videos
        if(params.isOrgPortal) {
            let findQuery = {community_id : new ObjectId(communityId), is_deleted : false, is_approved : true}
            videos = await Videos.find(findQuery).sort({order_no:1});
            await Promise.all(videos.map(async (video, i) => {
                if(!Lib.isEmpty(video.org_link)) {
                    video.title = video.org_title
                    video.description = video.org_description
                    video.thumbnailImage = video.org_thumbnailImage
                    video.link = video.org_link
                    video.order_no = video.org_order_no;
                    video.type =  video.org_type
                    video.duration = video.org_duration
                }else{
                    videos.splice(i);
                }
            }));
        }else{
            let findQuery = {community_id : new ObjectId(communityId), is_deleted : false}
            videos = await Videos.find(findQuery).sort({order_no:1});
        }
        return { error: false, message: "generalSuccess", data: Lib.reconstructObjectKeys(videos,["created_at"],Lib.convertIsoDate) };
    },

    getVideoDetails: async function (link) {
        const linkData = Lib.getPlayBackLink(link);
        let videoDetails = {};
        if(linkData.error) {
            return linkData;
        }
        if(linkData.type === 'Vimeo') {
            const endpoint = 'https://api.vimeo.com/videos/'+linkData.token;
            const response = await axios({
                url: endpoint,
                method: 'get',
                headers: { Authorization: `Bearer ${process.env.VIMEO_KEY}` }
            });
            const vimeo = response.data;
            
            videoDetails = {
                title:vimeo.name,
                description:vimeo.description,
                thumbnailImage:vimeo.pictures.base_link,
                link:vimeo.player_embed_url,
                type: linkData.type,
                duration: new Date(vimeo.duration * 1000).toISOString().substring(14, 19)
            }
        }else if(linkData.type === 'Youtube') {
            let endpoint;
            if(linkData.isPlaylist) {
                endpoint = 'https://www.googleapis.com/youtube/v3/playlists?part=contentDetails&id='+linkData.token+'&key='+process.env.YOUTUBE_KEY+'&part=snippet';
            }else {
                endpoint = 'https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id='+linkData.token+'&key='+process.env.YOUTUBE_KEY+'&part=snippet';
            }
            const response = await axios.get(endpoint);
            if(response.data.items.length > 0) {
                const youtube = response.data.items[0].snippet;
                let duration = response.data.items[0]['contentDetails']['duration'];
                videoDetails = {
                    title:youtube.title,
                    description:youtube.description,
                    thumbnailImage:youtube.thumbnails.default.url,
                    link:linkData.link,
                    type: linkData.type,
                    duration: !linkData.isPlaylist ? Lib.convertDuration(duration) : null
                }
            }
        }
        return { error: false, message: "generalSuccess", data: videoDetails };
    },

    addOrUpdateVideo: async function (videoData, communityId) {
        const communitySettings = await CommunitySettings.findOne({ community_id: ObjectId(communityId) });
        const community = await Communities.findOne({
            _id: ObjectId(communityId)
        });
        const communityName = community.community_name;

        if (!communitySettings) {
        return { error: true, code: 404, message: 'communitySettingsNotFound' };
        }

        const freezePane = communitySettings.freeze_pane;
        let isChangeRequestNotify = false;

        let freezeStatus = false;
        await Promise.all(videoData.map(async element => {
            let linkData = {};
            let isDeleted = false;
            if(!Lib.isEmpty(element.link)) {
                linkData = Lib.getPlayBackLink(element.link);
                if(linkData.error) {
                    return linkData;
                }
            }else{
                linkData.link = "";
                isDeleted = true;
            }
            if(element.id){
                const video = await Videos.findOne({_id : new ObjectId(element.id),communityId : new ObjectId(communityId)} );
                if(video) {
                    // Checking if freeze pane is on and if there is any video link changed
                    if (freezePane && !Lib.stringCompare(video.link,linkData.link)) {
                        // Checking previous video changes available or not
                        const  videoApprovalLog = await CommunityApprovalLog.findOne({community_id:ObjectId(communityId), field:"video", content_id:ObjectId(element.id), is_approved: false, is_acknowledged:false});
                        // Changing the previous video acknowledge status
                        if(videoApprovalLog) {
                            videoApprovalLog.is_acknowledged = true;
                            await videoApprovalLog.save();
                        }
                        // Create log for new video
                        await CommunityApprovalLog.create({
                            community_id : new ObjectId(communityId),
                            type : "Video",
                            field : "video",
                            fieldname : "video",
                            content : linkData.link,
                            content_id:ObjectId(element.id)
                        });
                        isChangeRequestNotify = true;
                        freezeStatus = true;
                        // Changing the approval status to false
                        // video.is_approved = false;

                        
                    }else {
                        video.org_title = element.title;
                        video.org_description = element.description;
                        video.org_thumbnail_image = element.thumbnailImage;
                        video.org_link = linkData.link;
                        video.org_order_no = element.orderNo;
                        video.org_type = linkData.type;
                        video.org_duration = element.duration;
                    } 

                    // Saving all new changes
                    video.title = element.title;
                    video.description = element.description;
                    video.thumbnail_image = element.thumbnailImage;
                    video.link = linkData.link;
                    video.order_no = element.orderNo;
                    video.type = linkData.type;
                    video.duration = element.duration;
                    video.is_deleted = isDeleted;
                    await video.save();                   
                }
            }else{
                const res = await Videos.create({
                    community_id: new ObjectId(communityId),
                    title:element.title,
                    description:element.description,
                    thumbnail_image:element.thumbnailImage,
                    link:linkData.link,
                    order_no:element.orderNo,
                    type : linkData.type,
                    duration : element.duration,

                    org_title: freezePane ? '' :element.title,
                    org_description: freezePane ? '' :element.description,
                    org_thumbnail_image: freezePane ? '' :element.thumbnailImage,
                    org_link: freezePane ? '' :linkData.link,
                    org_order_no: freezePane ? '' :element.orderNo,
                    org_type : linkData.type,
                    org_duration : freezePane ? '' :element.duration,

                    is_approved : freezePane ? false : true,
                    is_deleted: isDeleted
                })
                isChangeRequestNotify = true;
                if(freezePane) {
                    // Create log for new video
                    await CommunityApprovalLog.create({
                        community_id : new ObjectId(communityId),
                        type : "Video",
                        field : "video",
                        fieldname : "video",
                        content : linkData.link,
                        content_id:ObjectId(res._id)
                    });
                    freezeStatus = true;
                }
            }
        }));
        
        if(freezeStatus) {
            communitySettings.webpage_approval_status = "not_approved";
            await communitySettings.save();
        }
        if (isChangeRequestNotify) {
            // Getting admin details
            const admin = await User.findOne({ "user_type": "admin" });
            // Fetching admin device token 
            let webToken = [];
            if (admin) {
                webToken = admin.device_details.filter( device => device.is_active === true ).map(device => device.web_token);
            }
            await communitySettings.save();
            // sending notification to admin
            const payload = {
                recipient:
                {
                    user_id: '',
                    fcmToken: webToken
                },
                template: {
                    type: "Push",
                    slug: "comunity-changes",
                    lang: "en"
                },
                contents: {
                    COMMUNITYNAME: communityName,
                    SECTION: "Video Page"
                },
                isDotCom: true,
                section: "video",
                communityId : new ObjectId(communityId)
            }
            await notificationServices.notifyService(payload);
        }
        return { error: false, message: "videoSavedSuccess"};
    },

    videoSettingsAdminApproval: async function (data) {
        await Promise.all(data.map(async element => {
            const video = await Videos.findOne({_id : new ObjectId(element.id), is_deleted : false});
            
            video.is_approved = element.isApprove;
            await video.save()
        }));
        return { error: false, message: "videoSettingsStatusSuccess"};
    },

    resetVideo: async function (videoId, communityId) {
        const video = await Videos.findOne({_id : new ObjectId(videoId), community_id : new ObjectId(communityId)});
        if (!video) {
            return { error: true, code: 404, message: 'No video found.' };
        }
        video.is_deleted = true;
        await video.save();
        const log = await CommunityApprovalLog.findOne({content_id : new ObjectId(videoId), community_id : new ObjectId(communityId)});
        if(log) {
            log.is_acknowledged = true;
            await log.save();
        }
        return { error: false, message: "videoResetSuccess"};
    },
    
}
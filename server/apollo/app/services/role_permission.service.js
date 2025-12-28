const Events = Lib.Model('Events');
const Blogs = Lib.Model('Blogs');
const Communities = Lib.Model('Communities');
const User = Lib.Model('Users');
const RolePermissions = Lib.Model('RolePermissions');
const CommunityRoles = Lib.Model('CommunityRoles');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const ErrorModules = require('../errors');

const mapRolePermission = (rolePermission) => {
    return {
        id: rolePermission._id ? rolePermission._id.toString() : null,
        communityId: rolePermission.community_id ? rolePermission.community_id.toString() : null,
        role: rolePermission.role,
        permissionforRole: {
            canCreate: rolePermission.role_permission.can_create,
            canEdit: rolePermission.role_permission.can_edit,
            canView: rolePermission.role_permission.can_view,
            canDelete: rolePermission.role_permission.can_delete
        },
        commuhityManagement: {
            globalSettings: rolePermission.community_management.global_settings,
            manageWebPage: rolePermission.community_management.manage_webPage,
            phoneNumberVerification: rolePermission.community_management.phone_number_verification,
            canProfileEdit: rolePermission.community_management.can_profile_edit
        },
        mail: {
            canDelete: rolePermission.mail.can_delete,
            canStatusChange: rolePermission.mail.can_status_change,
            canSend: rolePermission.mail.can_send,
            canEdit: rolePermission.mail.can_edit
        },
        member: {
            canOnboard: rolePermission.member.can_onboard,
            canEdit: rolePermission.member.can_edit,
            canView: rolePermission.member.can_view,
            canDelete: rolePermission.member.can_delete,
            canPromoteDemote: rolePermission.member.can_promote_demote
        },
        event: {
            canCreate: rolePermission.event.can_create,
            canEdit: rolePermission.event.can_edit,
            canView: rolePermission.event.can_view, 
            canDelete: rolePermission.event.can_delete,
            canFrequency: rolePermission.event.can_frequency
        },
        group: {
            canCreate: rolePermission.group.can_create,
            canEdit: rolePermission.group.can_edit,
            canView: rolePermission.group.can_view,
            canDelete: rolePermission.group.can_delete
        },
        webSite: {
            canEditHomepage: rolePermission.webSite.can_edit_homepage,
            canEditAnnouncement: rolePermission.webSite.can_edit_announcement,
            canEditVideos: rolePermission.webSite.can_edit_videos,
            canEditPayments: rolePermission.webSite.can_edit_payments,
            canEditAboutus: rolePermission.webSite.can_edit_aboutus
        },
        blog: {
            canCreate: rolePermission.blog.can_create,
            canEdit: rolePermission.blog.can_edit,
            canView: rolePermission.blog.can_view,
            canDelete: rolePermission.blog.can_delete
        },
        announcement: {
            canCreate: rolePermission.announcement.can_create,
            canEdit: rolePermission.announcement.can_edit,
            canView: rolePermission.announcement.can_view,
            canDelete: rolePermission.announcement.can_delete
        },
        checkin: {
            canView: rolePermission.checkin.can_view,
            canCheck: rolePermission.checkin.can_check,
        },
        emailResponse: {
            canView: rolePermission.email_response.can_view,
            canReply: rolePermission.email_response.can_reply
        },
        activityLog: {
            canViewApp: rolePermission.activity_log.can_view_app,
            canViewWeb: rolePermission.activity_log.can_view_web
        }
    };
};

module.exports = {
    getRolePermissions: async (data) => {
        try {
            const { communityId, role } = data;
            // check role permissions exist for given communityId and role
            let rolePermission = await RolePermissions.findOne({ community_id: communityId, role: role });

            //If role permission does not exist create new record
            if (!rolePermission) {
                rolePermission = new RolePermissions({
                    community_id: communityId,
                    role: role,
                    role_permission: {
                        can_create: true,
                        can_edit: true,
                        can_view: true,
                        can_delete: true
                    },
                    community_management: {
                        global_settings: true,
                        manage_webPage: true,
                        phone_number_verification: true,
                        can_profile_edit: true
                    },
                    member: {
                        can_onboard: true,
                        can_edit: true,
                        can_view: true,
                        can_delete: true,
                        can_promote_demote: true
                    },
                    group: {
                        can_create: true,
                        can_edit: true,
                        can_view: true,
                        can_delete: true
                    },
                    mail: {
                        can_delete: true,
                        can_status_change: true,
                        can_send: true,
                        can_edit: true
                    },
                    webSite: {
                        can_edit_homepage: true,
                        can_edit_announcement: true,
                        can_edit_videos: true,
                        can_edit_payments: true,
                        can_edit_aboutus: true
                    },
                    event: {
                        can_create: true,
                        can_edit: true,
                        can_view: true,
                        can_delete: true,
                        can_frequency: true
                    },
                    blog: {
                        can_create: true,
                        can_edit: true,
                        can_view: true,
                        can_delete: true
                    },
                    checkin: {
                        can_view: true,
                        can_check: true
                    },
                    announcement: {
                        can_create: true,
                        can_edit: true,
                        can_view: true,
                        can_delete: true
                    },
                    email_response: {
                        can_view: true,
                        can_reply: true
                    },
                    activity_log: {
                        can_view_app: true,
                        can_view_web: true
                    },
                    created_at: new Date(),
                });
                await rolePermission.save();
            }
            const mappedRolePermission = mapRolePermission(rolePermission);

            return {
                error: false,
                code: 200,
                message: "rolePermissionsFetchedSuccess",
                data: mappedRolePermission
            }
        } catch (error) {
            console.log(error);
            return {
                error: true,
                code: 500,
                message: "Error fetching role permissions",
                data: null
            }
        }
    },
    updateRolePermissions: async (data) => {
        try {
            const { id, permissionforRole, communityManagement, member, group, mail, webSite, event, blog, announcement, 
                checkin, emailResponse, activityLog } = data;

            // Find existing role permission record by id
            let rolePermission = await RolePermissions.findById(id);
            
            if (!rolePermission) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'ROLE_PERMISSION_NOT_FOUND',
                    message: 'Role permission not found',
                    data: null
                };
            }

            // Update fields if provided

            if(permissionforRole) {
                rolePermission.role_permission = {
                    ...rolePermission.role_permission,
                    ...permissionforRole
                };
            }

            if(communityManagement) {
                rolePermission.community_management = {
                    ...rolePermission.community_management,
                    ...communityManagement
                };
            }

            if (member) {
                rolePermission.member = {
                    ...rolePermission.member,
                    ...member
                };
            }

            if (group) {
                rolePermission.group = {
                    ...rolePermission.group,
                    ...group
                };
            }

            if (mail) {
                rolePermission.mail = {
                    ...rolePermission.mail,
                    ...mail
                };
            }
            
            if (webSite) {
                rolePermission.webSite = {
                    ...rolePermission.webSite,
                    ...webSite
                };
            }

            if (event) {
                rolePermission.event = {
                    ...rolePermission.event,
                    ...event
                };
            }

            if (blog) {
                rolePermission.blog = {
                    ...rolePermission.blog,
                    ...blog
                };
            }

            if (announcement) {
                rolePermission.announcement = {
                    ...rolePermission.announcement,
                   ...announcement
                };
            }

            if (checkin) {
                rolePermission.checkin = {
                    ...rolePermission.checkin,
                   ...checkin
                };
            }

            if (emailResponse) {
                rolePermission.email_response = {
                    ...rolePermission.email_response,
                   ...emailResponse
                };
            }

            if (activityLog) {
                rolePermission.activity_log = {
                    ...rolePermission.activity_log,
                   ...activityLog
                };
            }

            // Update the update_at timestamp
            rolePermission.update_at = new Date();

            // Save the updated role permission record
            await rolePermission.save();

            return {
                error: false,
                code: 200,
                systemCode: 'ROLE_PERMISSION_UPDATED_SUCCESS',
                message: 'Role permission updated successfully',
                data: { id: rolePermission._id.toString() }
            };
        } catch (error) {
            console.log(error);
            return {
                error: true,
                code: 500,
                systemCode: 'INTERNAL_SERVER_ERROR',
                message: 'Error updating role permissions',
                data: null
            };
        }
    },
    addCommunityRole: async (params, communityId) => {
        try {
            const name = params.name;
            const memberId = params.memberId;
            const slug = name.replace(/\s+/g, '_').toLowerCase();
            const existRole = await CommunityRoles.findOne({
                community_id: new ObjectId(communityId),
                slug
            });
            if (existRole) {
                return ({error: true, message: "This role already exist", ErrorClass:ErrorModules.DenialError});
            }
            // Role Add
            const role = await CommunityRoles.create({
                community_id: new ObjectId(communityId),
                name,
                slug
            });
            const rolePermission = new RolePermissions({
                community_id: communityId,
                role: slug,
                member: {
                    can_onboard: false,
                    can_edit: false,
                    can_view: false,
                    can_delete: false,
                    can_promote_demote: false
                },
                event: {
                    can_create: false,
                    can_edit: false,
                    can_view: false,
                    can_delete: false,
                    can_frequency: false
                },
                group: {
                    can_create: false,
                    can_edit: false,
                    can_view: false,
                    can_delete: false
                },
                blog: {
                    can_create: false,
                    can_edit: false,
                    can_view: false,
                    can_delete: false
                },
                announcement: {
                    can_create: false,
                    can_edit: false,
                    can_view: false,
                    can_delete: false
                },
                checkin: {
                    can_view: false,
                    can_check: false,
                },
                created_at: new Date(),
            });
            await rolePermission.save();
            if (role._id && !Lib.isEmpty(memberId)) {
                
                await Communities.updateOne(
                    {
                        '_id': ObjectId(communityId),
                        'is_deleted': false,
                        'members.member_id': new ObjectId(memberId)
                    },
                    {
                        $set: {
                            'members.$[xxx].roles.1': slug
                        }
                    },
                    {
                        arrayFilters: [
                            { 
                                "xxx.member_id": new ObjectId(memberId),
                                "xxx.is_approved": true,
                                "xxx.is_rejected": false,
                                "xxx.is_active": true,
                                "xxx.is_leaved": false,
                                "xxx.is_deleted": false
                            }
                        ]
                    }
                );
            } else {
                return { error: true, code: 500, systemCode: 'INTERNAL_SERVER_ERROR', message: 'Error found on role creation' };
            }
            return {
                error: false,
                code: 200,
                systemCode: 'SUCCESS',
                message: 'Role added successfully',
                data: { slug }
            };

        }
        catch (error) {
            console.log(error);
            return { error: true, code: 500, systemCode: 'INTERNAL_SERVER_ERROR', message: 'Error found on role creation' };
        }
        
    },
    
    getCommunityCreatedRoles: async (params, communityId) => {
        try {
            // const { page, sort, columnName, search } = params;
            let page;
            if(params && params.page){
                page = parseInt(params.page);
            } else {
                page = 1;
            }
            
            const limit = params.limit ? params.limit : 10;
            const skip = (page - 1) * limit;

            let sortObject = {};
            let key="created_at";
            let sort = -1;
            if(params && params.columnName && params.sort) {
                if(params.columnName === 'name'){
                    key = 'name';
                }
                if(params.sort === 'asc'){
                    sort = 1;
                }
            }
            sortObject[key] = sort;
            roleAggregate = [
                {
                    '$match':{
                        'community_id' : new ObjectId(communityId),
                        'is_deleted': false
                    }
                },
            ];
            if(params && params.search) {
                roleAggregate[0]['$match']['name'] = {
                    $regex: `.*${params.search}.*`,
                    $options: 'i'
                };
            }
            const role = await CommunityRoles.aggregate(roleAggregate).collation({'locale':'en'}).sort(sortObject).skip(skip).limit(limit);            
            const total = await CommunityRoles.aggregate(roleAggregate);

            const from = (page - 1) * limit + 1;
            const to = Math.min(page * limit, total.length);
            
            return ({error: false, message: "generalSuccess",total:total.length, from, to,  data: Lib.reconstructObjectKeys(role)});
        } catch (error) {
            console.log(error);
            return {
                error: true,
                code: 500,
                message: "Error fetching roles",
                data: null
            }
        }
    },
    getUnAssignedMembers: async function(communityId) {
        try {
            const allRoles = await this.getAllCreatedDotNetRole();
            let aggregate = [
                {
                  $match: {
                    _id: new ObjectId(communityId),
                    is_active: true,
                    is_deleted: false,
                  },
                },
                {
                  $unwind: {
                    path: "$members",
                  },
                },
                {
                  $match: {
                    "members.roles": { $nin: allRoles.data },
                    "members.is_approved": true,
                    "members.is_rejected": false,
                    "members.is_leaved": false,
                    "members.is_deleted": false,
                  },
                },
                {
                    $lookup: {
                      from: "sr_users",
                      localField: "members.member_id",
                      foreignField: "_id",
                      as: "members.user",
                    },
                },
                {
                    $unwind: {
                        path: "$members.user",
                    },
                },
                {
                    $match: {
                        "members.user.is_deleted": false,
                        "members.user.is_active": true,
                    }
                },
            ];
            const members = await Communities.aggregate(aggregate);
            const membersResult = Lib.reconstructObjectKeys(members,["user"], function (value, key) {
                return Lib.generalizeUser(value);
            });
            
            return ({ error: false, message: "generalSuccess", data: membersResult });
        } catch (error) {
            console.log(error);
            throw new ErrorModules.DatabaseError("User find error");
        }
    },
    assignUsherRole: async (params, communityId) => {
        try {
            const memberId = params.memberId;
            const slug = params.slug;
            const existRole = await CommunityRoles.findOne({
                community_id: new ObjectId(communityId),
                slug
            });
            if (!existRole) {
                return ({error: true, message: "This role Doesn't exist", ErrorClass:ErrorModules.DenialError});
            }
            
            if (!Lib.isEmpty(memberId)) {
                
                await Communities.updateOne(
                    {
                        '_id': ObjectId(communityId),
                        'is_deleted': false,
                        'members.member_id': new ObjectId(memberId)
                    },
                    {
                        $set: {
                            'members.$[xxx].roles.1': slug
                        }
                    },
                    {
                        arrayFilters: [
                            { 
                                "xxx.member_id": new ObjectId(memberId),
                                "xxx.is_approved": true,
                                "xxx.is_rejected": false,
                                "xxx.is_active": true,
                                "xxx.is_leaved": false,
                                "xxx.is_deleted": false
                            }
                        ]
                    }
                );
            } else {
                return { error: true, code: 500, systemCode: 'INTERNAL_SERVER_ERROR', message: 'Error found on role creation' };
            }
            return {
                error: false,
                code: 200,
                systemCode: 'SUCCESS',
                message: 'Member assigned successfully'
            };

        }
        catch (error) {
            console.log(error);
            return { error: true, code: 500, systemCode: 'INTERNAL_SERVER_ERROR', message: 'Error found on role creation' };
        }
        
    },
    getUsherAssignedMembers: async (params,communityId) => {
        try {
            const slug = params.slug;
            let aggregate = [
                {
                  $match: {
                    _id: new ObjectId(communityId),
                    is_active: true,
                    is_deleted: false,
                  },
                },
                {
                  $unwind: {
                    path: "$members",
                  },
                },
                {
                  $match: {
                    "members.roles": { $in: [slug] },
                    "members.is_approved": true,
                    "members.is_rejected": false,
                    "members.is_leaved": false,
                    "members.is_deleted": false,
                  },
                },
                {
                    $lookup: {
                      from: "sr_users",
                      localField: "members.member_id",
                      foreignField: "_id",
                      as: "members.user",
                    },
                },
                {
                    $unwind: {
                        path: "$members.user",
                    },
                },
                {
                    $match: {
                        "members.user.is_deleted": false,
                        "members.user.is_active": true,
                    }
                },
            ];
            const members = await Communities.aggregate(aggregate);
            const membersResult = Lib.reconstructObjectKeys(members,["user"], function (value, key) {
                return Lib.generalizeUser(value);
            });
            
            return ({ error: false, message: "generalSuccess", data: membersResult });
        } catch (error) {
            console.log(error);
            throw new ErrorModules.DatabaseError("User find error");
        }
    },
    getAllCreatedDotNetRole: async function() {
        try {
            const allroles = ["board_member", "executive_member"]
            const rolePermission = await CommunityRoles.find();
            
            await Promise.all(rolePermission.map(async (item) => {
                allroles.push(item.slug);
            }));
            
            return {
                error: false,
                code: 200,
                message: "rolePermissionsFetchedSuccess",
                data : allroles
            }
        } catch (error) {
            console.log(error);
            return {
                error: true,
                code: 500,
                message: "Error fetching role permissions",
                data: null
            }
        }
    },
}
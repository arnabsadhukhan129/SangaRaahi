// const ErrorModules = require('../errors');
// const User = Lib.Model('Users');
// const Communities = Lib.Model('Communities');
// const mongoose = require("mongoose");
// const { ObjectId } = mongoose.Types;
// module.exports = {
//     appCommunityPermissionCheck: async function(resolve, root, args, context, info) {
//         const organisationPermissionRequests = Lib.getAppConfig('SELECTED_APP_COMMUNITY_PERMISSION_ROUTES', []);
//         if(organisationPermissionRequests.includes(info.fieldName)) {
//             const user = await User.findOne({ "_id": ObjectId(context.user.id) ,"is_active":true,"is_deleted":false});
//             if (args.data.isAppPortal) {
//                 if(!user.selected_community){
//                     return { error: true, message: 'userNoDefaultCommunityPortal', code: 403 }; 
//                 }else{
//                     const community = await Communities.aggregate([
//                         {
//                             $match:{
//                                 _id: new ObjectId(user.selected_community),
//                                 is_active: true,
//                                 is_deleted:false
//                             }
//                         },
//                         {
//                             $unwind:{
//                                 path:"$members"
//                             }
//                         },
//                         {
//                             $match:{
//                                 "members.member_id": new ObjectId(context.user.id),
//                                 'members.is_deleted' : false,
//                                 'members.is_active' : true,
//                                 'members.is_approved' : true,
//                                 'members.is_leaved' : false,
//                             }
//                         }
//                     ]);
    
//                     if(Lib.isEmpty(community)) {
//                         return { error: true, message: 'permissionDenied', code: 403 };
//                     }
//                 }
//             }
//         }
//         return resolve(root, args, context, info);
//     }
// }
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const {ObjectId} = mongoose.Types;
const MailList = Lib.Model('MailList');
const MailListLog = Lib.Model('MailListLog');
const ErrorModules = require('../errors');

module.exports = {
    //Query
    getAllMailList: async(data) => {
        const search = data.search;
        const page = data.page || 1;
        const limit = data.limit || 10;
        const communityId = data.communityId;
        let sortObject = {};
        let key = "created_at";
        let sort = -1;
        if (data && data.columnName && data.sort) {
            if (data.columnName === 'ContactName') {
                key = 'contact_name';
            }else if(data.columnName === 'DateSort'){
                key = 'created_at';
            }
            if (data.sort === 'asc') {
                sort = 1; //sort a to z
            } else if (data.sort === 'desc') {
                sort = -1; //sort z to a
            }
        }
        sortObject[key] = sort;
        let filter = {is_deleted: false}
        if(communityId) filter.community_id = ObjectId(communityId);
        // if(search) filter.contact_name = new RegExp(search,'i');
        if (search) filter.contact_name = new RegExp(search,'i');

        const pipeline = [
            {$match: filter},
            {
                '$lookup': {
                    'from': 'sr_communities',
                    'localField': 'community_id',
                    'foreignField': '_id',
                    'as': 'community'
                }
            },
            {
                $project: {
                    community_id: 1,
                    contact_email: 1,
                    contact_name:1,
                    phone_code: 1,
                    phone_no:1,
                    contact_type:1,
                    is_deleted:1,
                    created_at: {
                        $dateToString: {
                            format: '%Y-%m-%dT%H:%M:%S.%LZ',
                            date: '$created_at'
                        }
                    },
                }
            },
            { $sort: { created_at: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];
        try {
            const mailList = await MailList.aggregate(pipeline).collation({ 'locale': 'en' }).sort(sortObject);
            const total = await MailList.countDocuments(filter);
            const from = (page -1) * limit+1;
            const to = Math.min(page * limit, total);
            return {
                error: false,
                message: "generalSuccess",
                total: total,
                from: from,
                to: to,
                data: mailList
            };
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_FETCHING_MAIL_LIST',
                message: error.message,
                data: null
            };
        }

    },
    getAllMailListLogs: async(data) => {
        const search = data.search;
        const page = data.page || 1;
        const limit = data.limit || 10;
        const communityId = data.communityId;
        let sortObject = {};
        let key ="created_at";
        let sort = -1;
        if(data && data.columnName && data.sort) {
            if (data.columnName === "DataSort") {
                key = "created_at";
            }
            if (data.sort === "asc") {
                sort = 1
            }
        }
        sortObject[key] = sort;
        let filter = {is_deleted: false}
        if(communityId) filter.community_id = ObjectId(communityId);
        // if(search) filter.contact_name = new RegExp(search,'i');
        if (search) filter.contact_name = new RegExp(search,'i');

        const pipeline = [
            {$match: filter},
            {
                '$lookup': {
                    'from': 'sr_communities',
                    'localField': 'community_id',
                    'foreignField': '_id',
                    'as': 'community'
                }
            },
            {
                $project: {
                    community_id: 1,
                    contact_email: 1,
                    contact_name:1,
                    phone_code: 1,
                    phone_no:1,
                    created_at: {
                        $dateToString: {
                            format: '%Y-%m-%dT%H:%M:%S.%LZ',
                            date: '$created_at'
                        }
                    },
                }
            },
            { $sort: { created_at: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];
        try {
            const mailListLog = await MailListLog.aggregate(pipeline).collation({ 'locale': 'en' }).sort(sortObject);
            const total = await MailListLog.countDocuments(filter);
            const from = (page -1) * limit+1;
            const to = Math.min(page * limit, total);
            return {
                error: false,
                message: "generalSuccess",
                total: total,
                from: from,
                to: to,
                data: mailListLog
            };
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_FETCHING_MAIL_LIST',
                message: error.message,
                data: null
            };
        }

    },
    getMailListByID: async (data) => {
        const id = data.mailId;
    
        try {
            const mailList = await MailList.findOne({ _id: ObjectId(id),is_deleted:false });
    
            if (!mailList) {
                throw new ErrorModules.Api404Error("Mail list not found");
            }
    
            const mailListData = {
                id: mailList._id,
                communityId: mailList.community_id,
                contactEmail: mailList.contact_email,
                contactName: mailList.contact_name,
                phoneCode: mailList.phone_code,
                phoneNo: mailList.phone_no,
                contactType: mailList.contact_type,
                isDeleted: mailList.is_deleted,
                createdAt: mailList.created_at.toISOString(),
                updatedAt: mailList.updated_at ? mailList.updated_at.toISOString() : null
            };
            return {
                error: false,
                code: 200,
                systemCode: 'MAIL_LIST_FOUND',
                message: 'Mail list found',
                data: mailListData
            };
        } catch (error) {
            console.error("Error fetching mail list:", error);
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_FETCHING_MAIL_LIST',
                message: error.message,
                data: null
            };
        }
    },

    //Mutation 
    deleteMailList: async(id) => {
        try {
            const mailListObj = {
                "is_deleted": true
            }
            let updateMailList = await MailList.findOneAndUpdate ({_id: ObjectId(id)},{"$set": mailListObj});
            return ({ error: false, message: "generalSuccess", data: updateMailList });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Mail List find error");
        }
    }
}


module.exports = function (gql) {
    return gql
    `
    scalar JSON
    type ActivityLogs {
        id: String,
        communityId: String,
        userId: String,
        userName: String,
        memberRole: [String],
        communityName: String,
        module: String,
        action: String,
        oldData: JSON,
        newData: JSON,
        platForm: String,
        createdAt: String,
        updatedAt: String
    }
    type Logs {
        total: Int,
        from: Int,
        to: Int,
        alllogs: [ActivityLogs]
    }
    
    input LogsFindInput {
        communityId: String,
        userId: String,
        action: String,
        module: String,
        sort: String,
        platForm: String,
        memberRole: String,
        page: Int,
        limit: Int
    }

    type AllActivityLogResponse implements Response {
        error: Boolean,
        code: Int,
        systemCode: String,
        message: String,
        data: Logs
    }
    extend type Query {
        getAllActivityLogs(data:LogsFindInput) : AllActivityLogResponse
    }
    `
}
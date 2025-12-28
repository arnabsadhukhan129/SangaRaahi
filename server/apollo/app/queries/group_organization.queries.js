module.exports = function (gql) {
    return gql`
    ## Type Construct Start

    type CommunityGroup {
        name: String,
        description: String,
        image: String,
        type: String,
        members: [CommunityMemberType]
        events: [GroupEvent]
        memberCount: Int
        myCommunity : Community
    }
    type GroupAvalible {
        id: String,
        name: String,
    }

    type GroupEvent {
        id: String,
        title: String,
    }

    ###### Input types ######

    input UpdateMycommunityGroupField {
        name: String,
        description: String,
        image: String,
        type: GroupType
        members: [String]
    }
    input InputCreateGroup {
        name: String!,
        description: String,
        image: String,
        type: GroupType
        members: [String]
    }
    input InputCommunityId {
        communityId: String,
        search:String
        groupType:String
        page: Int,
        isActive: Boolean,
        columnName: String,
        sort: String,
    }
    input InputEventId {
        eventId: String,
        search:String
        page: Int,
        limit: Int
        type: GroupType
    }

## Response Type Construct End      
type AllAvailableGroupResponse implements Response {
    error:Boolean,
    systemCode:String,
    code:Int,
    message:String,
    data: [GroupAvalible]
}
type MyCommunityGroupByIdResponse implements Response {
    error:Boolean,
    systemCode:String,
    code:Int,
    message:String,
    data:CommunityGroup
} 

extend type Query{
    getMyCommunityGroup(data: InputCommunityId): AllGroupResponse,
    getMyCommunityGroupList(data: InputCommunityId): AllGroupResponse,
    getMyCommunityGroupByID(id: ID): MyCommunityGroupByIdResponse,
    getAvailableGroups(data: InputEventId) : AllAvailableGroupResponse
}

extend type Mutation {
    groupOrgStatusChange(id: String!): GeneralResponse,
    updateMyCommunityGroup(id: String!,data: UpdateMycommunityGroupField): UpdateGroupResponse,
    myCommunityCreateGroup(data: InputCreateGroup): InsertGroupResponse,
    deleteMyCommunityGroup(data: GeneralIdInput): DeleteGroupResponse
    removeOrgGroupMember(data: InputRemoveMember) : GeneralResponse
}
`
}
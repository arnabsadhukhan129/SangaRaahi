module.exports = function (gql) {
    return gql`
    
    type AllEventType {
        type: String!
        count: Int!
    }

    type AllEventByUser {
        communityName: String,
        count: Int
    }
    
    type CommunityContribution {
        communityName: String
        communityId: ID
        totalContribution: Int,
        currency: String
    }

    type SpentAmmountVsTimeLine {
        month: String
        totalSpentAmmount: Int
        currency: String
    }

    type EventTypeAnalytics {
        allEventTypeAnalytics: [AllEventType]
    }

    type EventByUserAnalytics {
        allEventByUserAnalytics: [AllEventByUser]
    }
    
    type CommunityContributionAnalytics {
        communityContributionAnalytics: [CommunityContribution]
        totalContribution: Int!
        currency: String
    }
    
    type SpentAmmountVsTimeLineAnalytics {
        spentAmmountVsTimeLine: [SpentAmmountVsTimeLine]
    }
    input eventTypeParticipationInput {
        communityId: String,
        userId: String,
        startDate: String,
        endDate: String
    }
    
    input CommunityContributionInput {
        startDate: String
        endDate: String
        communityId: ID
        userId: ID
    }

    type AllEventTypeResponse implements Response {
        error: Boolean,
        code: Int,
        systemCode: String,
        message: String,
        data: EventTypeAnalytics
    }

    type AllEventByUserResponse implements Response {
        error: Boolean,
        code: Int,
        systemCode: String,
        message: String,
        data: EventByUserAnalytics
    }
    
    type CommunityContributionResponse implements Response {
        error: Boolean
        code: Int
        systemCode: String
        message: String
        data: CommunityContributionAnalytics
    }
    type SpentAmmountVsTimeLineResponse implements Response {
        error: Boolean
        code: Int
        systemCode: String
        message: String
        data: SpentAmmountVsTimeLineAnalytics
    }

    extend type Query{
        getParticipationByEventTpe(data: eventTypeParticipationInput) : AllEventTypeResponse,
        getEventParticipationByUser(data: eventTypeParticipationInput): AllEventByUserResponse,
        getCommunityContribution(data: CommunityContributionInput): CommunityContributionResponse,
        getCurrentCommunityContribution(data: CommunityContributionInput): CommunityContributionResponse,
        mySpentAmmountVsTimeLine(data: CommunityContributionInput): SpentAmmountVsTimeLineResponse
    }
    `
}
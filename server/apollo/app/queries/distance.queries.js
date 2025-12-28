module.exports = function(gql) {
    return gql`
    input DistanceInput {
        distance: Int
    }
    type InsertDistanceResponse implements Response {
        error: Boolean
        code: Int
        systemCode: String
        message: String
        data: Id
    }
    extend type Mutation{
        addOrUpdateDistance(data: DistanceInput): InsertDistanceResponse
    }
    `
}
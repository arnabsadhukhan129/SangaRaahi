module.exports = function (gql) {
    return gql`
    type Blogs {
        id: String,
        eventId: String,
        eventName: String,
        postedBy: String,
        role: String,
        thumbnailImage:String,
        image:[String],
        pdf:[String],
        blogTitle:String,
        blogCategory:String,
        blogDescription:String,
        blogShortDesc:String,
        fbLink:String,
        twitterLink:String,
        likedinLink:String,
        blogStatus:Boolean,
        paymentStatus:Boolean,
        paymentStatusTimestamp:String,
        paymentStatusTimeVerify:Boolean,
        createdAt:String,
    }
    type AllBlogs {
        total : Int,
        from:Int,
        to:Int
        blogs : [Blogs]
    }
    input BlogsInput {
        communityId: String,
        eventId:String,
        postedBy: String,
        thumbnailImage:String,
        image:[String],
        pdf:[String],
        blogTitle:String,
        blogCategory:String,
        blogDescription:String,
        blogStatus:Boolean,
        paymentStatus:Boolean,
        blogShortDesc:String,
        fbLink:String,
        twitterLink:String,
        likedinLink:String,
        createdAt:String,
    }
    input updateBlogsInput {
        blogId: String
        thumbnailImage:String,
        image:[String],
        pdf:[String],
        blogTitle:String,
        blogCategory:String,
        blogDescription:String,
        blogShortDesc:String,
        fbLink:String,
        twitterLink:String,
        likedinLink:String,
        blogStatus:Boolean,
        paymentStatus:Boolean,
        createdAt:String,
    }
    input BlogsFindInput {
        communityId:String,
        eventId:String,
        blogCategory: String,
        blogStatus:Boolean,
        page: Int
        search: String
        columnName: String,
        sort: String,
        isAppPortal:Boolean
    }
    input BlogsFindByIdInput {
        blogId: String
        isAppPortal:Boolean
    }
    type InsertBlogsResponse implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: Id
    }
    type AllBlogsResponse implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: AllBlogs
    }
    type BlogsByIdResponse implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: Blogs
    }
    type DeleteResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String
    }
    extend type Query {
        getAllBlogs(data: BlogsFindInput): AllBlogsResponse,
        getAllBlogsForApp(data: BlogsFindInput): AllBlogsResponse,
        getBolgsById(data: BlogsFindByIdInput): BlogsByIdResponse,
    }
    extend type Mutation {
        createBlogs(data: BlogsInput): InsertBlogsResponse,
        updateblogs(data: updateBlogsInput) : InsertBlogsResponse
        deleteBlogs(data: BlogsFindByIdInput): DeleteResponse,
        blogStatusChange(data: BlogsFindByIdInput!): GeneralResponse,
        blogPaymentStatusChange(data: BlogsFindByIdInput!): GeneralResponse,
    }
    `
}
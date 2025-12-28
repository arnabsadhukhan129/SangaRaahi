/**
 * The type Book
 */
module.exports = function(gql) {
    return gql`
        type Book {
            title: String!,
            language: String!
        }

        type ResponseDataBooks implements Response{
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: [Book]
        }

        extend type Query{
            getAllBooks: ResponseDataBooks,
            getBookByID(title: String): Book
        }

        extend type Mutation {
            createBook(title: String, language: String): Book
        }
    `
}
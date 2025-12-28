

const BookType = `
    type Book {
        title: String!,
        language: String!
    }


    type Query{
        getAllBooks: [Book],
        getBookByID(title: String): Book
    }

    type Mutation {
        createBook(title: String, language: String): Book
    }
`

export default BookType;
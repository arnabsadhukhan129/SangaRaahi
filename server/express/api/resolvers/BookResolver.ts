import BookController from '../controllers/BookController';
const BookResolver = {
    Query:{
        getAllBooks(root, args, context, info) {
            return BookController.getAllBooks(root, args);
        },
        getBookByID(root, {title}) {
            return BookController.getBookByID(root, {title});
        }
    },
    Mutation:{
        createBook(root, args) {
            return BookController.createBook(root, args);
        }
    }
}
export default BookResolver;
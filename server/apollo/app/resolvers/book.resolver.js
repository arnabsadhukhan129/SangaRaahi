const BookData = require('../../books.json');
/**
 * Here write your main logic
 */
module.exports = {
    Query:{
        getAllBooks(root, args, context, info) {
            return Lib.resSuccess(BookData);
        },
        getBookByID(root, {title}) {
            return BookData.find(b => b.title === title);
        }
    },
    Mutation:{
        createBook(root, args) {
            BookData.push({
                title: args.title,
                language: args.language
            });
            return args;
        }
    }
}
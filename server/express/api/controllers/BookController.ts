const BookData = require('../../books.json');
const BookController = {
    getAllBooks: function(parent, args) {
        return BookData
    },
    getBookByID: function(parent, {title}) {
        return BookData.find((u:any) => u.title === title);
    },
    createBook:  function(parent, args) {
        BookData.push({
            title:args.title,
            language:args.language
        })
        return args
    }
};

export default BookController;
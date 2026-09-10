const { getDB, ObjectId } = require("../db/connection");
const books = () => getDB().collection("books");
module.exports = { books, ObjectId };
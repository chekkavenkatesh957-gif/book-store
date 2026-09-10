const { getDB, ObjectId } = require("../db/connection");
const users = () => getDB().collection("users");
module.exports = { users, ObjectId };
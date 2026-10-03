const { getDB, ObjectId } = require("../db/connection");
const users = () => getDB().collection("users");
const pendingSignups = () => getDB().collection("pendingSignups");
module.exports = { users, pendingSignups, ObjectId };
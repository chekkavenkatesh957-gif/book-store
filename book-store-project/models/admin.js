const { getDB, ObjectId } = require("../db/connection");
const admins = () => getDB().collection("admins");
module.exports = { admins, ObjectId };

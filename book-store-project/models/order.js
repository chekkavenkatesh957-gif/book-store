const { getDB, ObjectId } = require("../db/connection");
const orders = () => getDB().collection("orders");
module.exports = { orders, ObjectId };
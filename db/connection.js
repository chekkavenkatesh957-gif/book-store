const { MongoClient, ObjectId } = require("mongodb");

// Cache connection for serverless reuse
let client;
let db;

async function connectDB() {
  if (db) return db; // ✅ Reuse existing connection (serverless caching)

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not defined in environment variables");

  client = new MongoClient(uri);
  await client.connect();
  db = client.db("bookstore");
  console.log("✅ MongoDB Atlas Connected");
  return db;
}

function getDB() {
  if (!db) throw new Error("Database not initialized. Call connectDB() first.");
  return db;
}

module.exports = { connectDB, getDB, ObjectId };

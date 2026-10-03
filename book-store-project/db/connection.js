const { MongoClient, ObjectId } = require("mongodb");
const dns = require("node:dns");

const configuredDnsServers = process.env.MONGO_DNS_SERVERS
  ?.split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (configuredDnsServers?.length) {
  dns.setServers(configuredDnsServers);
} else if (dns.getServers().some((server) => server === "127.0.0.1" || server === "::1")) {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

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

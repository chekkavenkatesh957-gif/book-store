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

// Cache connection promise for concurrent & serverless reuse
let client;
let db;
let connectPromise = null;

async function connectDB() {
  if (db) return db;
  if (connectPromise) return connectPromise;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not defined in environment variables");

  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });

  connectPromise = client.connect().then(() => {
    db = client.db("bookstore");
    console.log("✅ MongoDB Atlas Connected");
    return db;
  }).catch((err) => {
    connectPromise = null;
    throw err;
  });

  return connectPromise;
}

function getDB() {
  if (!db) throw new Error("Database not initialized. Call connectDB() first.");
  return db;
}

module.exports = { connectDB, getDB, ObjectId };

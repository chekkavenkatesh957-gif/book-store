const { MongoClient } = require("mongodb");
require("dotenv").config();

function getCoverImageForBook(title, category) {
  const t = (title || "").toLowerCase();
  const c = (category || "").toLowerCase();

  if (t.includes("java") && !t.includes("script")) return "java.svg";
  if (t.includes("javascript") || t.includes("js") || t.includes("typescript")) return "javascript.svg";
  if (t.includes("python")) return "python.svg";
  if (t.includes("react")) return "react.svg";
  if (t.includes("node") || t.includes("express")) return "nodejs.svg";
  if (t.includes("docker")) return "docker.svg";
  if (t.includes("kubernetes") || t.includes("k8s")) return "kubernetes.svg";
  if (t.includes("mongo")) return "mongodb.svg";
  if (t.includes("sql") || t.includes("postgres") || t.includes("mysql")) return "sql.svg";
  if (t.includes("clean code") || t.includes("clean architecture") || t.includes("clean coder")) return "cleancode.svg";
  if (t.includes("cracking") || t.includes("interview")) return "cracking.svg";
  if (t.includes("structure") || t.includes("data structure")) return "datastructures.svg";
  if (t.includes("pattern") || t.includes("design pattern")) return "designpatterns.svg";
  if (t.includes("eloquent")) return "eloquent.svg";
  if (t.includes("go ") || t.includes("golang") || t.includes("in go")) return "go.svg";
  if (t.includes("pragmatic") || t.includes("passionate programmer")) return "pragmatic.svg";
  if (t.includes("refactor")) return "refactoring.svg";
  if (t.includes("web") || t.includes("html") || t.includes("css")) return "webdev.svg";
  if (t.includes("c++")) return "cpp.svg";
  if (t.includes(" c ") || t.startsWith("c ") || t.includes("c programming")) return "c.svg";
  if (c.includes("devops") || c.includes("cloud") || t.includes("aws") || t.includes("azure")) return "devops.svg";
  if (t.includes("algorithm")) return "algorithms.svg";

  // Category fallbacks
  if (c.includes("web")) return "webdev.svg";
  if (c.includes("backend")) return "nodejs.svg";
  if (c.includes("database")) return "mongodb.svg";
  if (c.includes("cloud") || c.includes("devops")) return "devops.svg";
  if (c.includes("ai") || c.includes("ml") || c.includes("data science")) return "python.svg";
  if (c.includes("security")) return "cleancode.svg";
  if (c.includes("architecture")) return "designpatterns.svg";
  if (c.includes("cs theory") || c.includes("theory")) return "algorithms.svg";
  if (c.includes("interview")) return "cracking.svg";
  if (c.includes("mobile")) return "react.svg";
  if (c.includes("game")) return "cpp.svg";

  return "default-book.svg";
}

async function run() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas.");
    const db = client.db("bookstore");
    const collection = db.collection("books");
    
    const books = await collection.find({}).toArray();
    console.log(`Found ${books.length} books. Updating cover images...`);

    let updatedCount = 0;
    for (const book of books) {
      const coverImage = getCoverImageForBook(book.title, book.category);
      if (book.image !== coverImage) {
        await collection.updateOne(
          { _id: book._id },
          { $set: { image: coverImage } }
        );
        updatedCount++;
      }
    }

    console.log(`✅ Successfully updated ${updatedCount} books with matching SVG cover images!`);
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error("Error updating books:", err);
    process.exit(1);
  }
}

run();

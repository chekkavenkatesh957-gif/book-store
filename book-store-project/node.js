const mongoose = require("mongoose");
require("dotenv").config();
const Book = require("./models/Book");

async function addBooks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Add 20 sample books
    const books = [
      {
        title: "Java Programming",
        author: "James Gosling",
        price: 499,
        category: "Programming",
        image: "java.jpg"
      },
      {
        title: "JavaScript Basics",
        author: "Kyle Simpson",
        price: 399,
        category: "Programming",
        image: "javascript.jpg"
      },
      {
        title: "Python for Data Science",
        author: "Wes McKinney",
        price: 599,
        category: "Programming",
        image: "python.jpg"
      },
      {
        title: "Web Development 101",
        author: "Jon Duckett",
        price: 699,
        category: "Web",
        image: "webdev.jpg"
      },
      {
        title: "Clean Code",
        author: "Robert C. Martin",
        price: 549,
        category: "Programming",
        image: "cleancode.jpg"
      },
      {
        title: "Design Patterns",
        author: "Gang of Four",
        price: 799,
        category: "Programming",
        image: "designpatterns.jpg"
      },
      {
        title: "The Pragmatic Programmer",
        author: "Andrew Hunt",
        price: 649,
        category: "Programming",
        image: "pragmatic.jpg"
      },
      {
        title: "Refactoring",
        author: "Martin Fowler",
        price: 599,
        category: "Programming",
        image: "refactoring.jpg"
      },
      {
        title: "Cracking the Coding Interview",
        author: "Gayle Laakmann",
        price: 699,
        category: "Interview Prep",
        image: "cracking.jpg"
      },
      {
        title: "Eloquent JavaScript",
        author: "Marijn Haverbeke",
        price: 449,
        category: "Web",
        image: "eloquent.jpg"
      },
      {
        title: "React: The Complete Guide",
        author: "Maximilian Schwarzmüller",
        price: 749,
        category: "Web",
        image: "react.jpg"
      },
      {
        title: "Node.js Design Patterns",
        author: "Mario Casciaro",
        price: 699,
        category: "Backend",
        image: "nodejs.jpg"
      },
      {
        title: "MongoDB in Action",
        author: "Kyle Banker",
        price: 599,
        category: "Database",
        image: "mongodb.jpg"
      },
      {
        title: "SQL Performance Explained",
        author: "Markus Winand",
        price: 549,
        category: "Database",
        image: "sql.jpg"
      },
      {
        title: "The C Programming Language",
        author: "Brian Kernighan",
        price: 489,
        category: "Programming",
        image: "c.jpg"
      },
      {
        title: "Effective C++",
        author: "Scott Meyers",
        price: 749,
        category: "Programming",
        image: "cpp.jpg"
      },
      {
        title: "Go in Action",
        author: "William Kennedy",
        price: 649,
        category: "Programming",
        image: "go.jpg"
      },
      {
        title: "Learning Docker",
        author: "Pethuru Raj",
        price: 599,
        category: "DevOps",
        image: "docker.jpg"
      },
      {
        title: "Kubernetes in Action",
        author: "Marko Lukša",
        price: 799,
        category: "DevOps",
        image: "kubernetes.jpg"
      },
      {
        title: "The DevOps Handbook",
        author: "Gene Kim",
        price: 649,
        category: "DevOps",
        image: "devops.jpg"
      }
    ];

    const result = await Book.insertMany(books);
    console.log(`✅ Successfully added ${result.length} books to the database!`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

addBooks();
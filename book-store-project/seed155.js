const { MongoClient } = require("mongodb");
require("dotenv").config();

const books = [
  // ── Programming ──────────────────────────────────────────────────────────
  { title: "Head First Java", author: "Kathy Sierra", price: 499, category: "Programming", image: "" },
  { title: "Head First Design Patterns", author: "Eric Freeman", price: 549, category: "Programming", image: "" },
  { title: "Structure and Interpretation of Computer Programs", author: "Harold Abelson", price: 699, category: "Programming", image: "" },
  { title: "Code Complete", author: "Steve McConnell", price: 749, category: "Programming", image: "" },
  { title: "Working Effectively with Legacy Code", author: "Michael Feathers", price: 599, category: "Programming", image: "" },
  { title: "The Art of Computer Programming", author: "Donald Knuth", price: 999, category: "Programming", image: "" },
  { title: "Programming Pearls", author: "Jon Bentley", price: 449, category: "Programming", image: "" },
  { title: "Learning Python", author: "Mark Lutz", price: 599, category: "Programming", image: "" },
  { title: "Fluent Python", author: "Luciano Ramalho", price: 749, category: "Programming", image: "" },
  { title: "Python Tricks", author: "Dan Bader", price: 399, category: "Programming", image: "" },
  { title: "Automate the Boring Stuff with Python", author: "Al Sweigart", price: 449, category: "Programming", image: "" },
  { title: "Effective Java", author: "Joshua Bloch", price: 799, category: "Programming", image: "" },
  { title: "Java Concurrency in Practice", author: "Brian Goetz", price: 749, category: "Programming", image: "" },
  { title: "C Programming Language", author: "Brian Kernighan", price: 599, category: "Programming", image: "" },
  { title: "The Rust Programming Language", author: "Steve Klabnik", price: 649, category: "Programming", image: "" },
  { title: "Programming in Go", author: "Mark Summerfield", price: 599, category: "Programming", image: "" },
  { title: "Scala Programming", author: "Martin Odersky", price: 699, category: "Programming", image: "" },
  { title: "Haskell Programming from First Principles", author: "Christopher Allen", price: 649, category: "Programming", image: "" },

  // ── Web Development ───────────────────────────────────────────────────────
  { title: "HTML & CSS: Design and Build Websites", author: "Jon Duckett", price: 499, category: "Web", image: "" },
  { title: "JavaScript: The Good Parts", author: "Douglas Crockford", price: 349, category: "Web", image: "" },
  { title: "JavaScript: The Definitive Guide", author: "David Flanagan", price: 799, category: "Web", image: "" },
  { title: "You Don't Know JS: Scope & Closures", author: "Kyle Simpson", price: 399, category: "Web", image: "" },
  { title: "Learning Vue.js", author: "Olga Filipova", price: 549, category: "Web", image: "" },
  { title: "Angular in Action", author: "Jeremy Wilken", price: 599, category: "Web", image: "" },
  { title: "Next.js in Action", author: "Adam Boduch", price: 649, category: "Web", image: "" },
  { title: "Svelte and Sapper in Action", author: "Mark Volkmann", price: 599, category: "Web", image: "" },
  { title: "CSS in Depth", author: "Keith Grant", price: 499, category: "Web", image: "" },
  { title: "Web Performance in Action", author: "Jeremy Wagner", price: 549, category: "Web", image: "" },
  { title: "React Up and Running", author: "Stoyan Stefanov", price: 599, category: "Web", image: "" },
  { title: "TypeScript Deep Dive", author: "Basarat Ali Syed", price: 499, category: "Web", image: "" },
  { title: "GraphQL in Action", author: "Samer Buna", price: 599, category: "Web", image: "" },
  { title: "Progressive Web Apps", author: "Dean Hume", price: 549, category: "Web", image: "" },

  // ── Backend / Node.js ─────────────────────────────────────────────────────
  { title: "Node.js in Action", author: "Alex Young", price: 599, category: "Backend", image: "" },
  { title: "Express in Action", author: "Evan Hahn", price: 499, category: "Backend", image: "" },
  { title: "Mastering Node.js", author: "Sandro Pasquali", price: 649, category: "Backend", image: "" },
  { title: "Building APIs with Node.js", author: "Caio Ribeiro Pereira", price: 449, category: "Backend", image: "" },
  { title: "Spring in Action", author: "Craig Walls", price: 749, category: "Backend", image: "" },
  { title: "Django for Professionals", author: "William Vincent", price: 499, category: "Backend", image: "" },
  { title: "Flask Web Development", author: "Miguel Grinberg", price: 549, category: "Backend", image: "" },
  { title: "Laravel: Up and Running", author: "Matt Stauffer", price: 599, category: "Backend", image: "" },
  { title: "RESTful Web APIs", author: "Leonard Richardson", price: 549, category: "Backend", image: "" },
  { title: "gRPC: Up and Running", author: "Kasun Indrasiri", price: 599, category: "Backend", image: "" },
  { title: "Microservices Patterns", author: "Chris Richardson", price: 749, category: "Backend", image: "" },
  { title: "Building Microservices", author: "Sam Newman", price: 799, category: "Backend", image: "" },

  // ── Database ──────────────────────────────────────────────────────────────
  { title: "MongoDB: The Definitive Guide", author: "Shannon Bradshaw", price: 699, category: "Database", image: "" },
  { title: "Learning MySQL", author: "Vinicius Grippa", price: 549, category: "Database", image: "" },
  { title: "Cassandra: The Definitive Guide", author: "Jeff Carpenter", price: 699, category: "Database", image: "" },
  { title: "Neo4j in Action", author: "Aleksa Vukotic", price: 649, category: "Database", image: "" },
  { title: "Seven Databases in Seven Weeks", author: "Eric Redmond", price: 749, category: "Database", image: "" },
  { title: "PostgreSQL: Up and Running", author: "Regina Obe", price: 649, category: "Database", image: "" },
  { title: "Redis in Action", author: "Josiah Carlson", price: 599, category: "Database", image: "" },
  { title: "Elasticsearch in Action", author: "Radu Gheorghe", price: 699, category: "Database", image: "" },
  { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", price: 849, category: "Database", image: "" },
  { title: "Database Internals", author: "Alex Petrov", price: 799, category: "Database", image: "" },

  // ── AI & ML ───────────────────────────────────────────────────────────────
  { title: "Machine Learning Yearning", author: "Andrew Ng", price: 499, category: "AI & ML", image: "" },
  { title: "Python Machine Learning", author: "Sebastian Raschka", price: 749, category: "AI & ML", image: "" },
  { title: "Natural Language Processing with Python", author: "Steven Bird", price: 699, category: "AI & ML", image: "" },
  { title: "Generative Deep Learning", author: "David Foster", price: 799, category: "AI & ML", image: "" },
  { title: "Reinforcement Learning", author: "Richard Sutton", price: 849, category: "AI & ML", image: "" },
  { title: "Computer Vision: Algorithms", author: "Richard Szeliski", price: 899, category: "AI & ML", image: "" },
  { title: "TensorFlow for Deep Learning", author: "Bharath Ramsundar", price: 699, category: "AI & ML", image: "" },
  { title: "PyTorch Deep Learning Hands-On", author: "Sherin Thomas", price: 749, category: "AI & ML", image: "" },
  { title: "Data Science from Scratch", author: "Joel Grus", price: 599, category: "AI & ML", image: "" },
  { title: "Feature Engineering for Machine Learning", author: "Alice Zheng", price: 649, category: "AI & ML", image: "" },
  { title: "Deep Learning with Python", author: "Francois Chollet", price: 799, category: "AI & ML", image: "" },
  { title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell", price: 999, category: "AI & ML", image: "" },
  { title: "Hands-On Machine Learning", author: "Aurelien Geron", price: 849, category: "AI & ML", image: "" },

  // ── Cloud & DevOps ────────────────────────────────────────────────────────
  { title: "AWS in Action", author: "Andreas Wittig", price: 749, category: "Cloud & DevOps", image: "" },
  { title: "Google Cloud Platform in Action", author: "JJ Geewax", price: 699, category: "Cloud & DevOps", image: "" },
  { title: "Azure in Action", author: "Chris Hay", price: 749, category: "Cloud & DevOps", image: "" },
  { title: "Docker Deep Dive", author: "Nigel Poulton", price: 449, category: "Cloud & DevOps", image: "" },
  { title: "The Phoenix Project", author: "Gene Kim", price: 599, category: "Cloud & DevOps", image: "" },
  { title: "Accelerate", author: "Nicole Forsgren", price: 549, category: "Cloud & DevOps", image: "" },
  { title: "Ansible for DevOps", author: "Jeff Geerling", price: 499, category: "Cloud & DevOps", image: "" },
  { title: "Jenkins 2: Up and Running", author: "Brent Laster", price: 599, category: "Cloud & DevOps", image: "" },
  { title: "Kubernetes in Action", author: "Marko Luksa", price: 799, category: "Cloud & DevOps", image: "" },
  { title: "Terraform: Up and Running", author: "Yevgeniy Brikman", price: 699, category: "Cloud & DevOps", image: "" },
  { title: "Site Reliability Engineering", author: "Betsy Beyer", price: 849, category: "Cloud & DevOps", image: "" },
  { title: "The DevOps Handbook", author: "Gene Kim", price: 699, category: "Cloud & DevOps", image: "" },

  // ── Security ──────────────────────────────────────────────────────────────
  { title: "The Web Application Hacker's Handbook", author: "Dafydd Stuttard", price: 699, category: "Security", image: "" },
  { title: "Applied Cryptography", author: "Bruce Schneier", price: 799, category: "Security", image: "" },
  { title: "Black Hat Python", author: "Justin Seitz", price: 549, category: "Security", image: "" },
  { title: "Penetration Testing", author: "Georgia Weidman", price: 649, category: "Security", image: "" },
  { title: "The Art of Intrusion", author: "Kevin Mitnick", price: 499, category: "Security", image: "" },
  { title: "Metasploit: The Penetration Tester's Guide", author: "David Kennedy", price: 599, category: "Security", image: "" },
  { title: "Hacker's Playbook 3", author: "Peter Kim", price: 549, category: "Security", image: "" },
  { title: "Cybersecurity Essentials", author: "Charles Brooks", price: 649, category: "Security", image: "" },

  // ── Architecture & System Design ──────────────────────────────────────────
  { title: "Clean Architecture", author: "Robert C. Martin", price: 699, category: "Architecture", image: "" },
  { title: "Software Architecture in Practice", author: "Len Bass", price: 799, category: "Architecture", image: "" },
  { title: "Fundamentals of Software Architecture", author: "Mark Richards", price: 749, category: "Architecture", image: "" },
  { title: "Patterns of Enterprise Application Architecture", author: "Martin Fowler", price: 849, category: "Architecture", image: "" },
  { title: "API Design Patterns", author: "JJ Geewax", price: 699, category: "Architecture", image: "" },
  { title: "System Design Interview Vol. 1", author: "Alex Xu", price: 799, category: "Architecture", image: "" },
  { title: "System Design Interview Vol. 2", author: "Alex Xu", price: 849, category: "Architecture", image: "" },
  { title: "Domain-Driven Design", author: "Eric Evans", price: 849, category: "Architecture", image: "" },
  { title: "Event-Driven Architecture in Practice", author: "Adam Bellemare", price: 699, category: "Architecture", image: "" },

  // ── CS Theory ─────────────────────────────────────────────────────────────
  { title: "Concrete Mathematics", author: "Ronald Graham", price: 799, category: "CS Theory", image: "" },
  { title: "Category Theory for Programmers", author: "Bartosz Milewski", price: 649, category: "CS Theory", image: "" },
  { title: "Types and Programming Languages", author: "Benjamin Pierce", price: 849, category: "CS Theory", image: "" },
  { title: "The Little Schemer", author: "Daniel Friedman", price: 449, category: "CS Theory", image: "" },
  { title: "Introduction to Algorithms (CLRS)", author: "Thomas Cormen", price: 999, category: "CS Theory", image: "" },
  { title: "Compilers: Principles, Techniques & Tools", author: "Alfred Aho", price: 899, category: "CS Theory", image: "" },
  { title: "The Algorithm Design Manual", author: "Steven Skiena", price: 849, category: "CS Theory", image: "" },

  // ── Interview Prep ────────────────────────────────────────────────────────
  { title: "Cracking the Coding Interview", author: "Gayle Laakmann McDowell", price: 699, category: "Interview Prep", image: "" },
  { title: "Elements of Programming Interviews", author: "Adnan Aziz", price: 749, category: "Interview Prep", image: "" },
  { title: "Programming Interview Exposed", author: "John Mongan", price: 499, category: "Interview Prep", image: "" },
  { title: "LeetCode Patterns", author: "Sean Prashad", price: 449, category: "Interview Prep", image: "" },
  { title: "Ace the Data Science Interview", author: "Nick Singh", price: 649, category: "Interview Prep", image: "" },
  { title: "Grokking Algorithms", author: "Aditya Bhargava", price: 549, category: "Interview Prep", image: "" },

  // ── Mobile Development ────────────────────────────────────────────────────
  { title: "Android Development with Kotlin", author: "Igor Kucherenko", price: 649, category: "Mobile Dev", image: "" },
  { title: "iOS Programming: The Big Nerd Ranch Guide", author: "Christian Keur", price: 699, category: "Mobile Dev", image: "" },
  { title: "Flutter Complete Reference", author: "Alberto Miola", price: 749, category: "Mobile Dev", image: "" },
  { title: "React Native in Action", author: "Nader Dabit", price: 649, category: "Mobile Dev", image: "" },
  { title: "Kotlin in Action", author: "Dmitry Jemerov", price: 699, category: "Mobile Dev", image: "" },
  { title: "SwiftUI by Tutorials", author: "raywenderlich.com Team", price: 749, category: "Mobile Dev", image: "" },

  // ── Game Development ──────────────────────────────────────────────────────
  { title: "Introduction to Game Design", author: "Michael Salmond", price: 549, category: "Game Dev", image: "" },
  { title: "Level Up! The Guide to Great Video Game Design", author: "Scott Rogers", price: 599, category: "Game Dev", image: "" },
  { title: "3D Math Primer for Graphics and Game Development", author: "Fletcher Dunn", price: 749, category: "Game Dev", image: "" },
  { title: "Unity in Action", author: "Joseph Hocking", price: 699, category: "Game Dev", image: "" },
  { title: "Game Programming Patterns", author: "Robert Nystrom", price: 649, category: "Game Dev", image: "" },

  // ── Embedded Systems ──────────────────────────────────────────────────────
  { title: "The Art of Electronics", author: "Paul Horowitz", price: 899, category: "Embedded Systems", image: "" },
  { title: "Embedded Systems with ARM Cortex-M", author: "Jonathan Valvano", price: 749, category: "Embedded Systems", image: "" },
  { title: "Raspberry Pi for Secret Agents", author: "Stefan Sjogelid", price: 499, category: "Embedded Systems", image: "" },
  { title: "Programming Arduino", author: "Simon Monk", price: 449, category: "Embedded Systems", image: "" },
  { title: "Making Embedded Systems", author: "Elecia White", price: 649, category: "Embedded Systems", image: "" },

  // ── Soft Skills & Career ──────────────────────────────────────────────────
  { title: "The Mythical Man-Month", author: "Frederick Brooks", price: 499, category: "Career", image: "" },
  { title: "Soft Skills: The Software Developer's Life Manual", author: "John Sonmez", price: 549, category: "Career", image: "" },
  { title: "The Passionate Programmer", author: "Chad Fowler", price: 449, category: "Career", image: "" },
  { title: "Apprenticeship Patterns", author: "Dave Hoover", price: 499, category: "Career", image: "" },
  { title: "The Developer's Code", author: "Ka Wai Cheung", price: 399, category: "Career", image: "" },
  { title: "A Mind for Numbers", author: "Barbara Oakley", price: 449, category: "Career", image: "" },
  { title: "Deep Work", author: "Cal Newport", price: 499, category: "Career", image: "" },
  { title: "The Clean Coder", author: "Robert C. Martin", price: 599, category: "Career", image: "" },

  // ── Data Science & Analytics ──────────────────────────────────────────────
  { title: "Python for Data Analysis", author: "Wes McKinney", price: 749, category: "Data Science", image: "" },
  { title: "Data Science for Business", author: "Foster Provost", price: 699, category: "Data Science", image: "" },
  { title: "Storytelling with Data", author: "Cole Knaflic", price: 549, category: "Data Science", image: "" },
  { title: "The Art of Statistics", author: "David Spiegelhalter", price: 599, category: "Data Science", image: "" },
  { title: "Practical Statistics for Data Scientists", author: "Peter Bruce", price: 699, category: "Data Science", image: "" },
  { title: "R for Data Science", author: "Hadley Wickham", price: 649, category: "Data Science", image: "" },
  { title: "Big Data: A Revolution", author: "Viktor Mayer-Schonberger", price: 549, category: "Data Science", image: "" },

  // ── Blockchain & Web3 ─────────────────────────────────────────────────────
  { title: "Mastering Bitcoin", author: "Andreas Antonopoulos", price: 749, category: "Blockchain", image: "" },
  { title: "Mastering Ethereum", author: "Andreas Antonopoulos", price: 799, category: "Blockchain", image: "" },
  { title: "Blockchain Basics", author: "Daniel Drescher", price: 549, category: "Blockchain", image: "" },
  { title: "The Bitcoin Standard", author: "Saifedean Ammous", price: 649, category: "Blockchain", image: "" },
  { title: "Token Economy", author: "Shermin Voshmgir", price: 599, category: "Blockchain", image: "" },

  // ── Networking ────────────────────────────────────────────────────────────
  { title: "Computer Networks", author: "Andrew Tanenbaum", price: 849, category: "Networking", image: "" },
  { title: "TCP/IP Illustrated", author: "W. Richard Stevens", price: 799, category: "Networking", image: "" },
  { title: "Network Warrior", author: "Gary Donahue", price: 699, category: "Networking", image: "" },
  { title: "UNIX Network Programming", author: "W. Richard Stevens", price: 849, category: "Networking", image: "" },
  { title: "DNS and BIND", author: "Cricket Liu", price: 649, category: "Networking", image: "" },
];

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

async function seed() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    console.log("✅ MongoDB Atlas Connected");

    const db = client.db("bookstore");
    const collection = db.collection("books");

    // Assign image filename to all books
    books.forEach(b => {
      b.image = getCoverImageForBook(b.title, b.category);
    });

    // Check for duplicates by title and only insert new ones
    const existingTitles = await collection
      .find({}, { projection: { title: 1, _id: 0 } })
      .toArray();
    const existingSet = new Set(existingTitles.map((b) => b.title));

    const newBooks = books.filter((b) => !existingSet.has(b.title));

    if (newBooks.length === 0) {
      console.log("ℹ️  All 155 books already exist in the database. Nothing to insert.");
    } else {
      const result = await collection.insertMany(newBooks);
      console.log(`✅ Successfully added ${result.insertedCount} new books!`);
    }

    const total = await collection.countDocuments();
    console.log(`📚 Total books in database: ${total}`);

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

seed();

const { MongoClient } = require("mongodb");
require("dotenv").config();

const books = [
  // Programming
  { title: "Head First Java", author: "Kathy Sierra", price: 499, category: "Programming", image: "" },
  { title: "Head First Design Patterns", author: "Eric Freeman", price: 549, category: "Programming", image: "" },
  { title: "Structure and Interpretation of Computer Programs", author: "Harold Abelson", price: 699, category: "Programming", image: "" },
  { title: "Code Complete", author: "Steve McConnell", price: 749, category: "Programming", image: "" },
  { title: "Working Effectively with Legacy Code", author: "Michael Feathers", price: 599, category: "Programming", image: "" },
  { title: "The Art of Computer Programming", author: "Donald Knuth", price: 999, category: "Programming", image: "" },
  { title: "Programming Pearls", author: "Jon Bentley", price: 449, category: "Programming", image: "" },
  { title: "Haskell Programming from First Principles", author: "Christopher Allen", price: 649, category: "Programming", image: "" },
  { title: "Learning Python", author: "Mark Lutz", price: 599, category: "Programming", image: "" },
  { title: "Fluent Python", author: "Luciano Ramalho", price: 749, category: "Programming", image: "" },
  { title: "Python Tricks", author: "Dan Bader", price: 399, category: "Programming", image: "" },
  { title: "Automate the Boring Stuff with Python", author: "Al Sweigart", price: 449, category: "Programming", image: "" },
  { title: "Ruby on Rails Tutorial", author: "Michael Hartl", price: 549, category: "Programming", image: "" },
  { title: "The Well-Grounded Rubyist", author: "David Black", price: 599, category: "Programming", image: "" },
  { title: "Scala Programming", author: "Martin Odersky", price: 699, category: "Programming", image: "" },

  // Web Development
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

  // Backend / Node.js
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

  // Database
  { title: "MongoDB: The Definitive Guide", author: "Shannon Bradshaw", price: 699, category: "Database", image: "" },
  { title: "Learning MySQL", author: "Vinicius Grippa", price: 549, category: "Database", image: "" },
  { title: "Cassandra: The Definitive Guide", author: "Jeff Carpenter", price: 699, category: "Database", image: "" },
  { title: "Neo4j in Action", author: "Aleksa Vukotic", price: 649, category: "Database", image: "" },
  { title: "Seven Databases in Seven Weeks", author: "Eric Redmond", price: 749, category: "Database", image: "" },

  // AI & ML
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

  // Cloud & DevOps
  { title: "AWS in Action", author: "Andreas Wittig", price: 749, category: "Cloud & DevOps", image: "" },
  { title: "Google Cloud Platform in Action", author: "JJ Geewax", price: 699, category: "Cloud & DevOps", image: "" },
  { title: "Azure in Action", author: "Chris Hay", price: 749, category: "Cloud & DevOps", image: "" },
  { title: "Docker Deep Dive", author: "Nigel Poulton", price: 449, category: "Cloud & DevOps", image: "" },
  { title: "The Phoenix Project", author: "Gene Kim", price: 599, category: "Cloud & DevOps", image: "" },
  { title: "Accelerate", author: "Nicole Forsgren", price: 549, category: "Cloud & DevOps", image: "" },
  { title: "Ansible for DevOps", author: "Jeff Geerling", price: 499, category: "Cloud & DevOps", image: "" },
  { title: "Jenkins 2: Up and Running", author: "Brent Laster", price: 599, category: "Cloud & DevOps", image: "" },

  // Security
  { title: "The Web Application Hacker's Handbook", author: "Dafydd Stuttard", price: 699, category: "Security", image: "" },
  { title: "Applied Cryptography", author: "Bruce Schneier", price: 799, category: "Security", image: "" },
  { title: "Black Hat Python", author: "Justin Seitz", price: 549, category: "Security", image: "" },
  { title: "Penetration Testing", author: "Georgia Weidman", price: 649, category: "Security", image: "" },
  { title: "The Art of Intrusion", author: "Kevin Mitnick", price: 499, category: "Security", image: "" },
  { title: "Metasploit: The Penetration Tester's Guide", author: "David Kennedy", price: 599, category: "Security", image: "" },
  { title: "Hacker's Playbook 3", author: "Peter Kim", price: 549, category: "Security", image: "" },

  // Architecture & System Design
  { title: "Clean Architecture", author: "Robert C. Martin", price: 699, category: "Architecture", image: "" },
  { title: "Software Architecture in Practice", author: "Len Bass", price: 799, category: "Architecture", image: "" },
  { title: "Fundamentals of Software Architecture", author: "Mark Richards", price: 749, category: "Architecture", image: "" },
  { title: "Patterns of Enterprise Application Architecture", author: "Martin Fowler", price: 849, category: "Architecture", image: "" },
  { title: "The Pragmatic Architect", author: "Timothy Ford", price: 649, category: "Architecture", image: "" },
  { title: "API Design Patterns", author: "JJ Geewax", price: 699, category: "Architecture", image: "" },

  // CS Theory
  { title: "Concrete Mathematics", author: "Ronald Graham", price: 799, category: "CS Theory", image: "" },
  { title: "Category Theory for Programmers", author: "Bartosz Milewski", price: 649, category: "CS Theory", image: "" },
  { title: "Types and Programming Languages", author: "Benjamin Pierce", price: 849, category: "CS Theory", image: "" },
  { title: "The Little Schemer", author: "Daniel Friedman", price: 449, category: "CS Theory", image: "" },

  // Interview Prep
  { title: "Elements of Programming Interviews", author: "Adnan Aziz", price: 749, category: "Interview Prep", image: "" },
  { title: "Programming Interview Exposed", author: "John Mongan", price: 499, category: "Interview Prep", image: "" },
  { title: "LeetCode Patterns", author: "Sean Prashad", price: 449, category: "Interview Prep", image: "" },
  { title: "System Design Interview Vol. 2", author: "Alex Xu", price: 799, category: "Interview Prep", image: "" },
  { title: "Ace the Data Science Interview", author: "Nick Singh", price: 649, category: "Interview Prep", image: "" },

  // Mobile Development
  { title: "Android Development with Kotlin", author: "Igor Kucherenko", price: 649, category: "Mobile Dev", image: "" },
  { title: "iOS Programming: The Big Nerd Ranch Guide", author: "Christian Keur", price: 699, category: "Mobile Dev", image: "" },
  { title: "Flutter Complete Reference", author: "Alberto Miola", price: 749, category: "Mobile Dev", image: "" },
  { title: "React Native in Action", author: "Nader Dabit", price: 649, category: "Mobile Dev", image: "" },
  { title: "Kotlin in Action", author: "Dmitry Jemerov", price: 699, category: "Mobile Dev", image: "" },

  // Game Development
  { title: "Introduction to Game Design", author: "Michael Salmond", price: 549, category: "Game Dev", image: "" },
  { title: "Level Up! The Guide to Great Video Game Design", author: "Scott Rogers", price: 599, category: "Game Dev", image: "" },
  { title: "3D Math Primer for Graphics and Game Development", author: "Fletcher Dunn", price: 749, category: "Game Dev", image: "" },

  // Embedded Systems
  { title: "The Art of Electronics", author: "Paul Horowitz", price: 899, category: "Embedded Systems", image: "" },
  { title: "Embedded Systems with ARM Cortex-M", author: "Jonathan Valvano", price: 749, category: "Embedded Systems", image: "" },
  { title: "Raspberry Pi for Secret Agents", author: "Stefan Sjogelid", price: 499, category: "Embedded Systems", image: "" },

  // Soft Skills & Career
  { title: "The Mythical Man-Month", author: "Frederick Brooks", price: 499, category: "Career", image: "" },
  { title: "Soft Skills: The Software Developer's Life Manual", author: "John Sonmez", price: 549, category: "Career", image: "" },
  { title: "The Passionate Programmer", author: "Chad Fowler", price: 449, category: "Career", image: "" },
  { title: "Apprenticeship Patterns", author: "Dave Hoover", price: 499, category: "Career", image: "" },
  { title: "The Developer's Code", author: "Ka Wai Cheung", price: 399, category: "Career", image: "" },
];

async function seed() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    console.log("✅ MongoDB Atlas Connected");

    const db = client.db("bookstore");
    const collection = db.collection("books");

    const result = await collection.insertMany(books);
    console.log(`✅ Successfully added ${result.insertedCount} new books!`);

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

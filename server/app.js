const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');

require('dotenv').config({ path: path.resolve(__dirname, 'credentials/.env') });

const app = express();
const port = process.env.PORT || 5000;

const uri = process.env.MONGO_CONNECTION_STRING;
console.log('MongoDB URI:', uri);

const databaseAndCollection = {
    db: process.env.MONGO_DB_NAME,
    collection: process.env.MONGO_COLLECTION
};

let client;

async function connectToDatabase() {
    client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverApi: ServerApiVersion.v1
    });
    try {
        await client.connect();
        console.log("Connected to database");
    } catch (err) {
        console.error("Failed to connect to database", err);
        process.exit(1); // Exit the process if unable to connect to the database
    }
}

connectToDatabase();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON bodies

// Set up views and view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.get("/", (req, res) => {
    res.render("home");
});

// Serve React frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/`);
});

// Close MongoDB connection when the Express server shuts down
process.on('SIGINT', async () => {
    try {
        await client.close();
        console.log('MongoDB connection closed');
    } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
    } finally {
        process.exit(0);
    }
});

const path = require('path');
const fs = require('fs');
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

async function connectToDatabase() 
{
    client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverApi: ServerApiVersion.v1
    });
    try 
    {
        await client.connect();
        console.log("Connected to database");
    } 
    catch (err) 
    {
        console.error("Failed to connect to database", err);
        process.exit(1); // Exit the process if unable to connect to the database
    }
}

connectToDatabase();

// Middleware
app.use(express.static(path.join(__dirname, '../client/build')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON bodies

const { runUpdates } = require('../scripts/scheduler');

// Serve the scraped predictions data
app.get('/api/predictions', async (req, res) => {
    console.log('Request received for /api/predictions');
    
    try 
    {
        await client.connect();
        const db = client.db(databaseAndCollection.db);
        const collection = db.collection(databaseAndCollection.collection);

        // Run updates before sending the predictions
        await runUpdates();

        // Retrieve predictions from MongoDB
        const predictions = await collection.find({}).toArray();

        res.json(predictions);
        client.close();
    } 
    catch (err) 
    {
        console.error('Error retrieving predictions from MongoDB:', err);
        res.status(500).send('Internal Server Error');
    }
    /*
    fs.readFile(path.join(__dirname, 'data', 'predictionObjects.json'), 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
          }
      
          //console.log('Contents of predictionObjects.json:', data);

          try {
            const jsonData = JSON.parse(data);
            //console.log('Read data from predictionObjects.json:', jsonData);
            //console.log('Response headers:', res.getHeaders());
            res.json(jsonData);
            //console.log('Sent response to client:', jsonData);
          } catch (err) {
            console.error('Error parsing JSON data:', err);
            res.status(500).send('Internal Server Error');
          }
    });
    */
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
    require('../scripts/scheduler');
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

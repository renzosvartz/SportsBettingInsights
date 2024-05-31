const cron = require('node-cron');
const axios = require('axios');
const API_KEY = 'a9900799a28840df8115cc513eeef60c'; // Replace with your API key
const BASE_URL = 'https://api.sportsdata.io/v3/nba/scores/json/GamesByDate/'; // Example endpoint
const { exec } = require('child_process');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.resolve(__dirname, '../server/credentials/.env') });

// MongoDB connection setup
const uri = process.env.MONGO_CONNECTION_STRING;
const databaseAndCollection = {
    db: process.env.MONGO_DB_NAME,
    collection: process.env.MONGO_COLLECTION
};
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let predictions;

// Function to run the scraping script
async function runScrapingScript() 
{
    console.log('Running the scraping script...');

    // Path to your scraping script
    const scriptPath = path.resolve(__dirname, 'scrapeFanDuelPredictions.js');
    //console.log(`Script path: ${scriptPath}`);

    // Execute the scraping script
    const scriptPromise = new Promise((resolve, reject) => {
        exec(`node ${scriptPath}`, (error, stdout, stderr) => {
            if (error) 
            {
                console.error(`Error executing script: ${error.message}`);
            } 
            if (stderr) 
            {
                console.error(`Script stderr: ${stderr}`);
            } 
            
            console.log(`Script output: ${stdout}`);
            resolve();
        });
    });

    await scriptPromise;

    await client.connect();
    const db = client.db(databaseAndCollection.db);
    const collection = db.collection(databaseAndCollection.collection);

    // Retrieve predictions from MongoDB
    predictions = await collection.find({}).toArray();

    runUpdates();
}

// Run the scraping script immediately
runScrapingScript();

// Schedule the task to run every 24 hours
cron.schedule('0 0 * * *', () => {
    console.log('Scheduled task running...');
    runScrapingScript();
});

//console.log('Scheduler is set up to run immediately and then every 24 hours');

async function runUpdates()
{
    console.log("Updating games");
    let gameDates = ["2024-MAY-25", "2024-MAY-26", "2024-MAY-27","2024-MAY-28","2024-MAY-29", "2024-MAY-30"];;
    const {allGameData, allGameIds} = await fetchGameStatus(gameDates);
    //console.log(gameData);
    
    if (allGameData) 
    {
        predictions = predictions.map(prediction => {
            const game = allGameData.find(g => g.GameID === prediction.gameId);
            if (game) 
            {
                updatePredictionState(prediction, game);
            }
            // Return the prediction (updated or unchanged)
            return prediction});

        storeUpdatedPredictions();
    }
}

cron.schedule('0 * * * *', async () => { // Every hour
    runUpdates();
});

function updatePredictionState(prediction, game) 
{
    if (game.Status === 'Scheduled') 
    {
        prediction.status = 'Upcoming';
    } 
    else if (game.Status === 'InProgress') 
    {
        prediction.status = 'In Progress';
    } 
    else if (game.Status === 'Final') 
    {
        prediction.status = 'Settled';
    }
}

async function storeUpdatedPredictions() 
{
    try 
    {
        await client.connect();
        const db = client.db(databaseAndCollection.db);
        const collection = db.collection(databaseAndCollection.collection);
    
        // Use bulk write operations to update predictions
        const bulkOperations = predictions.map(prediction => ({
          updateOne: {
            filter: { _id: prediction._id },
            update: { $set: { status: prediction.status } },
          },
        }));
    
        // Execute the bulk write operations
        const result = await collection.bulkWrite(bulkOperations);
    
        console.log(`Updated ${result.modifiedCount} predictions`);
      } 
      catch (err) 
      {
            console.error('Error updating predictions:', err);
      } 
      finally 
      {
            await client.close();
      }
}

async function fetchGameStatus(gameDates) 
{
    try 
    {
        let allGameData = [];
        let allGameIds = [];

        for (let gameDate of gameDates)
        {
            const response = await axios.get(`${BASE_URL}${gameDate}`, {
                headers: {
                    'Ocp-Apim-Subscription-Key': API_KEY,
                },
            });
            const gameData = response.data;
            const gameIds = gameData.map(game => game.GameID);    
            allGameData = allGameData.concat(gameData);
            allGameIds = allGameIds.concat(gameIds);
        }
        
        return { allGameData, allGameIds };
    } 
    catch (error) 
    {
        console.error('Error fetching game status:', error);
        return null;
    }
}

module.exports = { runUpdates };
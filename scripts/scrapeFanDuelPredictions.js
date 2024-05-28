// scripts/scrapePredictions.js

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.resolve(__dirname, '../server/credentials/.env') });
const { extractFanDuelLinks } = require('./extractFanDuelLinks');

// MongoDB connection setup
const uri = process.env.MONGO_CONNECTION_STRING;
const databaseAndCollection = {
    db: process.env.MONGO_DB_NAME,
    collection: process.env.MONGO_COLLECTION
};

async function scrapeFanDuelPredictions() 
{
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Define the URLs to scrape
    const urls = await extractFanDuelLinks();
 
    const uniqueURLs = removeDuplicates(urls);
    console.log('Relevant links:', uniqueURLs);
    
    let allPredictionObjects = [];

    for (const url of uniqueURLs) 
    {
        // Navigate to the URL where the bet information is available
        console.log('Visiting ' + url);
        await page.goto(url);

        // Extract HTML for processing
        const html = await page.content();

        // Waits for the page to load then calls functions within the context of the page
        // Extract the name of the game
        const game = await page.evaluate(() => {
            const titleText = document.querySelector('h1').innerText;
        
            // Regex pattern for "Team1 vs. Team2" format
            const vsRegex = /(?:for\s+)?([\w-]+)\s+(?:vs\.|v[s.])\s+([\w-]+)/i;

            // Regex pattern for "Team1-Team2" format
            const dashRegex =/for (.*?) Game/;
        
            let team1 = '';
            let team2 = '';
        
            // Check if "Team1 vs. Team2" format matched
            const vsMatch = titleText.match(vsRegex);
            if (vsMatch !== null) 
            {
                team1 = vsMatch[1].trim(); // Get the first team
                team2 = vsMatch[2].trim(); // Get the second team
            } 
            else 
            {
                // Check if "Team1-Team2" format matched
                const dashMatch = titleText.match(dashRegex);
                if (dashMatch !== null) 
                    {
                    teamNames = dashMatch[1];
                    [team1, team2] = teamNames.split('-');
                }
            }
        
            const sortedTeams = [team1, team2].sort();

            return sortedTeams[0] + ' vs. ' + sortedTeams[1];
        });
        
        // Extract the prediction
        const allPredictions = await page.evaluate(() => {

            // Query for all predictions. Gives us a list of nodes that we can query further
            const h4Predictions = document.querySelectorAll('h4 a.Link___StyledA-sc-1xh888y-1.gaxpzh');
            const h3Predictions = document.querySelectorAll('h3 a.Link___StyledA-sc-1xh888y-1.gaxpzh');
            const predictionNodes = [...h4Predictions, ...h3Predictions];

            let predictions = [];

            predictionNodes.forEach((prediction) => { predictions.push(prediction.innerText);});

            return predictions;
        });

        // Extract the author's name
        const backer = await page.evaluate(() => {
            const backerElement = document.querySelector('div.AuthorCommon___StyledDiv3-sc-17pc1f2-2.cwAcPj span:first-child');
            return backerElement ? backerElement.innerText : null;
        });

        // Prepare the predictions data
        const predictionObjects = allPredictions.map((prediction) => {
            let {prediction: pred, odds} = parsePrediction(prediction);

            return {
                game: game,
                prediction: pred,
                odds: odds,
                author: backer
            };
        });

        // Add the predictionObjects to the array
        allPredictionObjects = allPredictionObjects.concat(predictionObjects);
    }

    // Log the scraped predictionObjects
    //console.log('Scraped Bet Information:', allPredictionObjects);

    // Save the predictions to a JSON file
    const filePath = path.join(__dirname, '../server/data/predictionObjects.json');
    fs.writeFileSync(filePath, JSON.stringify(allPredictionObjects, null, 2));

    // Save the predictions to MongoDB
    await saveToDatabase(allPredictionObjects);

    await browser.close();

    return allPredictionObjects;
}

function parsePrediction(prediction) {
    // Define a regex pattern to match the odds
    const oddsPattern = /(\([-+]?\d+\))/;

    // Match the odds pattern in the prediction string
    const oddsMatch = prediction.match(oddsPattern);

    prediction = prediction.replace(oddsPattern, '').trim();
    const odds = parseOdds(oddsMatch[0]);
    return { prediction, odds };
}

const parseOdds = (oddsString) => {
    const oddsMatch = oddsString.match(/\(([-+]\d+)\)/);
    return oddsMatch ? oddsMatch[1] : null;
};

function removeDuplicates(links) 
{
    const uniqueLinks = new Set(links);
    return Array.from(uniqueLinks);
}

async function saveToDatabase(data) 
{
    
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    try 
    {
        await client.connect();
        const db = client.db(databaseAndCollection.db);
        const collection = db.collection(databaseAndCollection.collection);

        //Clear
        //await collection.deleteMany({});

        // Create a unique index on the prediction and author fields
        await createUniqueIndex(collection);

        // Insert data into MongoDB one by one
        const insertedCount = [];
        for (const predictionObject of data) 
        {
            try 
            {
                await collection.insertOne(predictionObject);
                insertedCount.push(predictionObject);
            } 
            catch (err) 
            {
                if (err.code === 11000) 
                {
                    console.log(`Duplicate key error for prediction: ${predictionObject.prediction}, author: ${predictionObject.author}`);
                } 
                else 
                {
                    console.error("Error inserting document:", err);
                }
            }
        }

        // Log the number of documents inserted
        console.log(`${insertedCount.length} documents inserted`);
        console.log("Data saved to MongoDB");

    }
    catch (err) 
    {
        console.error("Error saving data to MongoDB", err);
    } 
    finally 
    {
        await client.close();
    }
}

async function createUniqueIndex(collection) 
{
    try 
    {
      await collection.createIndex({ prediction: 1, author: 1 }, { unique: true });
      console.log("Unique index created successfully");
    } 
    catch (err) 
    {
      console.error("Error creating unique index:", err);
    }
}

// Run the scraper
scrapeFanDuelPredictions().then(data => {
    //console.log('Scraped Data:', data);
}).catch(err => {
    console.error('Error:', err);
});

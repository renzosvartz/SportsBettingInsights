const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

// Function to run the scraping script
function runScrapingScript() 
{
    console.log('Running the scraping script...');

    // Path to your scraping script
    const scriptPath = path.resolve(__dirname, 'scrapeFanDuelPredictions.js');
    //console.log(`Script path: ${scriptPath}`);

    // Execute the scraping script
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {

        if (error) 
        {
            console.error(`Error executing script: ${error.message}`);
            //return;
        }
        if (stderr) 
        {
            console.error(`Script stderr: ${stderr}`);
            //return;
        }
        
        console.log(`Script output: ${stdout}`);
    });
}

// Run the scraping script immediately
runScrapingScript();

// Schedule the task to run every 24 hours
cron.schedule('0 0 * * *', () => {
    console.log('Scheduled task running...');
    runScrapingScript();
});

//console.log('Scheduler is set up to run immediately and then every 24 hours');
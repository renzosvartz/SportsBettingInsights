import React from 'react';

const ExpertPicks = ({ predictionObjects }) => {
    return (
        <div className="expert-picks-container">
            {predictionObjects.map((predictionObject, index) => (
                <div className="bet-card" key={index}>
                    <div className="bet-info">
                        <div className="prediction-text">{predictionObject.prediction}</div>
                        <p>Game: {predictionObject.game}</p>
                        <p>Bet Type: {predictionObject.betType}</p>
                        <p>Betting Odds: {predictionObject.odds}</p>
                    </div>
                    <div className="related-data">
                        <p>Related Data: N/A</p>
                        <p>Success History: N/A</p>
                        <p>Progress: {predictionObject.status}</p>
                        <div className="progress-bar">
                            <div className="progress" style={{ width: getRandomPercentage() }}></div>
                        </div>
                    </div>
                    <div className="actions">
                        <button disabled>View Details</button>
                        <button disabled>View Backers</button>
                        <button disabled>Place Bet</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

function getRandomPercentage() 
{
    // Generate a random number between 0 and 100 for the percentage
    return Math.floor(Math.random() * 101) + "%";
}

export default ExpertPicks;
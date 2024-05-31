import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState } from 'react';
import Banner from './components/Banner';
import Navigation from './components/Navigation';
import ExpertPicks from './components/ExpertPicks';
import TopBettors from './components/TopBettors';

function App() 
{
    const [predictionObjects, setPredictionObjects] = useState([]);

    // Populates predictionObjects
    useEffect(() => {
        fetch('/api/predictions')
            .then(response => response.json())
            .then(data => setPredictionObjects(data))
            .catch(error => console.error('Error fetching prediction objects:', error));
    }, []);

    return (
        <div className="App">
          <Banner />
          <Navigation />
          <TopBettors />
          <ExpertPicks predictionObjects={predictionObjects}/>
        </div>
    );
}

export default App;
// Banner.js
import React from 'react';

const TopBettors = () => {
  return (
    <div className="top-bettors-container">
        <div className="bettors-list">
        <div className="bettor">
            <span className="bettor-rank">#1</span>
            <span className="bettor-name">Renzo</span>
            <span className="bettor-points">1000 points</span>
          </div>
          <div className="bettor">
            <span className="bettor-rank">#2</span>
            <span className="bettor-name">John</span>
            <span className="bettor-points">500 points</span>
          </div>
          <div className="bettor">
            <span className="bettor-rank">#3</span>
            <span className="bettor-name">Jane</span>
            <span className="bettor-points">100 points</span>
          </div>
          {/* Repeat the bettor structure for each top bettor */}
        </div>
      </div>
  );
};

export default TopBettors;
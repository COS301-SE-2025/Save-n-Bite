import React from 'react';
import './GardenStats.css';

const GardenStats = ({ stats, garden, compactMode = false, isMobile = false }) => {
  if (!stats) {
    return (
      <div className={`garden-stats ${compactMode ? 'compact' : ''} ${isMobile ? 'mobile' : ''}`}>
        <div className="stats-header">
          <h3>Garden Statistics</h3>
        </div>
        <div className="stats-loading">
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`garden-stats ${compactMode ? 'compact' : ''} ${isMobile ? 'mobile' : ''}`}>
      {/* Main heading like Plant Inventory */}
      <div className="stats-header">
        <h3>Garden Statistics</h3>
      </div>

      {/* Next Milestones Section */}
      {stats.next_milestones && stats.next_milestones.length > 0 && (
        <div className="stats-section">
          <h4 className="section-heading">Next Milestones</h4>
          <div className="milestones-container">
            {stats.next_milestones.slice(0, compactMode || isMobile ? 2 : 3).map((milestone, index) => (
              <div key={index} className="milestone-item">
                <div className="milestone-header">
                  <span className="milestone-type">
                    {milestone.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="milestone-progress">
                    {milestone.current}/{milestone.target}
                  </span>
                </div>
                <p className="milestone-description">
                  {milestone.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements Section */}
      <div className="stats-section">
        <h4 className="section-heading">Achievements</h4>
        <div className="achievements-container">
          {Object.entries(stats.achieved_milestones || {}).length > 0 ? (
            Object.entries(stats.achieved_milestones).map(([type, milestones]) => (
              <div key={type} className="achievement-item">
                <span className="achievement-label">
                  {type.replace('_', ' ').toUpperCase()}:
                </span>
                <span className="achievement-count">
                  {milestones.length} achieved
                </span>
              </div>
            ))
          ) : (
            <div className="no-achievements">
              <p>No achievements yet</p>
              <small>Complete orders to unlock achievements!</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GardenStats;
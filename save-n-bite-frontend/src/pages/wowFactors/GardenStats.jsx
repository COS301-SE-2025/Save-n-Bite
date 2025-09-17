import React from 'react';
import './GardenStats.css';

const GardenStats = ({ stats, garden, compactMode = false }) => {
  if (!stats) {
    return (
      <div className="garden-stats">
        <h3>Garden Statistics</h3>
        <div className="stats-loading">
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className={`garden-stats ${compactMode ? 'compact' : ''}`}>
      <h3>Garden Statistics</h3>

      {/* Next Milestones - Moved to top */}
      {stats.next_milestones && stats.next_milestones.length > 0 && (
        <div className="stats-section">
          <h4>Next Milestones</h4>
          {stats.next_milestones.slice(0, compactMode ? 2 : 3).map((milestone, index) => (
            <div key={index} className="milestone-item">
              <div className="milestone-header">
                <span className="milestone-type">
                  {milestone.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="milestone-progress">
                  {milestone.current}/{milestone.target}
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${getProgressPercentage(milestone.current, milestone.target)}%` 
                  }}
                ></div>
              </div>
              <p className="milestone-description">
                {milestone.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Achievements - Moved below milestones */}
      <div className="stats-section">
        <h4>Achievements</h4>
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

      {!compactMode && (
        <>
          <div className="stats-section">
            <h4>Garden Progress</h4>
            <div className="completion-circle">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${garden?.completion_percentage || 0}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="percentage">
                  {garden?.completion_percentage?.toFixed(0) || 0}%
                </text>
              </svg>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GardenStats;
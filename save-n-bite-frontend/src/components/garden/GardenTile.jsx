// components/garden/GardenTile.jsx
// Fixed to properly size the PlantSVG component

import React from 'react';
import PlantSvg from './PlantSVG'; 
import './GardenTile.css';

const GardenTile = ({ 
  tile, 
  isSelected = false,
  isHighlighted = false,
  onTileClick,
  onPlantClick,
  onDragOver,
  onDragLeave,
  onDrop,
  showCoordinates = false, 
  className = ""
}) => {
  const { row, col, plant_details, custom_data } = tile;

  const handleTileClick = (e) => {
    e.stopPropagation();
    if (onTileClick) {
      onTileClick(tile);
    }
  };

  const handlePlantClick = (plantData) => {
    if (onPlantClick) {
      onPlantClick(plantData, tile);
    }
  };

  const handleDragOver = (e) => {
    if (onDragOver) {
      onDragOver(e, tile);
    }
  };

  const handleDragLeave = (e) => {
    if (onDragLeave) {
      onDragLeave(e, tile);
    }
  };

  const handleDrop = (e) => {
    if (onDrop) {
      onDrop(e, tile);
    }
  };

  return (
    <div
      className={`garden-tile ${className} ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${!plant_details ? 'empty' : 'planted'}`}
      style={{
        gridRow: row + 1,
        gridColumn: col + 1,
      }}
      onClick={handleTileClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-row={row}
      data-col={col}
    >
      {/* Earth texture background for empty tiles */}
      {!plant_details && (
        <div className="earth-texture">
          <svg className="earth-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id={`soil-${row}-${col}`} patternUnits="userSpaceOnUse" width="20" height="20">
                <rect width="20" height="20" fill="#8a400bff"/>
                <circle cx="5" cy="5" r="1" fill="#8a400bff" opacity="0.6"/>
                <circle cx="15" cy="10" r="0.8" fill="#5b4f42ff" opacity="0.4"/>
                <circle cx="10" cy="15" r="1.2" fill="#781ed2ff" opacity="0.5"/>
                <rect x="0" y="18" width="20" height="2" fill="#8b6a22ff" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#soil-${row}-${col})`}/>
          </svg>
        </div>
      )}

      {/* Plant SVG - FIXED: Added size prop and proper styling */}
      {plant_details && (
        <div className="tile-plant">
          <PlantSvg
            plantData={plant_details}
            isSelected={isSelected}
            onClick={handlePlantClick}
            customState={custom_data}
            className="plant-in-tile"
            size={60} // Explicit size for garden tiles
          />
        </div>
      )}
      
      {/* Tile coordinates overlay (for debugging only) */}
      {showCoordinates && process.env.NODE_ENV === 'development' && (
        <div className="tile-coordinates">
          {row},{col}
        </div>
      )}
    </div>
  );
};

export default GardenTile;
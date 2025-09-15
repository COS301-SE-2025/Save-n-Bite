import React from 'react';
import RivePlant from './RivePlant';
import './GardenTile.css';

const GardenTile = ({ 
  tile, 
  isSelected = false,
  isHighlighted = false,
  onTileClick,
  onPlantClick,
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

  return (
    <div
      className={`garden-tile ${className} ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      style={{
        gridRow: row + 1,
        gridColumn: col + 1,
      }}
      onClick={handleTileClick}
      data-row={row}
      data-col={col}
    >
      <RivePlant
        plantData={plant_details}
        isSelected={isSelected}
        onClick={handlePlantClick}
        customState={custom_data}
        className="tile-plant"
      />
      
      {/* Tile coordinates overlay (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="tile-coordinates">
          {row},{col}
        </div>
      )}
    </div>
  );
};

export default GardenTile;
import React, { useState, useCallback } from 'react';
import GardenTile from '../../components/garden/GardenTile';
import './GardenGrid.css';

const GardenGrid = ({ 
  gardenData, 
  selectedPlant = null,
  onTileSelect,
  onPlantInteract,
  mode = 'view' // 'view', 'place', 'move'
}) => {
  const [selectedTile, setSelectedTile] = useState(null);
  const [hoveredTile, setHoveredTile] = useState(null);

  const handleTileClick = useCallback((tile) => {
    if (mode === 'place' && selectedPlant && !tile.plant_details) {
      // Placing a plant
      if (onTileSelect) {
        onTileSelect(tile, 'place');
      }
    } else if (mode === 'move' && tile.plant_details) {
      // Selecting plant to move
      setSelectedTile(tile);
      if (onTileSelect) {
        onTileSelect(tile, 'select');
      }
    } else if (mode === 'move' && selectedTile && !tile.plant_details) {
      // Moving plant to new location
      if (onTileSelect) {
        onTileSelect(tile, 'move', selectedTile);
      }
      setSelectedTile(null);
    } else if (mode === 'view' && tile.plant_details) {
      // Viewing plant details
      if (onPlantInteract) {
        onPlantInteract(tile.plant_details, tile);
      }
    }
  }, [mode, selectedPlant, selectedTile, onTileSelect, onPlantInteract]);

  const handlePlantClick = useCallback((plantData, tile) => {
    if (onPlantInteract) {
      onPlantInteract(plantData, tile);
    }
  }, [onPlantInteract]);

  const getTileClassName = (tile) => {
    let className = '';
    
    if (mode === 'place' && selectedPlant && !tile.plant_details) {
      className += ' available-for-placement';
    }
    
    if (mode === 'move' && selectedTile && selectedTile.id === tile.id) {
      className += ' selected-for-move';
    }
    
    if (mode === 'move' && selectedTile && !tile.plant_details) {
      className += ' available-for-move';
    }
    
    return className.trim();
  };

  if (!gardenData || !gardenData.garden_tiles) {
    return (
      <div className="garden-grid-loading">
        <div className="loading-spinner">Loading garden...</div>
      </div>
    );
  }

  return (
    <div className="garden-container">
      <div className="garden-grid">
        {gardenData.garden_tiles.map((tile) => (
          <GardenTile
            key={tile.id}
            tile={tile}
            isSelected={selectedTile && selectedTile.id === tile.id}
            isHighlighted={hoveredTile && hoveredTile.id === tile.id}
            onTileClick={handleTileClick}
            onPlantClick={handlePlantClick}
            className={getTileClassName(tile)}
          />
        ))}
      </div>
      
      {/* Garden info overlay */}
      <div className="garden-info">
        <div className="garden-stats">
          <span>Plants: {gardenData.total_plants_placed}/64</span>
          <span>Completion: {gardenData.completion_percentage?.toFixed(1)}%</span>
        </div>
        
        {mode !== 'view' && (
          <div className="garden-mode-indicator">
            Mode: {mode.charAt(0).toUpperCase() + mode.slice(1)}
            {selectedTile && mode === 'move' && (
              <span> - Selected plant at [{selectedTile.row}, {selectedTile.col}]</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GardenGrid;
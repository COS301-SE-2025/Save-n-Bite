import React, { useState, useCallback } from 'react';
import GardenTile from '../../components/garden/GardenTile';
import './GardenGrid.css';

const GardenGrid = ({ 
  gardenData, 
  selectedPlant = null,
  onTileSelect,
  onPlantInteract,
  onDrop,
  draggedPlant,
  mode = 'view' // 'view', 'move'
}) => {
  const [selectedTile, setSelectedTile] = useState(null);
  const [hoveredTile, setHoveredTile] = useState(null);
  const [dragOverTile, setDragOverTile] = useState(null);

  const handleTileClick = useCallback((tile) => {
    if (mode === 'move' && tile.plant_details) {
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
  }, [mode, selectedTile, onTileSelect, onPlantInteract]);

  const handlePlantClick = useCallback((plantData, tile) => {
    if (onPlantInteract) {
      onPlantInteract(plantData, tile);
    }
  }, [onPlantInteract]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e, tile) => {
    e.preventDefault();
    if (!tile.plant_details && draggedPlant) {
      setDragOverTile(tile);
    }
  }, [draggedPlant]);

  const handleDragLeave = useCallback((e, tile) => {
    setDragOverTile(null);
  }, []);

  const handleDrop = useCallback((e, tile) => {
    e.preventDefault();
    setDragOverTile(null);
    
    if (!tile.plant_details && draggedPlant && onDrop) {
      onDrop(tile);
    }
  }, [draggedPlant, onDrop]);

  const getTileClassName = (tile) => {
    let className = '';
    
    if (mode === 'move' && selectedTile && selectedTile.id === tile.id) {
      className += ' selected-for-move';
    }
    
    if (mode === 'move' && selectedTile && !tile.plant_details) {
      className += ' available-for-move';
    }
    
    if (dragOverTile && dragOverTile.id === tile.id) {
      className += ' drag-over';
    }
    
    if (draggedPlant && !tile.plant_details) {
      className += ' available-for-placement';
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
      {/* Garden background with grass/earth SVG */}
      <div className="garden-background">
        <svg className="garden-earth-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="earthTexture" patternUnits="userSpaceOnUse" width="20" height="20">
              <rect width="20" height="20" fill="#8B4513"/>
              <circle cx="5" cy="5" r="1" fill="#A0522D"/>
              <circle cx="15" cy="10" r="0.5" fill="#CD853F"/>
              <circle cx="10" cy="15" r="1.5" fill="#D2691E"/>
            </pattern>
            <pattern id="grassTexture" patternUnits="userSpaceOnUse" width="10" height="10">
              <rect width="10" height="10" fill="#228B22"/>
              <path d="M2,10 Q2,8 2,6 Q2,8 2,10" stroke="#32CD32" strokeWidth="0.5" fill="none"/>
              <path d="M6,10 Q6,7 6,5 Q6,7 6,10" stroke="#90EE90" strokeWidth="0.3" fill="none"/>
              <path d="M8,10 Q8,8 8,6 Q8,8 8,10" stroke="#98FB98" strokeWidth="0.4" fill="none"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#earthTexture)"/>
          <rect width="100" height="15" y="85" fill="url(#grassTexture)" opacity="0.7"/>
        </svg>
      </div>

      <div className="garden-grid">
        {gardenData.garden_tiles.map((tile) => (
          <GardenTile
            key={tile.id}
            tile={tile}
            isSelected={selectedTile && selectedTile.id === tile.id}
            isHighlighted={hoveredTile && hoveredTile.id === tile.id}
            onTileClick={handleTileClick}
            onPlantClick={handlePlantClick}
            onDragOver={(e) => handleDragOver(e, tile)}
            onDragLeave={(e) => handleDragLeave(e, tile)}
            onDrop={(e) => handleDrop(e, tile)}
            showCoordinates={false} // Remove tile numbers from display
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
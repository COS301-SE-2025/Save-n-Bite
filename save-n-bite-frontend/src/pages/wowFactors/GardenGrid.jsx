import React, { useState, useCallback, useEffect } from 'react';
import GardenTile from '../../components/garden/GardenTile';
import gardenBackgroundSvg from '../../assets/images/backgrounds/garden-background.svg';
import './GardenGrid.css';

const GardenGrid = ({ 
  gardenData, 
  selectedPlant = null,
  onTileSelect,
  onPlantInteract,
  onDrop,
  draggedPlant,
  mode = 'view', // 'view', 'move'
  selectedTileForMove = null
}) => {
  const [selectedTile, setSelectedTile] = useState(null);
  const [hoveredTile, setHoveredTile] = useState(null);
  const [dragOverTile, setDragOverTile] = useState(null);

  // Sync local selectedTile with prop from parent
  useEffect(() => {
    setSelectedTile(selectedTileForMove);
  }, [selectedTileForMove]);

  // Clear selected tile when switching to view mode
  useEffect(() => {
    if (mode === 'view') {
      setSelectedTile(null);
    }
  }, [mode]);

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
      // Viewing plant details (only in view mode)
      if (onPlantInteract) {
        onPlantInteract(tile.plant_details, tile);
      }
    }
  }, [mode, selectedTile, onTileSelect, onPlantInteract]);

  const handlePlantClick = useCallback((plantData, tile) => {
    // Only allow plant details in view mode
    if (mode === 'view' && onPlantInteract) {
      onPlantInteract(plantData, tile);
    }
    // In move mode, plant clicks are handled by handleTileClick
  }, [mode, onPlantInteract]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e, tile) => {
    e.preventDefault();
    if (!tile.plant_details && (draggedPlant || selectedTile)) {
      setDragOverTile(tile);
    }
  }, [draggedPlant, selectedTile]);

  const handleDragLeave = useCallback((e, tile) => {
    setDragOverTile(null);
  }, []);

  const handleDrop = useCallback((e, tile) => {
    e.preventDefault();
    setDragOverTile(null);
    
    // Handle inventory plant drop
    if (!tile.plant_details && draggedPlant && onDrop) {
      onDrop(tile);
    }
    // Handle move mode plant drop
    else if (!tile.plant_details && selectedTile && mode === 'move' && onTileSelect) {
      onTileSelect(tile, 'move', selectedTile);
      setSelectedTile(null);
    }
  }, [draggedPlant, selectedTile, mode, onDrop, onTileSelect]);

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
      {/* Garden background with SVG image */}
      <div 
        className="garden-background" 
        style={{ 
          backgroundImage: `url(${gardenBackgroundSvg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

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
            showCoordinates={false}
            className={getTileClassName(tile)}
          />
        ))}
      </div>
      
    </div>
  );
};

export default GardenGrid;
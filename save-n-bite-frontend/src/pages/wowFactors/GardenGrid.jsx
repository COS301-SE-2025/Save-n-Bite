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
  mode = 'view', // 'view', 'move', 'harvest'
  selectedTileForMove = null,
  selectedTileForHarvest = null
}) => {
  const [selectedTile, setSelectedTile] = useState(null);
  const [hoveredTile, setHoveredTile] = useState(null);
  const [dragOverTile, setDragOverTile] = useState(null);

  // Sync local selectedTile with props from parent
  useEffect(() => {
    if (mode === 'move') {
      setSelectedTile(selectedTileForMove);
    } else if (mode === 'harvest') {
      setSelectedTile(selectedTileForHarvest);
    } else {
      setSelectedTile(null);
    }
  }, [selectedTileForMove, selectedTileForHarvest, mode]);

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
    } else if (mode === 'harvest' && tile.plant_details) {
      // Selecting plant for harvest
      setSelectedTile(tile);
      if (onTileSelect) {
        onTileSelect(tile, 'select');
      }
    } else if (mode === 'view' && tile.plant_details) {
      // Viewing plant details (only in view mode)
      if (onPlantInteract) {
        onPlantInteract(tile.plant_details, tile);
      }
    }
  }, [mode, selectedTile, onTileSelect, onPlantInteract]);

  const handlePlantClick = useCallback((plantData, tile) => {
    console.log('GardenGrid handlePlantClick called:', { mode, plantData: plantData?.name, tile: `${tile.row},${tile.col}` });
    
    // Only allow plant details in view mode
    if (mode === 'view' && onPlantInteract) {
      onPlantInteract(plantData, tile);
    } else if (mode === 'harvest' && onPlantInteract) {
      console.log('GardenGrid: Forwarding harvest interaction to parent');
      // Handle harvest interaction
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
    
    // Handle inventory plant drop - should work in all modes
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
    
    // Move mode states
    if (mode === 'move' && selectedTile && selectedTile.id === tile.id) {
      className += ' selected-for-move';
    }
    
    if (mode === 'move' && selectedTile && !tile.plant_details) {
      className += ' available-for-move';
    }
    
    // Harvest mode states
    if (mode === 'harvest' && selectedTile && selectedTile.id === tile.id) {
      className += ' selected-for-harvest';
    }
    
    if (mode === 'harvest' && tile.plant_details) {
      className += ' harvestable';
    }
    
    // Drag and drop states - should work in all modes for inventory items
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
      <div className="garden-container">
        <div className="garden-info">
          <h2>Garden Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="garden-container">

      <div 
        className="garden-grid"
        style={{
          backgroundImage: `url(${gardenBackgroundSvg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {gardenData.garden_tiles.map(tile => (
          <GardenTile
            key={`${tile.row}-${tile.col}`}
            tile={tile}
            isSelected={selectedTile && selectedTile.id === tile.id}
            isHighlighted={hoveredTile && hoveredTile.id === tile.id}
            onTileClick={handleTileClick}
            onPlantClick={handlePlantClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={getTileClassName(tile)}
            showCoordinates={false}
          />
        ))}
      </div>
    </div>
  );
};

export default GardenGrid;
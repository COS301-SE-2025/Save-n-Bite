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
  selectedTileForHarvest = null,
  isPlantingMode = false,
  selectedPlantItem = null,
  isMobile = false
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
    if (mode === 'view' && !isPlantingMode) {
      setSelectedTile(null);
    }
  }, [mode, isPlantingMode]);

  const handleTileClick = useCallback((tile) => {
    // Handle mobile planting mode
    if (isMobile && isPlantingMode) {
      if (onTileSelect) {
        onTileSelect(tile, 'plant');
      }
      return;
    }

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
  }, [mode, selectedTile, onTileSelect, onPlantInteract, isMobile, isPlantingMode]);

  const handlePlantClick = useCallback((plantData, tile) => {
    // Only allow plant details in view mode (not planting mode)
    if (mode === 'view' && !isPlantingMode && onPlantInteract) {
      onPlantInteract(plantData, tile);
    } else if (mode === 'harvest' && onPlantInteract) {
      // Handle harvest interaction
      onPlantInteract(plantData, tile);
    }
  }, [mode, onPlantInteract, isPlantingMode]);

  // Desktop drag and drop handlers
  const handleDragOver = useCallback((e, tile) => {
    if (isMobile) return; // Skip drag events on mobile
    
    e.preventDefault();
    if (!tile.plant_details && (draggedPlant || selectedTile)) {
      setDragOverTile(tile);
    }
  }, [draggedPlant, selectedTile, isMobile]);

  const handleDragLeave = useCallback((e, tile) => {
    if (isMobile) return; // Skip drag events on mobile
    
    setDragOverTile(null);
  }, [isMobile]);

  const handleDrop = useCallback((e, tile) => {
    if (isMobile) return; // Skip drag events on mobile
    
    e.preventDefault();
    setDragOverTile(null);
    
    // Handle inventory plant drop - desktop only
    if (!tile.plant_details && draggedPlant && onDrop) {
      onDrop(tile);
    }
    // Handle move mode plant drop - desktop only
    else if (!tile.plant_details && selectedTile && mode === 'move' && onTileSelect) {
      onTileSelect(tile, 'move', selectedTile);
      setSelectedTile(null);
    }
  }, [draggedPlant, selectedTile, mode, onDrop, onTileSelect, isMobile]);

  const getTileClassName = (tile) => {
    let className = '';
    
    // Mobile planting mode states
    if (isMobile && isPlantingMode) {
      if (selectedPlantItem && !tile.plant_details) {
        className += ' available-for-planting';
      }
      return className.trim();
    }
    
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
    
    // Drag and drop states - desktop only
    if (!isMobile) {
      if (dragOverTile && dragOverTile.id === tile.id) {
        className += ' drag-over';
      }
      
      if (draggedPlant && !tile.plant_details) {
        className += ' available-for-placement';
      }
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
        className={`garden-grid ${isMobile ? 'mobile-garden-grid' : ''}`}
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
            className={
              [
                getTileClassName(tile),
                tile.plant_details?.rarity ? `rarity-${tile.plant_details.rarity}` : '',
                isMobile ? 'mobile-tile' : ''
              ].join(' ')
            }
            showCoordinates={false}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );
};

export default GardenGrid;
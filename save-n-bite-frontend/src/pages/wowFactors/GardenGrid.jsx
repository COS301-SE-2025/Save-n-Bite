import React, { useState, useCallback, useEffect } from 'react';
import GardenTile from '../../components/garden/GardenTile';
import gardenBackgroundSvg from '../../assets/images/backgrounds/garden-background.svg';
import './GardenGrid.css';

const GardenGrid = ({ 
  gardenData, 
  selectedPlant = null,
  onTileSelect,
  onPlantInteract,
  mode = 'view',
  selectedTileForMove = null,
  selectedTileForHarvest = null,
  isPlantingMode = false,
  selectedPlantItem = null,
  isMobile = false
}) => {
  //console.log('🔍 GARDEN GRID DEBUG - gardenData:', gardenData);
  //console.log('🔍 GARDEN GRID DEBUG - garden_tiles:', gardenData?.garden_tiles);
  //console.log('🔍 GARDEN GRID DEBUG - garden_tiles is array:', Array.isArray(gardenData?.garden_tiles));
  //console.log('🔍 GARDEN GRID DEBUG - garden_tiles length:', gardenData?.garden_tiles?.length);

  // Check if garden_tiles exists and is an array
  if (!gardenData || !gardenData.garden_tiles || !Array.isArray(gardenData.garden_tiles)) {
    return (
      <div className="garden-grid-container">
        <div className="garden-loading">
          <p>Setting up your garden grid...</p>
          <p className="text-sm">Loading garden tiles from database</p>
        </div>
      </div>
    );
  }

  // If garden exists but has no tiles, show error
  if (gardenData.garden_tiles.length === 0) {
    return (
      <div className="garden-grid-container">
        <div className="garden-loading">
          <p className="text-red-600 dark:text-red-400">⚠️ Garden has no tiles!</p>
          <p className="text-sm">Your garden exists but has no tiles in the database.</p>
          <p className="text-sm">Please refresh the page or contact support.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Use ONLY real tiles from the backend
  const displayTiles = gardenData.garden_tiles;

  const [selectedTile, setSelectedTile] = useState(null);
  const [hoveredTile, setHoveredTile] = useState(null);

  // Debug log real tile structure
  useEffect(() => {
    if (displayTiles?.length > 0) {
      //console.log('🔍 REAL TILE STRUCTURE:', displayTiles[0]);
      //console.log('🔍 Display tiles count:', displayTiles.length);
    }
  }, [displayTiles]);

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

  useEffect(() => {
    if (mode === 'view' && !isPlantingMode) {
      setSelectedTile(null);
    }
  }, [mode, isPlantingMode]);

  const handleTileClick = useCallback((tile) => {
    // Handle planting mode for ALL screens
    if (isPlantingMode) {
      if (onTileSelect) {
        onTileSelect(tile, 'plant');
      }
      return;
    }

    if (mode === 'move' && tile.plant_details) {
      setSelectedTile(tile);
      if (onTileSelect) {
        onTileSelect(tile, 'select');
      }
    } else if (mode === 'move' && selectedTile && !tile.plant_details) {
      if (onTileSelect) {
        onTileSelect(tile, 'move', selectedTile);
      }
      setSelectedTile(null);
    } else if (mode === 'harvest' && tile.plant_details) {
      setSelectedTile(tile);
      if (onTileSelect) {
        onTileSelect(tile, 'select');
      }
    } else if (mode === 'view' && tile.plant_details) {
      if (onPlantInteract) {
        onPlantInteract(tile.plant_details, tile);
      }
    }
  }, [mode, selectedTile, onTileSelect, onPlantInteract, isPlantingMode]);

  const handlePlantClick = useCallback((plantData, tile) => {
    // Only allow plant details in view mode (not planting mode)
    if (mode === 'view' && !isPlantingMode && onPlantInteract) {
      onPlantInteract(plantData, tile);
    } else if (mode === 'harvest' && onPlantInteract) {
      // Handle harvest interaction
      onPlantInteract(plantData, tile);
    }
  }, [mode, onPlantInteract, isPlantingMode]);

  const getTileClassName = (tile) => {
    let className = '';
    
    if (isPlantingMode) {
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
        
    return className.trim();
  };

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
        {displayTiles.map(tile => (
          <GardenTile
            key={`${tile.row}-${tile.col}`}
            tile={tile}
            isSelected={selectedTile && selectedTile.id === tile.id}
            isHighlighted={hoveredTile && hoveredTile.id === tile.id}
            onTileClick={handleTileClick}
            onPlantClick={handlePlantClick}
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
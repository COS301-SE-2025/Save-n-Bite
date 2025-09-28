import { useState, useCallback } from 'react';

const useMobilePlantSelection = () => {
  const [selectedPlantItem, setSelectedPlantItem] = useState(null);
  const [isPlantingMode, setIsPlantingMode] = useState(false);

  const startPlantingMode = useCallback(() => {
    setIsPlantingMode(true);
    setSelectedPlantItem(null);
  }, []);

  const exitPlantingMode = useCallback(() => {
    setIsPlantingMode(false);
    setSelectedPlantItem(null);
  }, []);

  const selectPlantForPlanting = useCallback((plantItem) => {
    if (isPlantingMode) {
      setSelectedPlantItem(plantItem);
    }
  }, [isPlantingMode]);

  const handleTilePlacement = useCallback(async (tile, onPlacePlant) => {
    if (!isPlantingMode || !selectedPlantItem || tile.plant_details) {
      return false;
    }

    try {
      const plantId = selectedPlantItem.plant_details?.id || selectedPlantItem.plant;
      if (plantId && onPlacePlant) {
        await onPlacePlant(plantId, tile.row, tile.col);
        setSelectedPlantItem(null);
        return true;
      }
    } catch (error) {
      console.error('Plant placement failed:', error);
    }
    return false;
  }, [isPlantingMode, selectedPlantItem]);

  return {
    selectedPlantItem,
    isPlantingMode,
    startPlantingMode,
    exitPlantingMode,
    selectPlantForPlanting,
    handleTilePlacement
  };
};

export default useMobilePlantSelection;
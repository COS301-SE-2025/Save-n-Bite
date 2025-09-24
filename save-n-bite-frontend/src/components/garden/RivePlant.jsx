import React, { useCallback, useRef } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

const RivePlant = ({ 
  plantData, 
  isSelected = false, 
  onClick,
  customState = {},
  className = ""
}) => {
  const containerRef = useRef(null);

  // Determine which Rive file to use
  const getRiveAsset = () => {
    if (!plantData) return '/src/assets/rive/garden/empty_tile.riv';
    return `/src/assets/rive/plants/${plantData.rive_asset_name}.riv`;
  };

  const { rive, RiveComponent } = useRive({
    src: getRiveAsset(),
    stateMachines: 'PlantStateMachine', // Standard state machine name
    autoplay: true,
    onLoad: () => {
      console.log(`Loaded Rive animation for ${plantData?.name || 'empty tile'}`);
    },
    onLoadError: (error) => {
      console.error('Failed to load Rive animation:', error);
    },
  });

  // State machine inputs for plant interactions
  const hoverInput = useStateMachineInput(rive, 'PlantStateMachine', 'hover');
  const selectedInput = useStateMachineInput(rive, 'PlantStateMachine', 'selected');
  const growthStageInput = useStateMachineInput(rive, 'PlantStateMachine', 'growthStage');

  // Update state machine inputs when props change
  React.useEffect(() => {
    if (selectedInput) selectedInput.value = isSelected;
  }, [isSelected, selectedInput]);

  React.useEffect(() => {
    if (growthStageInput && customState.growth_stage) {
      growthStageInput.value = customState.growth_stage;
    }
  }, [customState.growth_stage, growthStageInput]);

  // Handle mouse interactions
  const handleMouseEnter = useCallback(() => {
    if (hoverInput) hoverInput.value = true;
  }, [hoverInput]);

  const handleMouseLeave = useCallback(() => {
    if (hoverInput) hoverInput.value = false;
  }, [hoverInput]);

  const handleClick = useCallback(() => {
    if (onClick) onClick(plantData);
  }, [onClick, plantData]);

  return (
    <div
      ref={containerRef}
      className={`rive-plant-container ${className} ${isSelected ? 'selected' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        width: '100%',
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <RiveComponent />
    </div>
  );
};

export default RivePlant;
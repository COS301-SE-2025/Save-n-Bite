import React from 'react';

const PlantSvg = ({ 
  plantData, 
  isSelected = false, 
  onClick, 
  customState = {}, 
  className = "" 
}) => {
  if (!plantData) return null;

  const handleClick = () => {
    if (onClick) {
      onClick(plantData);
    }
  };

  // Generate plant SVG based on plant data
  const getPlantSvg = () => {
    const { category, rarity, name } = plantData;
    const growth = customState.growth_stage || 'mature';
    
    // Base colors based on rarity
    const rarityColors = {
      common: { primary: '#22c55e', secondary: '#16a34a', accent: '#15803d' },
      uncommon: { primary: '#3b82f6', secondary: '#2563eb', accent: '#1d4ed8' },
      rare: { primary: '#a855f7', secondary: '#9333ea', accent: '#7c3aed' },
      epic: { primary: '#f59e0b', secondary: '#d97706', accent: '#b45309' },
      legendary: { primary: '#ef4444', secondary: '#dc2626', accent: '#b91c1c' }
    };

    const colors = rarityColors[rarity] || rarityColors.common;
    
    // Different plant shapes based on category
    const getPlantShape = () => {
      switch (category) {
        case 'herb':
          return (
            <g>
              {/* Stem */}
              <path 
                d="M50 80 Q48 60 50 40 Q52 60 50 80" 
                fill={colors.secondary} 
                stroke={colors.accent} 
                strokeWidth="1"
              />
              {/* Leaves */}
              <ellipse cx="45" cy="50" rx="8" ry="12" fill={colors.primary} opacity="0.9"/>
              <ellipse cx="55" cy="45" rx="6" ry="10" fill={colors.primary} opacity="0.8"/>
              <ellipse cx="47" cy="35" rx="5" ry="8" fill={colors.primary} opacity="0.9"/>
              {/* Small flowers for herbs */}
              <circle cx="50" cy="30" r="3" fill="#fbbf24" opacity="0.8"/>
              <circle cx="52" cy="32" r="2" fill="#f59e0b" opacity="0.6"/>
            </g>
          );
        
        case 'vegetable':
          return (
            <g>
              {/* Thicker stem for vegetables */}
              <path 
                d="M50 80 Q46 60 50 35 Q54 60 50 80" 
                fill={colors.secondary} 
                stroke={colors.accent} 
                strokeWidth="2"
              />
              {/* Broader leaves */}
              <ellipse cx="42" cy="55" rx="12" ry="15" fill={colors.primary} opacity="0.9"/>
              <ellipse cx="58" cy="50" rx="10" ry="13" fill={colors.primary} opacity="0.8"/>
              <ellipse cx="50" cy="40" rx="8" ry="11" fill={colors.primary} opacity="0.9"/>
              {/* Vegetable fruit/bulb */}
              <ellipse cx="50" cy="65" rx="6" ry="8" fill={colors.accent} opacity="0.7"/>
            </g>
          );
        
        case 'flower':
          return (
            <g>
              {/* Delicate stem */}
              <path 
                d="M50 80 Q49 55 50 30" 
                fill="none" 
                stroke={colors.secondary} 
                strokeWidth="2"
              />
              {/* Flower petals */}
              <g transform="translate(50,25)">
                <circle cx="0" cy="-5" r="4" fill={colors.primary} opacity="0.9"/>
                <circle cx="4" cy="-2" r="4" fill={colors.primary} opacity="0.8"/>
                <circle cx="4" cy="2" r="4" fill={colors.primary} opacity="0.9"/>
                <circle cx="0" cy="5" r="4" fill={colors.primary} opacity="0.8"/>
                <circle cx="-4" cy="2" r="4" fill={colors.primary} opacity="0.9"/>
                <circle cx="-4" cy="-2" r="4" fill={colors.primary} opacity="0.8"/>
                <circle cx="0" cy="0" r="3" fill="#fbbf24"/>
              </g>
              {/* Leaves */}
              <ellipse cx="45" cy="55" rx="6" ry="10" fill={colors.secondary} opacity="0.7"/>
              <ellipse cx="55" cy="60" rx="5" ry="8" fill={colors.secondary} opacity="0.6"/>
            </g>
          );
        
        case 'fruit':
          return (
            <g>
              {/* Tree-like structure */}
              <path 
                d="M50 80 Q48 65 50 45 Q52 65 50 80" 
                fill={colors.accent} 
                stroke={colors.secondary} 
                strokeWidth="2"
              />
              {/* Branches */}
              <path d="M50 50 Q40 45 35 40" fill="none" stroke={colors.accent} strokeWidth="1.5"/>
              <path d="M50 55 Q60 50 65 45" fill="none" stroke={colors.accent} strokeWidth="1.5"/>
              {/* Fruits */}
              <circle cx="35" cy="38" r="4" fill="#ef4444" opacity="0.8"/>
              <circle cx="65" cy="43" r="3" fill="#ef4444" opacity="0.9"/>
              <circle cx="52" cy="42" r="3.5" fill="#ef4444" opacity="0.7"/>
              {/* Leaves */}
              <ellipse cx="38" cy="35" rx="4" ry="6" fill={colors.primary} opacity="0.8"/>
              <ellipse cx="62" cy="40" rx="3" ry="5" fill={colors.primary} opacity="0.7"/>
            </g>
          );
        
        default:
          return (
            <g>
              {/* Default plant */}
              <path 
                d="M50 80 Q48 60 50 40 Q52 60 50 80" 
                fill={colors.secondary} 
                stroke={colors.accent} 
                strokeWidth="1"
              />
              <ellipse cx="45" cy="50" rx="8" ry="12" fill={colors.primary} opacity="0.9"/>
              <ellipse cx="55" cy="45" rx="6" ry="10" fill={colors.primary} opacity="0.8"/>
            </g>
          );
      }
    };

    // Growth stage scaling
    const getGrowthScale = () => {
      switch (growth) {
        case 'seedling': return 0.4;
        case 'young': return 0.7;
        case 'mature': return 1.0;
        case 'flowering': return 1.1;
        default: return 1.0;
      }
    };

    const scale = getGrowthScale();

    return (
      <svg 
        viewBox="0 0 100 100" 
        className={`plant-svg ${className} ${isSelected ? 'selected' : ''}`}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <defs>
          <filter id={`glow-${plantData.id}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          {isSelected && (
            <filter id={`selected-glow-${plantData.id}`}>
              <feGaussianBlur stdDeviation="3" result="selectedBlur"/>
              <feMerge> 
                <feMergeNode in="selectedBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          )}
        </defs>
        
        <g 
          transform={`scale(${scale}) translate(${(100 - 100 * scale) / 2}, ${(100 - 100 * scale) / 2})`}
          filter={isSelected ? `url(#selected-glow-${plantData.id})` : `url(#glow-${plantData.id})`}
        >
          {getPlantShape()}
        </g>
        
        {/* Rarity indicator */}
        {rarity !== 'common' && (
          <circle 
            cx="85" 
            cy="15" 
            r="8" 
            fill={colors.primary} 
            opacity="0.8"
            stroke="white" 
            strokeWidth="1"
          />
        )}
        
        {/* Selection indicator */}
        {isSelected && (
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="2" 
            strokeDasharray="5,5"
            opacity="0.7"
          />
        )}
      </svg>
    );
  };

  return (
    <div className={`plant-svg-container ${className}`}>
      {getPlantSvg()}
    </div>
  );
};

export default PlantSvg;
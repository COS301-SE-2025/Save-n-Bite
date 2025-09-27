// components/garden/PlantSVG.jsx
// Updated to work with current rive_asset_name field

import React, { useState, useEffect } from 'react';

const PlantSvg = ({ 
  plantData, 
  isSelected = false, 
  onClick, 
  customState = {}, 
  className = "",
  size = 40 // Size in pixels
}) => {
  const [svgContent, setSvgContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  if (!plantData) return null;

  useEffect(() => {
    loadSvgImage();
  }, [plantData.rive_asset_name, plantData.name]);

  const loadSvgImage = async () => {
    // Use rive_asset_name to build the SVG path
    let imagePath = null;
    
    if (plantData.rive_asset_name) {
      // Use rive_asset_name as filename
      imagePath = `/assets/images/plants/${plantData.rive_asset_name}.svg`;
    } else {
      // Fallback: use plant name, cleaned up
      const cleanName = plantData.name.toLowerCase()
        .replace(/\s+/g, '_')        // Replace spaces with underscores
        .replace(/[^a-z0-9_]/g, ''); // Remove special characters
      imagePath = `/assets/images/plants/${cleanName}.svg`;
    }

    setLoading(true);
    setError(false);

    try {
      console.log(`Attempting to load SVG from: ${imagePath}`);
      const response = await fetch(imagePath);
      
      if (!response.ok) {
        throw new Error(`Failed to load SVG: ${response.status} ${response.statusText}`);
      }
      
      const svgText = await response.text();
      setSvgContent(svgText);
      console.log(`Successfully loaded SVG for ${plantData.name}`);
    } catch (err) {
      console.warn(`Failed to load SVG for ${plantData.name} from ${imagePath}:`, err);
      setError(true);
      // Fallback to procedural generation
      setSvgContent(generateFallbackSvg());
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackSvg = () => {
    // Fallback procedural SVG generation (simplified version of original)
    const { category, rarity, name } = plantData;
    
    const rarityColors = {
      common: { primary: '#22c55e', secondary: '#16a34a', accent: '#15803d' },
      uncommon: { primary: '#3b82f6', secondary: '#2563eb', accent: '#1d4ed8' },
      rare: { primary: '#a855f7', secondary: '#9333ea', accent: '#7c3aed' },
      epic: { primary: '#f59e0b', secondary: '#d97706', accent: '#b45309' },
      legendary: { primary: '#ef4444', secondary: '#dc2626', accent: '#b91c1c' }
    };

    const colors = rarityColors[rarity] || rarityColors.common;
    
    return `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-${plantData.id}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <g filter="url(#glow-${plantData.id})">
          <!-- Simple plant shape -->
          <path d="M50 80 Q48 60 50 40 Q52 60 50 80" fill="${colors.secondary}" stroke="${colors.accent}" strokeWidth="1"/>
          <ellipse cx="45" cy="50" rx="8" ry="12" fill="${colors.primary}" opacity="0.9"/>
          <ellipse cx="55" cy="45" rx="6" ry="10" fill="${colors.primary}" opacity="0.8"/>
          <ellipse cx="47" cy="35" rx="5" ry="8" fill="${colors.primary}" opacity="0.9"/>
          <circle cx="50" cy="30" r="3" fill="#fbbf24" opacity="0.8"/>
        </g>
        
        ${rarity !== 'common' ? `<circle cx="85" cy="15" r="8" fill="${colors.primary}" opacity="0.8" stroke="white" strokeWidth="1"/>` : ''}
        
        ${isSelected ? `<circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" opacity="0.7"/>` : ''}
      </svg>
    `;
  };

  const handleClick = () => {
    if (onClick) {
      onClick(plantData);
    }
  };

  const processedSvgContent = svgContent ? svgContent.replace(
    /<svg([^>]*)>/i,
    `<svg$1 class="plant-svg ${isSelected ? 'selected' : ''}" style="width: ${size}px; height: ${size}px; cursor: pointer;">`
  ) : '';

  if (loading) {
    return (
      <div 
        className={`plant-svg-container loading ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="loading-spinner">🌱</div>
      </div>
    );
  }

  return (
    <div 
      className={`plant-svg-container ${className} ${error ? 'error' : ''}`}
      onClick={handleClick}
      style={{ 
        width: size ? `${size}px` : '100%', 
        height: size ? `${size}px` : '100%',
        minWidth: '30px',
        minHeight: '30px'
      }}
    >
      {svgContent ? (
        <div 
          dangerouslySetInnerHTML={{ __html: processedSvgContent }}
          className="svg-wrapper"
        />
      ) : (
        <div className="svg-placeholder">🌿</div>
      )}
      
      {/* Rarity indicator overlay */}
      {plantData.rarity !== 'common' && (
        <div className={`rarity-indicator ${plantData.rarity}`}>
          <span className="rarity-dot"></span>
        </div>
      )}
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="selection-ring"></div>
      )}
      
      {/* Debug info (only in development and only for errors) */}
      {process.env.NODE_ENV === 'development' && error && (
        <div className="debug-info">
          SVG Error: {plantData.rive_asset_name || 'No asset name'}
        </div>
      )}
    </div>
  );
};

export default PlantSvg;
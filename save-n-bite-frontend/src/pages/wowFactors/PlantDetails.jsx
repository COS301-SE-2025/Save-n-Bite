import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import './PlantDetails.css';

const PlantDetails = ({ plant, onClose }) => {
  const getCareIcon = (requirement) => {
    const icons = {
      easy: '😊',
      moderate: '😐',
      difficult: '😰',
      full_sun: '☀️',
      partial_sun: '⛅',
      shade: '🌑',
      any: '🌤️',
      low: '💧',
      high: '💦'
    };
    return icons[requirement] || '❓';
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#4CAF50',
      uncommon: '#2196F3', 
      rare: '#9C27B0',
      epic: '#FF9800',
      legendary: '#F44336'
    };
    return colors[rarity] || '#666';
  };

  // State for SVG loading (similar to PlantSVG component)
  const [svgContent, setSvgContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadSvgImage();
  }, [plant.rive_asset_name, plant.name]);

  const loadSvgImage = async () => {
    // Use rive_asset_name to build the SVG path (same logic as PlantSVG)
    let imagePath = null;
    
    if (plant.rive_asset_name) {
      // Use rive_asset_name as filename
      imagePath = `/assets/images/plants/${plant.rive_asset_name}.svg`;
    } else {
      // Fallback: use plant name, cleaned up
      const cleanName = plant.name.toLowerCase()
        .replace(/\s+/g, '_')        // Replace spaces with underscores
        .replace(/[^a-z0-9_]/g, ''); // Remove special characters
      imagePath = `/assets/images/plants/${cleanName}.svg`;
    }

    setLoading(true);
    setError(false);

    try {
      //console.o(`Attempting to load SVG from: ${imagePath}`);
      const response = await fetch(imagePath);
      
      if (!response.ok) {
        throw new Error(`Failed to load SVG: ${response.status} ${response.statusText}`);
      }
      
      const svgText = await response.text();
      setSvgContent(svgText);
      //console.o(`Successfully loaded SVG for ${plant.name}`);
    } catch (err) {
      console.warn(`Failed to load SVG for ${plant.name} from ${imagePath}:`, err);
      setError(true);
      setSvgContent(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} className="plant-details-modal">
      <div className="plant-details">
        {/* Header */}
        <div 
          className="plant-header"
          style={{ borderColor: getRarityColor(plant.rarity) }}
        >
          <div 
            className="plant-icon-large"
            style={{ backgroundColor: plant.icon_color }}
          >
            {loading ? (
              <div className="loading-spinner">🌱</div>
            ) : svgContent ? (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: svgContent.replace(
                    /<svg([^>]*)>/i,
                    `<svg$1 class="plant-image-large">`
                  )
                }}
                className="svg-wrapper"
              />
            ) : (
              <span className="plant-emoji-large">🌱</span>
            )}
          </div>
          
          <div className="plant-title">
            <h2>{plant.name}</h2>
            <p className="scientific-name">{plant.scientific_name}</p>
            <div className="plant-badges">
              <span className={`rarity-badge ${plant.rarity}`}>
                {plant.rarity.toUpperCase()}
              </span>
              <span className="category-badge">
                {plant.category}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="plant-content">
          {/* Description */}
          <section className="plant-section">
            <h3>About This Plant</h3>
            <p>{plant.description}</p>
            
            {plant.common_names && plant.common_names.length > 0 && (
              <div className="common-names">
                <strong>Also known as:</strong> {plant.common_names.join(', ')}
              </div>
            )}
          </section>

          {/* Care requirements */}
          <section className="plant-section">
            <h3>Care Requirements</h3>
            <div className="care-grid">
              <div className="care-item">
                <span className="care-icon">
                  {getCareIcon(plant.care_difficulty)}
                </span>
                <div>
                  <strong>Difficulty</strong>
                  <span>{plant.care_difficulty}</span>
                </div>
              </div>
              
              <div className="care-item">
                <span className="care-icon">
                  {getCareIcon(plant.sunlight_requirements)}
                </span>
                <div>
                  <strong>Sunlight</strong>
                  <span>{plant.sunlight_requirements.replace('_', ' ')}</span>
                </div>
              </div>
              
              <div className="care-item">
                <span className="care-icon">
                  {getCareIcon(plant.water_requirements)}
                </span>
                <div>
                  <strong>Water</strong>
                  <span>{plant.water_requirements}</span>
                </div>
              </div>

              <div className="care-item">
                <span className="care-icon">🌍</span>
                <div>
                  <strong>Origin</strong>
                  <span>{plant.native_region}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Fun facts */}
          <section className="plant-section">
            <h3>Fun Facts</h3>
            <div className="fun-facts">
              <p>{plant.fun_facts}</p>
            </div>
          </section>

          {/* Growing tips */}
          <section className="plant-section">
            <h3>Growing Tips</h3>
            <div className="growing-tips">
              <p>{plant.growing_tips}</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="plant-footer">
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PlantDetails;
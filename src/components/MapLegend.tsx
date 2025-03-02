import React from 'react';
import styled from 'styled-components';
import { generateColorLegend } from '@/utils/colorScale';
import { neutralColors } from '@/styles/colors';

interface MapLegendProps {
  maxCount: number;
}

const LegendContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 200px;
  font-size: 12px;
`;

const LegendTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 14px;
  color: ${neutralColors[800]};
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
`;

const ColorBox = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  background-color: ${props => props.color};
  margin-right: 8px;
  border-radius: 3px;
`;

const LegendText = styled.span`
  color: ${neutralColors[700]};
`;

const MapLegend: React.FC<MapLegendProps> = ({ maxCount }) => {
  const legendItems = generateColorLegend(maxCount);

  return (
    <LegendContainer>
      <LegendTitle>Projects per Country</LegendTitle>
      {legendItems.map((item, index) => (
        <LegendItem key={index}>
          <ColorBox color={item.color} />
          <LegendText>
            {item.min === item.max
              ? item.min
              : `${item.min} - ${item.max}`}
          </LegendText>
        </LegendItem>
      ))}
    </LegendContainer>
  );
};

export default MapLegend; 
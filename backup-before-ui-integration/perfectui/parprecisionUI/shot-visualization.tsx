import React, { useEffect, useRef } from 'react';

const ShotVisualization = ({ 
  distance = 200,  // yards
  lateralOffset = 0, // yards, positive is right, negative is left
  windSpeed = 0,  // mph
  windDirection = 0  // degrees, 0 is N, 90 is E
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Constants for drawing
  const PADDING = 40;
  const LINE_WIDTH = 2;
  const ARROW_SIZE = 8;
  const BALL_SIZE = 6;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate scaling factors
    const effectiveHeight = height - 2 * PADDING;
    const effectiveWidth = width - 2 * PADDING;
    const scale = Math.min(
      effectiveHeight / distance,
      effectiveWidth / (Math.abs(lateralOffset) * 2 + 20)
    );
    
    // Calculate positions
    const startX = width / 2;
    const startY = height - PADDING;
    const endX = startX + (lateralOffset * scale);
    const endY = PADDING + 20;  // Leave room for direction label
    
    // Draw background grid
    ctx.strokeStyle = '#4b5563';  // gray-600
    ctx.lineWidth = 0.5;
    
    // Draw center line
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(width / 2, PADDING);
    ctx.lineTo(width / 2, height - PADDING);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw shot path
    ctx.strokeStyle = '#10b981';  // emerald-500
    ctx.lineWidth = LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw start point (ball)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(startX, startY, BALL_SIZE, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw end point
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(endX, endY, BALL_SIZE, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw distance label
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    const distanceText = `${Math.round(distance)} yards`;
    ctx.fillText(distanceText, width / 2, height - 10);
    
    // Draw direction label if there's lateral movement
    if (lateralOffset !== 0) {
      const direction = lateralOffset > 0 ? 'right' : 'left';
      const offsetText = `${Math.abs(Math.round(lateralOffset))} yards ${direction}`;
      ctx.fillText(offsetText, endX, endY - 15);
    }
    
    // Draw wind vector if wind speed > 0
    if (windSpeed > 0) {
      const windX = PADDING + 60;
      const windY = PADDING + 20;
      const windAngle = (windDirection - 90) * Math.PI / 180;
      const windLength = 20;
      
      ctx.strokeStyle = '#3b82f6';  // blue-500
      ctx.fillStyle = '#3b82f6';
      ctx.lineWidth = 2;
      
      // Draw wind arrow
      ctx.beginPath();
      ctx.moveTo(windX, windY);
      ctx.lineTo(
        windX + Math.cos(windAngle) * windLength,
        windY + Math.sin(windAngle) * windLength
      );
      ctx.stroke();
      
      // Draw wind speed
      ctx.fillText(`${windSpeed} mph`, windX + 30, windY + 5);
    }
  }, [distance, lateralOffset, windSpeed, windDirection]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-800 rounded-xl p-4">
      <canvas 
        ref={canvasRef}
        width={400}
        height={300}
        className="w-full bg-gray-900 rounded-lg"
      />
    </div>
  );
};

export default ShotVisualization;
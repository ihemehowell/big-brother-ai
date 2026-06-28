'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function RelationshipGraph() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous SVG
    d3.select(container).select("svg").remove();

    // Sample data - in reality this would come from the backend/simulation
    const nodes = [
      { id: 'Alex', group: 1, relationships: { Sam: 0.8, Jamie: -0.6, Taylor: 0.3, Casey: -0.2, Morgan: -0.7 } },
      { id: 'Sam', group: 1, relationships: { Alex: 0.8, Jamie: -0.3, Taylor: 0.6, Casey: 0.1, Morgan: -0.4 } },
      { id: 'Jamie', group: 2, relationships: { Alex: -0.6, Sam: -0.3, Taylor: -0.2, Casey: 0.5, Morgan: 0.7 } },
      { id: 'Taylor', group: 2, relationships: { Alex: 0.3, Sam: 0.6, Jamie: -0.2, Casey: 0.4, Morgan: -0.1 } },
      { id: 'Casey', group: 3, relationships: { Alex: -0.2, Sam: 0.1, Jamie: 0.5, Taylor: 0.4, Morgan: 0.8 } },
      { id: 'Morgan', group: 3, relationships: { Alex: -0.7, Sam: -0.4, Jamie: 0.7, Taylor: -0.1, Casey: 0.8 } }
    ];

    // Set up SVG with proper dimensions
    const svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', '0 0 200 180')
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // FIX: svg.attr('width')/('height') return '100%' (a string), so +'100%' is NaN.
    // Use the actual viewBox coordinate space instead.
    const width = 200;
    const height = 180;

    // Build links based on relationship strength BEFORE creating the simulation,
    // so they can be passed into forceLink (previously this used an empty array,
    // meaning the link force did nothing).
    const links = [];
    nodes.forEach(node => {
      Object.entries(node.relationships).forEach(([targetId, strength]) => {
        if (Math.abs(strength) > 0.2) { // Only show significant relationships
          links.push({
            source: node.id,
            target: targetId,
            value: strength
          });
        }
      });
    });

    // Remove duplicates (since we add both directions)
    const uniqueLinks = [];
    const seen = new Set();
    links.forEach(link => {
      const key = `${link.source}-${link.target}`;
      const reverseKey = `${link.target}-${link.source}`;
      if (!seen.has(key) && !seen.has(reverseKey)) {
        seen.add(key);
        uniqueLinks.push(link);
      }
    });

    // Create simulation with stronger forces for better separation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(uniqueLinks)
        .id(d => d.id)
        .distance(80)
        .strength(0.8))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(22))
      .force('x', d3.forceX().strength(0.05))
      .force('y', d3.forceY().strength(0.05));

    // Draw links
    const link = svg.append('g')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(uniqueLinks)
      .join('line')
      .attr('stroke', d => {
        const strength = d.value;
        if (strength > 0.3) return '#10b981'; // Positive - green
        if (strength < -0.3) return '#ef4444'; // Negative - red
        return '#6b7280'; // Neutral - gray
      })
      .attr('stroke-width', d => Math.max(1, Math.abs(d.value) * 3))
      .attr('stroke-dasharray', d => Math.abs(d.value) < 0.3 ? '2,2' : '0');

    // Draw nodes with glow effect
    const node = svg.append('g')
      .attr('cursor', 'pointer')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(drag(simulation));

    // Add outer glow for selected node
    node.append('circle')
      .attr('r', 24)
      .attr('fill', 'none')
      .attr('stroke-width', 2)
      .attr('stroke', 'white')
      .attr('opacity', 0);

    // Add main circle
    node.append('circle')
      .attr('r', 16)
      .attr('fill', d => d.group === 1 ? '#3b82f6' : d.group === 2 ? '#10b981' : '#f59e0b')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add inner highlight
    node.append('circle')
      .attr('r', 10)
      .attr('fill', d => d.group === 1 ? '#60a5fa' : d.group === 2 ? '#34d399' : d.group === 3 ? '#fbbf24' : '#fff');

    // Add labels with background for readability
    const label = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('fill', '#fff')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', 8)
      .attr('y', '0.31em')
      .text(d => d.id)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle');

    // Add connection labels on lines
    const linkLabels = svg.append('g')
      .attr('fill', 'none')
      .attr('font-size', 9)
      .selectAll('text')
      .data(uniqueLinks)
      .join('text')
      .attr('x', d => (d.source.x + d.target.x) / 2)
      .attr('y', d => (d.source.y + d.target.y) / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(d => {
        const strength = Math.abs(d.value);
        if (strength > 0.7) return '💕';
        if (strength > 0.3) return '👍';
        if (strength < -0.7) return '💔';
        if (strength < -0.3) return '👎';
        return '➖';
      })
      .style('pointer-events', 'none');

    // Add halo/glow effect for better visibility
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'glow');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'coloredBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    // Apply glow to connections
    link.filter(d => Math.abs(d.value) > 0.5)
      .attr('filter', 'url(#glow)');

    // Update positions
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);

      label
        .attr('x', d => d.x + 18)
        .attr('y', d => d.y);

      linkLabels
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);
    });

    // Drag functionality
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    // Cleanup
    return () => {
      simulation.stop();
      svg.remove();
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-400">
          <div className="flex justify-center space-x-3">
            <span>💚 Strong Positive</span>
            <span>💔 Strong Negative</span>
            <span>➖ Neutral/Weak</span>
          </div>
        </div>
      </div>
    </div>
  );
}
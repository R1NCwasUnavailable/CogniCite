import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function GraphMap({ graph }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !graph || !graph.nodes || graph.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous rendering

    const width = svgRef.current.clientWidth || 500;
    const height = svgRef.current.clientHeight || 400;

    // Deep copy nodes and links since D3 mutates them
    const nodes = graph.nodes.map((d) => ({ ...d }));
    const links = graph.edges.map((d) => ({ ...d }));

    // Define color mappings
    const getRelationColor = (relation) => {
      switch (relation) {
        case "supports":
          return "#10b981"; // green
        case "contradicts":
          return "#ef4444"; // red
        case "extends":
          return "#3b82f6"; // blue
        default:
          return "#71717a"; // zinc-500
      }
    };

    // Main Group for Zoom/Pan
    const container = svg.append("g");

    // Add Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });
    svg.call(zoom);

    // Create markers for arrows on links
    svg.append("defs").selectAll("marker")
      .data(["supports", "contradicts", "extends", "default"])
      .enter()
      .append("marker")
      .attr("id", (d) => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 26) // offset arrow head to sit exactly on node boundary (radius 20 + offset)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", (d) => getRelationColor(d));

    // Force Simulation Setup
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(45));

    // Render Edges (links)
    const link = container.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", (d) => getRelationColor(d.relation))
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2.2)
      .attr("marker-end", (d) => `url(#arrow-${d.relation || "default"})`);

    // Render Drag handlers
    const drag = (simulation) => {
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    };

    // Render Nodes (groups containing circles and texts)
    const node = container.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .call(drag(simulation));

    // Glow filter or shadow effect
    node.append("circle")
      .attr("r", 20)
      .attr("fill", "#09090b")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("class", "cursor-pointer");

    // Micro pulse center node dot
    node.append("circle")
      .attr("r", 5)
      .attr("fill", "#3b82f6")
      .attr("class", "pointer-events-none");

    // Labels below nodes
    node.append("text")
      .text((d) => d.label)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#e4e4e7")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("class", "pointer-events-none select-none drop-shadow-md")
      .each(function (d) {
        // Simple text truncating logic in SVG
        const self = d3.select(this);
        const textLength = self.node().getComputedTextLength();
        const maxLen = 95;
        if (textLength > maxLen) {
          let text = d.label;
          while (self.node().getComputedTextLength() > maxLen && text.length > 0) {
            text = text.slice(0, -1);
            self.text(text + "...");
          }
        }
      });

    // Label for years inside node bubble or right next to it
    node.append("text")
      .text((d) => d.year)
      .attr("y", -26)
      .attr("text-anchor", "middle")
      .attr("fill", "#71717a")
      .attr("font-size", "9px")
      .attr("class", "pointer-events-none select-none");

    // Update coordinates on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graph]);

  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <svg className="w-10 h-10 mb-3 opacity-40 text-zinc-400 animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        <p className="text-xs">No graph relations mapped. Add papers that reference each other to show links.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <svg ref={svgRef} className="w-full h-full block" />
      
      {/* Legend */}
      <div className="absolute bottom-3 left-4 bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-lg text-[10px] space-y-1.5 backdrop-blur shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-0.5 bg-[#10b981]" />
          <span className="text-zinc-400">Supports</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-0.5 bg-[#ef4444]" />
          <span className="text-zinc-400">Contradicts</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-0.5 bg-[#3b82f6]" />
          <span className="text-zinc-400">Extends</span>
        </div>
      </div>
    </div>
  );
}

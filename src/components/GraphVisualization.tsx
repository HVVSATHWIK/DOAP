import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Step {
  id: string;
  toolName: string;
  rationale: string;
  mockPayload: string;
  humanApprovalRequired: boolean;
}

interface GraphVisualizationProps {
  plan: Step[];
  activeStepIndex: number;
}

export function GraphVisualization({ plan, activeStepIndex }: GraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || plan.length === 0) return;

    const width = 800;
    const height = 400;
    const svg = d3.select(svgRef.current);
    
    // Clear previous renders
    svg.selectAll("*").remove();

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const nodeWidth = 160;
    const nodeHeight = 60;
    const padding = 60;

    // Calculate node horizontal positions
    const nodes = plan.map((step, i) => ({
      ...step,
      x: padding + i * (nodeWidth + padding),
      y: height / 2 - nodeHeight / 2,
      index: i
    }));

    // Create links
    const links = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      links.push({
        source: nodes[i],
        target: nodes[i + 1]
      });
    }

    // Add arrowhead marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#94a3b8")
      .style("stroke", "none");

    const activeArrowhead = svg.select("defs").append("marker")
      .attr("id", "arrowhead-active")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#2563eb")
      .style("stroke", "none");

    // Draw links
    svg.selectAll(".link")
      .data(links)
      .join("path")
      .attr("class", "link")
      .attr("d", d => {
        const startX = d.source.x + nodeWidth;
        const startY = d.source.y + nodeHeight / 2;
        const endX = d.target.x;
        const endY = d.target.y + nodeHeight / 2;
        const cp1x = startX + (endX - startX) / 2;
        return `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp1x} ${endY}, ${endX} ${endY}`;
      })
      .attr("fill", "none")
      .attr("stroke", d => {
        if (d.source.index < activeStepIndex) return "#2563eb";
        return "#cbd5e1";
      })
      .attr("stroke-width", d => d.source.index < activeStepIndex ? 3 : 2)
      .attr("marker-end", d => d.source.index < activeStepIndex ? "url(#arrowhead-active)" : "url(#arrowhead)");

    // Draw nodes
    const nodeGroups = svg.selectAll(".node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x}, ${d.y})`);

    // Node wrapper rectangle
    nodeGroups.append("rect")
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr("rx", 8)
      .attr("fill", d => {
        if (d.index < activeStepIndex) return "#ecfdf5"; // past
        if (d.index === activeStepIndex) return "#eff6ff"; // active
        return "#ffffff"; // upcoming
      })
      .attr("stroke", d => {
        if (d.index < activeStepIndex) return "#34d399";
        if (d.index === activeStepIndex) return "#3b82f6";
        return "#cbd5e1";
      })
      .attr("stroke-width", d => d.index === activeStepIndex ? 2 : 1)
      .attr("class", d => d.index === activeStepIndex ? "shadow-lg" : "shadow-sm");

    // Node tool name text
    nodeGroups.append("text")
      .attr("x", 12)
      .attr("y", 24)
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", d => {
        if (d.index < activeStepIndex) return "#065f46";
        if (d.index === activeStepIndex) return "#1e40af";
        return "#334155";
      })
      .text(d => d.toolName.length > 20 ? d.toolName.substring(0, 18) + '...' : d.toolName);

    // Node explicit step indicator
    nodeGroups.append("text")
      .attr("x", 12)
      .attr("y", 46)
      .attr("font-size", "11px")
      .attr("fill", "#64748b")
      .text(d => `Step ${d.index + 1}`);

    // Human Validation indicator
    nodeGroups.append("circle")
      .attr("cx", nodeWidth - 16)
      .attr("cy", nodeHeight / 2)
      .attr("r", 6)
      .attr("fill", d => d.humanApprovalRequired ? "#f97316" : "none");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
         .scaleExtent([0.5, 2])
         .on('zoom', (e) => {
             svg.selectAll('.node').attr('transform', d => `translate(${e.transform.x + (d as any).x * e.transform.k}, ${e.transform.y + (d as any).y * e.transform.k}) scale(${e.transform.k})`);
             svg.selectAll('.link').attr('transform', e.transform);
         });
    
    // Note: To keep it simple without full zoom scaling recalculations, we just let it be responsive.
    // Instead of d3.zoom we will just center it.
    
    const totalWidth = nodes.length > 0 ? nodes[nodes.length - 1].x + nodeWidth + padding : width;
    svg.attr("viewBox", `0 0 ${totalWidth} ${height}`);

  }, [plan, activeStepIndex]);

  if (!plan || plan.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto bg-slate-50 dark:bg-slate-900/50 border border-slate-200 rounded-2xl p-4 shadow-inner mb-8">
       <div className="flex items-center justify-between mb-2">
         <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Orchestration Graph</h3>
         <div className="flex gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Completed</span>
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Active</span>
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> HITL Node</span>
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300" /> Pending</span>
         </div>
       </div>
       <svg ref={svgRef} className="w-full h-[200px]" />
    </div>
  );
}

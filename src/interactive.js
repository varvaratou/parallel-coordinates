pc.interactive = function() {
  flags.interactive = true;
  return this;
};

// expose a few objects
pc.xscale = xscale;
pc.ctx = ctx;
pc.canvas = canvas;
pc.g = function() { return g; };

// rescale for height, width and margins
// TODO currently assumes chart is brushable, and destroys old brushes
pc.resize = function() {
  // reference the current brushMode
  var currentBrushMode = pc.brushMode();
  
  // reinstalling brushes when resizing currently works for "1D-axes" and "1D-axes-multi"
  if (currentBrushMode === "1D-axes" || currentBrushMode === "1D-axes-multi") {
    //store the current brush state
    var brushModeState = pc.brushExtents();
  }
  
  // selection size
  pc.selection.select("svg")
    .attr("width", __.width)
    .attr("height", __.height)
  pc.svg.attr("transform", "translate(" + __.margin.left + "," + __.margin.top + ")");

  // scales
  pc.autoscale();

  // axes, destroys old brushes.
  if (g) pc.createAxes();
  if (flags.brushable) pc.brushable();
  if (flags.reorderable) pc.reorderable();
  
  // reinstalling brushes when resizing currently works for "1D-axes" and "1D-axes-multi"
  // createAxes() destroyed the brush elements, reinstall them and restore the brush state
  if (currentBrushMode === "1D-axes" || currentBrushMode === "1D-axes-multi") {
    // install() recreates the brush elements and their events, assigns empty brush extents
    brushmodeObject.install();
    // set the empty brush extents to the saved brush state
    pc.brushExtents(brushModeState);
  }

  events.resize.call(this, {width: __.width, height: __.height, margin: __.margin});
  return this;
};

// highlight an array of data
pc.highlight = function(data, keepHighlights) {
  if (arguments.length === 0) {
    return __.highlighted;
  }

  if (keepHighlights == true) {
    __.highlighted = __.highlighted.concat(data);
  } 
  else {
    __.highlighted = data;
    pc.clear("highlight");
  }

  d3.selectAll([canvas.foreground, canvas.brushed]).classed("faded", true);
  data.forEach(path_highlight);
  events.highlight.call(this, data);
  return this;
};

// clear highlighting
pc.unhighlight = function() {
  __.highlighted = [];
  pc.clear("highlight");
  d3.selectAll([canvas.foreground, canvas.brushed]).classed("faded", false);
  return this;
};

// calculate 2d intersection of line a->b with line c->d
// points are objects with x and y properties
pc.intersection =  function(a, b, c, d) {
  return {
    x: ((a.x * b.y - a.y * b.x) * (c.x - d.x) - (a.x - b.x) * (c.x * d.y - c.y * d.x)) / ((a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x)),
    y: ((a.x * b.y - a.y * b.x) * (c.y - d.y) - (a.y - b.y) * (c.x * d.y - c.y * d.x)) / ((a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x))
  };
};

function position(d) {
  if (xscale.range().length === 0) {
    xscale.rangePoints([0, w()], 1);
  }
  var v = dragging[d];
  return v == null ? xscale(d) : v;
}

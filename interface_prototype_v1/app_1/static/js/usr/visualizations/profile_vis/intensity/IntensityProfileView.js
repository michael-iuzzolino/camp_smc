var IntensityProfileViewConstructor = function(model) {
    this.model = model;
    this.plot_g = null;
    this.x_offset = null;
    this.colors = {};
    this.mark_radius = null;
    this.dimensions = {};
    this.active_display = null;
    this.parent_svg = null;
    this.controller = null;

    this.INITIALIZED = false;

    this.initParams();
    this.initLegendParams();
};


IntensityProfileViewConstructor.prototype = {
    init: function(parent_svg, controller) {
        this.parent_svg = parent_svg;
        this.controller = controller;

        this.INITIALIZED = false;
    },

    initPlotGroup: function() {
        var this_view = this;

        // Create plot group for intensity
        // -------------------------------
        this.plot_g = this.parent_svg.append("g")
            .attr("id", "intensity_plot_g")
            .attr("transform", function() {
                var new_y = this_view.dimensions.main.height * 0.525;
                return "translate("+this_view.x_offset+","+new_y+")";
            });

        // Add BACKGROUND
        // --------------
        this.plot_g.append("rect")
            .attr("id", "intensity_plot_g_background")
            .attr("height", this_view.dimensions.plot_group.height)
            .attr("width", this_view.dimensions.plot_group.width)
            .style("fill", "white");
    },


    initNewTrack: function() {

        this.INITIALIZED = true;


        // Set controller
        // ---------------------------
        var controller = this.controller;
        // ---------------------------


        // Initialize container and view/model variables
        // ----------------------------------
        var this_view = this;
        var this_model = this.model;
        // ----------------------------------


        // Init Plot Group
        // ---------------
        this.initPlotGroup();
        // ---------------


        // Add Axes
        // ---------------
        this.addAxes();
        // ---------------


        // Interaction group
        // -------------------------------------------------------------
        var interaction_g = this_view.plot_g.append("g")
            .attr("id", "intensity_plot_interaction_layer")
            .on("mousemove", function() {
                controller.markerMousemove(this, this_model, this_view);
            })
            .on("mouseout", function() {
                controller.markerMouseout();
            })
            .on("click", function() {
                controller.markerMouseClick(this, this_model, this_view);
            });
        // -------------------------------------------------------------


        // INTENSITY group
        // -------------------------------------------------------------
        var intensity_g = interaction_g.append("g").attr("id", "intensity_g");
        // -------------------------------------------------------------



        // Add MOUSE INTERACTION LAYER
        // ----------------------------------------------------
        interaction_g.append("rect").attr("id", "intensity_interaction_g");
        // ----------------------------------------------------



        // INTENSITY PROFILE (PATH)
        // ------------------------------------------------
        intensity_g.append("path").attr("id", "intensity_profile_line");
        // ------------------------------------------------



        // Add MOUSEOVER MARKER
        // ---------------------------
        this.initMarker(intensity_g);
        // ---------------------------


        // Add LEGEND
        // ---------------
        this.initLegend();
        // ---------------
    },
    updateProfiles: function() {

        // Update Axes
        // ----------------
        this.updateAxes();
        // ----------------


        // Get current intensity data
        // -------------------------------------------
        var intensity_data = this.model.intensity_data;
        // -------------------------------------------



        // Update intensity line
        // ----------------------------------------------------------------
        if (this.model.is_active()) {
            this.updateLine(intensity_data);
        }
        // ----------------------------------------------------------------


        // Update Current Frame Marker Intensity
        // ----------------------------------------------------------------
        if (this.model.valid_playback()) {
            this.updateMarker(intensity_data);
        }
        // ----------------------------------------------------------------
    },
    updateLine: function(intensity_data) {

        // Set scales
        // ------------------------------
        var xScale = this.model.scales.x;
        var yScale = this.model.scales.y;
        // ------------------------------

        var intensity_line = d3.line()
            .x(function(d, i) { return xScale(i); })
            .y(function(d) { return yScale(d); });

        d3.select("#intensity_profile_line").datum(intensity_data).transition()
            .attr("d", intensity_line);
    },
    initMarker: function(intensity_g) {
        intensity_g.append("circle")
            .attr("id", "intensity_mouseover_profile_mark")
            .attr("r", this.mark_radius);
    },
    updateMarker: function(intensity_data) {

        // Set scales
        // -----------------------------
        var xScale = this.model.scales.x;
        var yScale = this.model.scales.y;
        // -----------------------------

        var intensity_marker = this.model.intensity_marker;
        var marker_frame = this.model.marker_frame;

        d3.select("#intensity_mouseover_profile_mark").transition()
            .attr("cx", function() {
                return xScale(marker_frame);
            })
            .attr("cy", function(d) {
                return yScale(intensity_marker);
            });
    }
};











// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                           AXES PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var AxesPrototype = {
    addAxes: function() {

        d3.select("#intensity_axes_container_g").remove();
        var this_view = this;

        var axis_group = this.plot_g.append("g").attr("id", "velocity_axes_container_g");

        // X AXIS
        // ================================================================================

        // AXIS
        // ---------------------------------------------------------------
        var intensity_x_axis_g = axis_group.append("g")
            .attr("id", "intensity_plot_x_axis_g")
            .attr("transform", "translate("+0+","+this_view.dimensions.plot_group.height+")");

        intensity_x_axis_g.append("g")
            .attr("id", "intensity_plot_x_axis")
            .call(d3.axisBottom(this.model.scales.x).ticks(10));
        // ---------------------------------------------------------------

        // TEXT
        // ---------------------------------------------------------------
        intensity_x_axis_g.append("text")
            .attr("x", function() {
                return this_view.dimensions.plot_group.width * 0.45;
            })
            .attr("y", 40)
            .style("fill", "black")
            .text("Frame");
        // ---------------------------------------------------------------

        // // Adjust size of text on axes
        // // ------------------------------------------------------------
        // d3.select("#intensity_plot_x_axis").selectAll("text")
        //     .style("font-size","24px"); //To change the font size of texts
        // d3.select("#intensity_plot__axis").selectAll("text")
        //     .style("font-size","24px"); //To change the font size of texts
        // // ------------------------------------------------------------

        // MOUSEOVER Tracking Line
        // ---------------------------------------------------------------
        intensity_x_axis_g.append("line")
            .attr("id", "intensity_plot_mouseover_x_axis_mark")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", -10)
            .attr("y2", 10)
            .style("stroke", this_view.colors.mouseover)
            .style("stroke-opacity", 0.25)
            .style("stroke-width", "4px")
            .style("opacity", "0.0");
        // ---------------------------------------------------------------
        // ================================================================================



        // Y AXIS
        // ================================================================================
        // AXIS
        // ---------------------------------------------------------------
        var intensity_y_axis_g = axis_group.append("g")
            .attr("id", "intensity_plot_y_axis_g")
            .attr("transform", "translate("+0+","+0+")");

        intensity_y_axis_g.append("g")
            .attr("id", "intensity_plot_y_axis")
            .call(d3.axisLeft(this.model.scales.y));
        // ---------------------------------------------------------------


        // TEXT
        // ---------------------------------------------------------------
        intensity_y_axis_g.append("text")
            .attr("transform", function() {
                var trans_x = -40;
                var trans_y = this_view.dimensions.plot_group.height * 0.6;
                var translation = "translate("+trans_x+", "+trans_y+")";
                var rotation = "rotate(-90)";
                return translation+rotation;
            })
            .style("fill", "black")
            .text("Intensity");
        // ---------------------------------------------------------------
        // ================================================================================
    },
    updateAxes: function() {

        // Get scales
        // ------------------------------------------------
        var xScale = this.model.scales.x;
        var yScale = this.model.scales.y;
        // ------------------------------------------------

        // Transition to new axes
        // ------------------------------------------------
        d3.select("#intensity_plot_x_axis").transition()
            .call(d3.axisBottom(xScale).ticks(10));

        d3.select("#intensity_plot_y_axis").transition()
            .call(d3.axisLeft(yScale));
        // ------------------------------------------------
    }
};

















// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                           LEGEND PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var LegendPrototype = {
    initLegendParams: function() {
        this.legend = {
            g               : null,
            width           : 200,
            height          : 80,
            ICON_HEIGHT     : 30,
            ICON_WIDTH      : 30,
            line_length     : 12,
            cx              : 0.2,
            vx_cy           : 0.3,
            icon_x_offset   : 120,
            icon_y_offset   : 15
        };
    },
    initLegend: function() {
        var this_view = this;

        var intensity_legend = this_view.plot_g.append("g")
            .attr("id", "intensity_legend")
            .attr("transform", "translate("+(this_view.dimensions.plot_group.width-this_view.legend.width*0.7)+", 0)");

        intensity_legend.append("rect")
            .attr("height", this_view.legend.height)
            .attr("width", this_view.legend.width)
            .style("fill", "transparent");


        // Add current frame marker intensity PROFILE
        this.legend.g = intensity_legend.append("g").attr("id", "intensity_legend_g")
            .attr("transform", function() {
                var new_x = this_view.legend.width * this_view.legend.cx;
                var new_y = this_view.legend.height * this_view.legend.vx_cy;
                return "translate("+new_x+","+new_y+")"
            });

        this.legend.g.append("line")
            .attr("id", "intensity_legend_mark_line")
            .attr("x1", -1*this_view.legend.line_length)
            .attr("x2", this_view.legend.line_length)
            .attr("y1", 0)
            .attr("y2", 0)
            .style("stroke", this_view.colors.intensity)
            .style("stroke-width", "3px");

        this.legend.g.append("circle")
            .attr("id", "intensity_legend_mark")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", this_view.mark_radius)
            .style("fill", this_view.colors.intensity)
            .style("stroke", "black");

        // Add vx legend text
        this.legend.g.append("text")
            .attr("id", "intensity_legend_text")
            .attr("x", 30)
            .attr("y", 4)
            .style("fill", "black")
            .style("stroke", "black")
            .text("intensity");


        // Add vx legend checkbox
        intensity_legend.append("image")
            .attr("id", "icon_img")
            .attr("xlink:href", "/static/icons/show.ico")
            .attr("height", this_view.legend.ICON_HEIGHT)
            .attr("width", this_view.legend.ICON_WIDTH)
            .attr("x", this_view.legend.width * this_view.legend.cx + this_view.legend.icon_x_offset)
            .attr("y", this_view.legend.height * this_view.legend.vx_cy - this_view.legend.icon_y_offset)
            .on("mouseover", function() {
                if (!this_view.active_display) {
                    return;
                }
                d3.select(this).transition().attr("xlink:href", "/static/icons/hide.ico");
                d3.select("#intensity_g").transition().duration(500).style("opacity", 0.25);
            })
            .on("mouseout", function(d) {
                if (!this_view.active_display) {
                    return;
                }
                d3.select(this).transition().attr("xlink:href", "/static/icons/show.ico");
                d3.select("#intensity_g").transition().duration(500).style("opacity", 1.0);
            })
            .on("click", function(d) {
                this_view.active_display = !this_view.active_display;
                var icon_name = (this_view.active_display) ? "show" : "hide";
                var opacity_val = (this_view.active_display) ? 1.0 : 0.0;

                d3.select(this).transition().attr("xlink:href", "/static/icons/"+icon_name+".ico");
                d3.select("#intensity_g").transition().duration(1000).style("opacity", opacity_val)
            });
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------










// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                           LEGEND PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var ParamsPrototype = {
    initParams: function() {
        var main_height = 540;
        var main_width = 540;
        var group_height = 200;
        var group_width = 400;

        this.dimensions = {
            main: {
                height : main_height,
                width : main_width
            },
            plot_group : {
                height : group_height,
                width : group_width
            }
        };
        this.x_offset = (main_width - group_width) / 2;
        this.colors = {
            intensity : "#00ff00",
            mouseover : "#8000ff"
        };

        this.mark_radius = 5;
        this.active_display = true;
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------










// COMBINE PROTOTYPES
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------



// ParamsPrototype
for (var paramObject in ParamsPrototype) {
    IntensityProfileViewConstructor.prototype[paramObject] = ParamsPrototype[paramObject];
}


// Axes
for (var axesObject in AxesPrototype) {
    IntensityProfileViewConstructor.prototype[axesObject] = AxesPrototype[axesObject];
}


// Add legend objects to prototype
for (var legendObject in LegendPrototype) {
    IntensityProfileViewConstructor.prototype[legendObject] = LegendPrototype[legendObject];
}


// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

var VelocityProfileViewConstructor = function(model) {
    this.model = model;
    this.plot_g = null;
    this.x_offset = null;
    this.mark_radius = null;
    this.dimensions = {};
    this.active_display = {
        vx : true,
        vy : true
    };
    this.controller = null;
    this.INITIALIZED = false;

    this.initParams();
};


VelocityProfileViewConstructor.prototype = {
    init: function(parent_svg, controller) {
        this.parent_svg = parent_svg;
        this.controller = controller;

        this.INITIALIZED = false;
    },
    initNewTrack: function(track_id) {

        this.INITIALIZED = true;


        // Initialize controller
        var controller = this.controller;

        // Initialize container and view/model variables
        // ----------------------------------
        var this_view = this;
        var this_model = this.model;
        // ----------------------------------


        // Create plot group for velocity
        // ------------------------------------------------------------
        this.plot_g = this.parent_svg.append("g")
            .attr("id", "velocity_plot_g")
            .attr("transform", function() {
                var new_y = this_view.dimensions.plot_group.height*0.2;
                return "translate("+this_view.x_offset+","+new_y+")";
            });
        // ------------------------------------------------------------


        // Add BACKGROUND
        // ------------------------------------------------------------
        this.plot_g.append("rect")
            .attr("id", "velocity_plot_g_background");
        // ------------------------------------------------------------


        // Add Axes
        // ---------------
        this.addAxes();
        // ---------------


        // Interaction group
        // -------------------------------------------------------------
        var interaction_g = this.plot_g.append("g")
            .attr("id", "velocity_plot_interaction_layer")
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


        // VELOCITY groups
        // -------------------------------------------------------------
        var vx_g = interaction_g.append("g").attr("id", "vx_g");
        var vy_g = interaction_g.append("g").attr("id", "vy_g");
        // -------------------------------------------------------------


        // Add MOUSE INTERACTION LAYER
        // ----------------------------------------------------
        interaction_g.append("rect").attr("id", "velocity_interaction_g");
        // ----------------------------------------------------


        // PROFILE PATHS (lines)
        // ================================================
        this.initLines(vx_g, vy_g);
        // ================================================


        // INIT MARKERS
        // ================================================
        this.initMarkers(vx_g, vy_g);
        // ================================================


        // Add LEGEND
        // ---------------
        this.initLegend();
        // ---------------
    },
    updateProfiles: function() {


        // Get current velocity data
        // ---------------------------------
        var velocity_x_data = this.model.vx;
        var velocity_y_data = this.model.vy;
        // ---------------------------------


        // Update Profile Lines
        // =========================================================
        if (this.model.is_active()) {

            // Update Axes
            // ---------------
            this.updateAxes();
            // ---------------

            this.updateLines(velocity_x_data, velocity_y_data);
        }
        // =========================================================


        // Update MARKERS
        // =========================================================
        if (this.model.valid_playback()) {
            this.updateMarkers(velocity_x_data, velocity_y_data);
        }
        // =========================================================

    },
    initLines: function(vx_g, vy_g) {
        // VX
        // -----------------------------------
        vx_g.append("path").attr("id", "vx_profile_line");
        // -----------------------------------

        // VY
        // -----------------------------------
        vy_g.append("path").attr("id", "vy_profile_line");
        // -----------------------------------
    },
    updateLines: function(velocity_x_data, velocity_y_data) {
        // Set scales
        // ------------------------------
        var xScale = this.model.scales.x;
        var yScale = this.model.scales.y;
        // ------------------------------


        // vx profile line
        // ----------------------------------------------------
        var new_vx_line = d3.line()
            .x(function(d, i) { return xScale(i); })
            .y(function(d) {
                return yScale(d);
            });

        d3.select("#vx_profile_line").datum(velocity_x_data).transition()
            .attr("d", new_vx_line);
        // ----------------------------------------------------


        // vy profile line
        // ----------------------------------------------------
        var new_vy_line = d3.line()
            .x(function(d, i) { return xScale(i); })
            .y(function(d, i) { return yScale(d); });

        d3.select("#vy_profile_line").datum(velocity_y_data).transition()
            .attr("d", new_vy_line);
        // ----------------------------------------------------

    },
    initMarkers: function(vx_g, vy_g) {
        // VX
        // -----------------------------------
        vx_g.append("circle")
            .attr("id", "vx_mouseover_profile_mark")
            .attr("r", this.mark_radius);
        // -----------------------------------


        // VY
        // -----------------------------------
        vy_g.append("circle")
            .attr("id", "vy_mouseover_profile_mark")
            .attr("r", this.mark_radius);
        // -----------------------------------
    },
    updateMarkers: function(velocity_x_data, velocity_y_data) {

        // Set scales
        // -----------------------------
        var xScale = this.model.scales.x;
        var yScale = this.model.scales.y;
        // -----------------------------


        // Update Current Frame Marker VX
        // ----------------------------------------------------
        var vx_marker = this.model.marker_vx;
        var vy_marker = this.model.marker_vy;
        var marker_frame = this.model.marker_frame;

        d3.select("#vx_mouseover_profile_mark").transition()
            .attr("cx", function() {
                return xScale(marker_frame);
            })
            .attr("cy", function() {
                return yScale(vx_marker);
            });
        // ----------------------------------------------------

        // Update Current Frame Marker VY
        // ----------------------------------------------------
        d3.select("#vy_mouseover_profile_mark").transition()
            .attr("cx", function() {
                return xScale(marker_frame);
            })
            .attr("cy", function() {
                return yScale(vy_marker);
            });
        // ----------------------------------------------------
    }
};









// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                           AXES PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var AxesPrototype = {
    addAxes: function() {

        d3.select("#velocity_axes_container_g").remove();
        var this_view = this;

        var axis_group = this.plot_g.append("g").attr("id", "velocity_axes_container_g");

        // X AXIS
        // =============================================================================
        // axis
        // -----------------------------------------------
        var velocity_x_axis_g = axis_group.append("g")
            .attr("id", "velocity_plot_x_axis_g")
            .attr("transform", "translate("+0+","+this.dimensions.plot_group.height+")");

        velocity_x_axis_g.append("g")
            .attr("id", "velocity_plot_x_axis")
            .call(d3.axisBottom(this.model.scales.x).ticks(10));
        // -----------------------------------------------


        // text
        // -----------------------------------------------
        velocity_x_axis_g.append("text")
            .attr("class", "axis_text")
            .attr("x", function() {
                return this_view.dimensions.plot_group.width * 0.45;
            })
            .attr("y", 40)
            .text("Frame");
        // -----------------------------------------------

        // mouseover tracking line
        // -----------------------------------------------
        velocity_x_axis_g.append("line")
            .attr("id", "velocity_plot_mouseover_x_axis_mark")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", -10)
            .attr("y2", 10);
        // -----------------------------------------------
        // =============================================================================





        // Y AXIS
        // =============================================================================
        // axis
        // ---------------------------------------------------
        var velocity_y_axis_g = axis_group.append("g")
            .attr("id", "velocity_plot_y_axis_g")
            .attr("transform", "translate("+0+","+0+")");

        velocity_y_axis_g.append("g")
            .attr("id", "velocity_plot_y_axis")
            .call(d3.axisLeft(this.model.scales.y));
        // ---------------------------------------------------



        // text
        // ---------------------------------------------------------------
        velocity_y_axis_g.append("text")
            .attr("class", "axis_text")
            .attr("transform", function() {
                var trans_x = -40;
                var trans_y = this_view.dimensions.plot_group.height * 0.7;
                var translation = "translate("+trans_x+", "+trans_y+")";
                var rotation = "rotate(-90)";
                return translation+rotation;
            })
            .text("Velocity (km/hr)");
        // ---------------------------------------------------------------
        // =============================================================================
    },
    updateAxes: function() {

        // Get scales
        // ------------------------------------------------
        var xScale = this.model.scales.x;
        var yScale = this.model.scales.y;
        // ------------------------------------------------

        // Transition to new axes
        // ------------------------------------------------
        d3.select("#velocity_plot_x_axis").transition()
            .call(d3.axisBottom(xScale).ticks(10));

        d3.select("#velocity_plot_y_axis").transition()
            .call(d3.axisLeft(yScale));
        // ------------------------------------------------
    }

};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------










// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                           LEGEND PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var LegendPrototype = {
    legend : {
        g : null,
        width: 200,
        height: 80,
        ICON_HEIGHT: 30,
        ICON_WIDTH: 30,
        line_length: 12,
        cx: 0.2,
        vx_cy: 0.3,
        icon_x_offset: 120,
        icon_y_offset: -15
    },
    initLegend: function() {

        // Add Velocity Legend Group
        this.legend.g = this.plot_g.append("g")
            .attr("id", "velocity_legend")
            .attr("transform", "translate("+(this.dimensions.plot_group.width-this.legend.width*0.7)+", 0)");

        this.legend.g.append("rect").attr("id", "velocity_legend_rect");


        // Legend Group VX
        this.addLegendGroup("vx");
        this.addLegendGroup("vy", 30);

    },
    addLegendGroup: function(velocity_key, vy_offset=0) {
        var this_view = this;

        var legend_g = this.legend.g.append("g").attr("id", velocity_key+"_legend_g")
            .attr("transform", function() {
                var new_x = this_view.legend.width * this_view.legend.cx;
                var new_y = this_view.legend.height * this_view.legend.vx_cy + vy_offset;
                return "translate("+new_x+","+new_y+")"
            });

        // Add line
        legend_g.append("line")
            .attr("id", velocity_key+"_legend_mark_line")
            .attr("x1", -1*this.legend.line_length)
            .attr("x2", this.legend.line_length)
            .attr("y1", 0)
            .attr("y2", 0);

        // Add circle
        legend_g.append("circle")
            .attr("id", velocity_key+"_legend_mark")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", this.mark_radius);

        // Add vx legend text
        legend_g.append("text")
            .attr("id", velocity_key+"_legend_text")
            .attr("class", "velocity_legend_text")
            .attr("x", 30)
            .attr("y", 4)
            .text(function() {
                return (velocity_key === "vx") ? "lon-velocity" : "lat-velocity";
            });

        this.addLegendCheckbox(legend_g, velocity_key);
    },
    addLegendCheckbox: function(legend_g, velocity_key) {

        var this_view = this;

        // Add vx legend checkbox
        legend_g.append("image")
            .attr("id", "icon_img")
            .attr("xlink:href", "/static/icons/show.ico")
            .attr("height", this.legend.ICON_HEIGHT)
            .attr("width", this.legend.ICON_WIDTH)
            .attr("x", this.legend.icon_x_offset)
            .attr("y", this.legend.icon_y_offset)
            .on("mouseover", function() {
                if (!this_view.active_display[velocity_key]) {
                    return;
                }
                d3.select(this).transition().attr("xlink:href", "/static/icons/hide.ico");
                d3.select("#"+velocity_key+"_g").transition().duration(500).style("opacity", 0.25);
            })
            .on("mouseout", function(d) {
                if (!this_view.active_display[velocity_key]) {
                    return;
                }
                d3.select(this).transition().attr("xlink:href", "/static/icons/show.ico");
                d3.select("#"+velocity_key+"_g").transition().duration(500).style("opacity", 1.0);
            })
            .on("click", function(d) {
                this_view.active_display[velocity_key] = !this_view.active_display[velocity_key];
                var icon_name = (this_view.active_display[velocity_key]) ? "show" : "hide";
                var opacity_val = (this_view.active_display[velocity_key]) ? 1.0 : 0.0;

                d3.select(this).transition().attr("xlink:href", "/static/icons/"+icon_name+".ico");
                d3.select("#"+velocity_key+"_g").transition().duration(1000).style("opacity", opacity_val)
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
            plot_group : {
                height  : group_height,
                width   : group_width
            }
        };

        this.x_offset = (main_width - group_width) / 2;

        this.mark_radius = 5;

        this.active_display = {
            vx : true,
            vy : true
        };
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------





// COMBINE PROTOTYPES
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

// ParamsPrototype
for (var paramObject in ParamsPrototype) {
    VelocityProfileViewConstructor.prototype[paramObject] = ParamsPrototype[paramObject];
}

// Axes
for (var axesObject in AxesPrototype) {
    VelocityProfileViewConstructor.prototype[axesObject] = AxesPrototype[axesObject];
}

// Add legend objects to prototype
for (var legendObject in LegendPrototype) {
    VelocityProfileViewConstructor.prototype[legendObject] = LegendPrototype[legendObject];
}


// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

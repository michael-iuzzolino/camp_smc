var UncertaintyVisViewConstructor = function(model) {
    this.model = model;

    this.init_zoom = 1.8;
    this.MAP_OPACITY = 0.85;

    this.initDivs();
    this.initEllipseContainers();
};


UncertaintyVisViewConstructor.prototype = {
    initDivs: function() {

        d3.select("#main_uncertainty_container").remove();

        var main_uncertainty_container = d3.select("body").append("div").attr("id", "main_uncertainty_container");
        main_uncertainty_container.append("div").attr("id", "uncertainty_vis_map_div");
    },
    initMap: function() {

        // MAP SETTINGS
        // ===============================================================

        this.map_layers = {
            OSM: null
        };

        this.settings = {
            zoom    : {
                init    : 1.8,
                max     : 4,
                min     : 1
            },
            initLat : 32,
            initLon : 128
        };

        // Interactions
        this.all_interactions_disabled = ol.interaction.defaults({
            doubleClickZoom     :   false,
            dragAndDrop         :   false,
            keyboardPan         :   false,
            keyboardZoom        :   false,
            mouseWheelZoom      :   false,
            pointer             :   false,
            select              :   false
        });
        // ===============================================================



        // Initialize map LAYERS
        // --------------------------------------------------------------
        // OSM
        // ------------------------
        this.map_layers.OSM = new ol.layer.Tile({
            source: new ol.source.OSM()
        });

        // SET OPACITY
        // -----------
        this.map_layers.OSM.setOpacity(this.MAP_OPACITY);
        // --------------------------------------------------------------



        // Create new map
        // --------------------------------------------------------------

        this.map = new ol.Map({
            target: "uncertainty_vis_map_div",
            view: new ol.View({
                center: ol.proj.transform([this.settings.initLon, this.settings.initLat], 'EPSG:4326', 'EPSG:3857'),
                zoom: this.init_zoom
            }),
            layers: [
                this.map_layers.OSM
            ],
            interactions: ol.interaction.defaults({
                keyboard            :   false,
                altShiftDragRotate  :   false,
                doubleClickZoom     :   false,
                dragAndDrop         :   false,
                mouseWheelZoom      :   false,
                dragPan             :   false
            })
        });
        // --------------------------------------------------------------
    },
    initTargetOnMap: function() {

        // Add initial layers to map
        // ------------------------------------------------
        this.map.addLayer(this.model.centroid_layer);
        this.map.addLayer(this.model.kalman_track_layer);
        // ------------------------------------------------

        var coordinates = this.model.centroid_coordinates;

        // Create new view
        // ------------------------------------------------
        var new_view = new ol.View({
            center: coordinates,
            projection: 'EPSG:3857',
            zoom: this.model.map_zoom
        });
        // ------------------------------------------------


        // Set new view
        // ------------------------------------------------
        this.map.setView(new_view);
        // ------------------------------------------------
    },
    updateTargetOnMap: function() {

        var coordinates = this.model.centroid_coordinates;

        // ** OLD WAY - NO ANIMATION
        // ************************************************
        // ************************************************
        // var previous_zoom = this.map.getView().getZoom();
        // Create new view
        // ----------------------------------------
        // var new_view = new ol.View({
        //     center: coordinates,
        //     projection: 'EPSG:3857',
        //     zoom: previous_zoom
        // });
        // ----------------------------------------

        // Set view
        // ----------------------------------------
        // this.map.setView(new_view);
        // ----------------------------------------
        // ************************************************
        // ************************************************

        // ANIMATE VIEW CHANGE
        // ----------------------------------------
        var previous_view = this.map.getView();

        var new_center = {center: coordinates};
        previous_view.animate(new_center);
        // ----------------------------------------
    },
    clearLayers: function() {
        // Remove centroid and track layers
        // -------------------------------------------------
        this.map.removeLayer(this.model.centroid_layer);
        this.map.removeLayer(this.model.kalman_track_layer);
        // -------------------------------------------------
    },
    clearVisualizations: function() {

        this.clearLayers();

        // Clear SVG uncertainty ellipses, vectors, and labels
        // ----------------------------------------------
        d3.select("#uncertainty_ellipses_div").remove();
        d3.select("#velocity_vector_line").remove();
        d3.selectAll(".uncertainty_label").remove();
        // ----------------------------------------------

    }
};









// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//              ELLIPSE PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var EllipsePrototype = {
    initEllipseContainers: function() {

        // Initialize parameters
        // ============================================================
        this.divs = {
            main            :   null,
            confidence_text :   null
        };
        // ============================================================

        // Remove Previous divs
        d3.select("#uncertainty_ellipses_div").remove();

        var main_uncertainty_container = d3.select("#main_uncertainty_container");

        this.divs.main = main_uncertainty_container.append("div")
            .attr("id", "uncertainty_ellipses_div")
            .attr("height", this.model.ellipse_parameters.div_height)
            .attr("width", this.model.ellipse_parameters.div_width);

        // SVG container
        this.svg = this.divs.main.append("svg")
            .attr("id", "uncertainty_vis_svg")
            .attr("height", this.model.ellipse_parameters.svg_height)
            .attr("width", this.model.ellipse_parameters.svg_width);

    },
    initEllipses: function() {
        // Initialize parameters
        // ============================================================
        this.ellipse_id_plot_order = [
            "99.9%",
            "99.5%",
            "99%",
            "95%",
            "80%",
            "65%"
        ];

        this.ellipse_settings = {
            opacity         : 0.5,
            stroke_width    : 2
        };
        // ============================================================


        // Get scales
        // --------------------------------------
        var lonScale = this.model.scales.ellipses.lon;
        var latScale = this.model.scales.ellipses.lat;
        var colorScale = this.model.scales.ellipses.color;
        // --------------------------------------

        // Get Data
        // --------------------------------------
        var init_lon = this.model.lon;
        var init_lat = this.model.lat;
        var ellipses = this.model.ellipse_data;
        // --------------------------------------


        // INITIALIZE Visualizations
        // ----------------------------------------------------------------
        this.initEllipsesVisualization();
        try {
            this.initVelocityVector(lonScale, latScale, init_lat, init_lon);
        }
        catch (e) {
            console.log(e);
        }
        this.initLabels(lonScale, latScale, init_lat, init_lon);
        // ----------------------------------------------------------------
    },
    updateEllipses: function() {
        // Get scales
        // ---------------------------------------
        var lonScale = this.model.scales.ellipses.lon;
        var latScale = this.model.scales.ellipses.lat;
        // ---------------------------------------

        // Get Data
        // ---------------------------------------
        var lon = this.model.lon;
        var lat = this.model.lat;

        // ---------------------------------------



        // UPDATE Visualizations (centroids, ellipses, and velocity vector)
        // -----------------------------------------------------
        // this.initEllipsesVisualization();
        this.updateEllipsesVisualization(lonScale, latScale);
        this.updateVelocityVector(lonScale, latScale, lat, lon);
        this.updateLabels(lat, lon);
        // -----------------------------------------------------
    },



    initEllipsesVisualization: function() {
        var percent_key, data_x, data_y, value;
        var ellipse_data, ellipse_id;

        d3.select("#ellipse_vis_svg_g").remove();

        // Get Data
        // ---------
        var ellipses = this.model.ellipse_data;

        // Get scales
        // --------------------------------------
        var lonScale = this.model.scales.ellipses.lon;
        var latScale = this.model.scales.ellipses.lat;
        var colorScale = this.model.scales.ellipses.color;
        // --------------------------------------


        // Initialize line constructor for ellipses
        var ellipse_constructor = d3.line()
            .x(function(d) { return lonScale(d.x); })
            .y(function(d) { return latScale(d.y); });


        // Create group for all visualizations
        this.ellipse_vis_svg_g = this.svg.append("g")
            .attr("id", "ellipse_vis_svg_g")
            .attr("transform", "translate(275, 75)");

        // Create svg group for ellipses
        var ellipse_svg_g = this.ellipse_vis_svg_g.append("g")
            .attr("id", "ellipse_svg_g");

        // Plot all ellipses
        for (var key_id=0; key_id < this.ellipse_id_plot_order.length; key_id++) {



            // Setup percent key
            // -----------------------------------------------
            percent_key = this.ellipse_id_plot_order[key_id];
            // -----------------------------------------------

            // Setup class id
            // -----------------------------------------------
            ellipse_id = this.model.class_id_key[percent_key];
            // -----------------------------------------------

            // Initialize data_x and data y
            // -------------------------------------------
            data_x = ellipses[0][percent_key].ellipse_data.X;
            data_y = ellipses[0][percent_key].ellipse_data.Y;
            // -------------------------------------------


            // // TODO: DEBUGGER
            // // ***************
            // if (key_id === 2) {
            //     $.ajax({
            //         url: "/log_uncertainty",
            //         method: 'POST',
            //         contentType: 'application/json',
            //         dataType: 'json',
            //         data: JSON.stringify({"track_data": {x: data_x, y: data_y}, 'frame' : this.model.current_playback_frame}),
            //         success: function (result) {
            //             console.log("SUCCESS");
            //         }
            //     });
            // }
            // // ***************


            // Setup Ellipse data for line
            // -----------------------------------------------------------
            ellipse_data = [];
            for (var i=0; i < data_x.length; i++) {
                ellipse_data.push({"x" : data_x[i], "y" : data_y[i]});
            }
            // -----------------------------------------------------------


            // Ellipses
            // ----------------------------------------------------------------------
            var this_model = this.model;
            ellipse_svg_g.append("path")
                .data([percent_key])
                .attr("id", ellipse_id+"_path")
                .attr("d", ellipse_constructor(ellipse_data))
                .attr("fill", function() {
                    value = parseFloat(percent_key.replace("%", ""));
                    return colorScale(value);
                })
                .style("fill-opacity", this.ellipse_settings.opacity)
                .on("mouseover", function(d) {
                    // Class the ellipse ring
                    // -------------------------------------------------
                    d3.select(this).classed("ellipse_highlight", true);
                    // -------------------------------------------------

                    // Class the corresponding color key box
                    // ------------------------------------------------------------------------------------

                    var ellipse_id = this_model.class_id_key[d];
                    d3.select("#"+"ellipse_color_key_"+ellipse_id)
                        .style("stroke", "red")
                        .style("stroke-width", "4px");
                    // ------------------------------------------------------------------------------------
                })
                .on("mouseout", function(d) {
                    // Class the ellipse ring
                    // -------------------------------------------------
                    d3.select(this).classed("ellipse_highlight", false);
                    // -------------------------------------------------

                    // Class the corresponding color key box
                    // ------------------------------------------------------------------------------------
                    var ellipse_id = this_model.class_id_key[d];
                    d3.select("#"+"ellipse_color_key_"+ellipse_id)
                        .style("stroke", "black")
                        .style("stroke-width", "1px");
                    // ------------------------------------------------------------------------------------

                });
            // ----------------------------------------------------------------------
        }
    },
    updateEllipsesVisualization: function(lonScale, latScale) {
        var percent_key, data_x, data_y;
        var ellipse_data, ellipse_id;

        var ellipses = this.model.ellipse_data;

        var ellipse_constructor = d3.line()
            .x(function(d) {
                return lonScale(d.x);
            })
            .y(function(d) {
                return latScale(d.y);
            });


        // Plot Ellipses
        for (var key_id=0; key_id < this.ellipse_id_plot_order.length; key_id++) {

            percent_key = this.ellipse_id_plot_order[key_id];
            data_x = ellipses[this.model.current_playback_frame][percent_key].ellipse_data.X;
            data_y = ellipses[this.model.current_playback_frame][percent_key].ellipse_data.Y;

            // // TODO: DEBUGGER
            // // ***************
            // if (key_id === 2) {
            //     $.ajax({
            //         url: "/log_uncertainty",
            //         method: 'POST',
            //         contentType: 'application/json',
            //         dataType: 'json',
            //         data: JSON.stringify({"track_data": {x: data_x, y: data_y}, 'frame' : this.model.current_playback_frame}),
            //         success: function (result) {
            //             console.log("SUCCESS");
            //         }
            //     });
            // }
            // // ***************


            // Setup Ellipse data for line
            ellipse_data = [];
            for (var i=0; i < data_x.length; i++) {
                ellipse_data.push({x : data_x[i], y : data_y[i]});
            }


            // Setup class id
            ellipse_id = this.model.class_id_key[percent_key];


            // Ellipses
            d3.select("#"+ellipse_id+"_path").transition().attr("d", ellipse_constructor(ellipse_data));
        }
    }

};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------





// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//              ELLIPSE LABELS PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var LabelsPrototype = {
    initLabels: function(lonScale, latScale, init_lat, init_lon) {

        var this_view = this;
        var this_model = this.model;


        var label_g = this.ellipse_vis_svg_g.append("g")
            .attr("id", "uncertainty_label_g")
            .attr("transform", "translate(-75, -75)");


        // Create g for centroid coordinate text
        var uncertainty_centroid_tooltip_g =  label_g.append("g").attr("id", "uncertainty_centroid_tooltip_g");


        // CENTROID
        // ==================================================

        // Centroid dot
        // ----------------------------------------
        label_g.append("circle")
            .attr("id", "ellipse_centroid_dot")
            .attr("class", "uncertainty_label")
            .attr("cx", lonScale(init_lon) + 75)
            .attr("cy", latScale(init_lat) + 75)
            .attr("r", 5)
            .style("fill", "black");
        // ----------------------------------------



        // Centroid Label Line
        // ----------------------------------------
        var x1 = lonScale(init_lon) + 75;
        var y1 = latScale(init_lat) + 75;

        var x2 = x1 - 120;
        var y2 = y1 + 205;


        label_g.append("line")
            .attr("id", "ellipse_centroid_line")
            .attr("class", "uncertainty_label")
            .attr("x1", x1)
            .attr("x2", x2)
            .attr("y1", y1)
            .attr("y2", y2)
            .style("stroke", "black")
            .style("stroke-opacity", 1.0)
            .style("stroke-width", "2px");
        // ----------------------------------------


        // Initialize CENTROID tooltip text group position
        // --------------------------------------------------
        uncertainty_centroid_tooltip_g.append("text")
            .attr("id", "uncertainty_centroid_tooltip_text")
            .attr("x", x2-20)
            .attr("y", y2+55);
        // --------------------------------------------------


        // Centroid Label Text
        // ----------------------------------------
        var text_dims = HELPER_getSVGTextDimensions("Centroid");
        var text_width = text_dims.width;
        var text_height = text_dims.height;
        var label_text = label_g.append("text")
            .attr("id", "uncertainty_centroid_label")
            .attr("x", x2 - (text_width / 2.0))
            .attr("y", y2 + text_height*1.1)
            .text("Centroid")
            .style("stroke", "black")
            .style("stroke-opacity", 1.0);


        label_text
            .on("mouseover", function() {
                d3.select("#uncertainty_centroid_tooltip_text")
                    .text(function() {
                        var lat_sym = (init_lon <= 0) ? "W" : "E";
                        var lon_sym = (init_lat >= 0) ? "N" : "S";
                        var lon_abs = Math.abs(init_lon);
                        var lat_abs = Math.abs(init_lat);
                        return lon_abs + " " + lon_sym + ", " + lat_abs + " " + lat_sym;
                    })
                    .transition()
                    .style("opacity", 1.0);
            })
            .on("mouseout", function(){
                d3.select("#uncertainty_centroid_tooltip_text").transition()
                    .style("opacity", 0.0);
            });
        // ----------------------------------------
        // ==================================================


        // Uncertainty Scale
        // ===================================================================================
        var color_key_g = this.svg.append("g")
            .attr("id", "uncertainty_color_key_g")
            .attr("transform", "translate(70, 208)");



        // Title
        color_key_g.append("text")
            .attr("id", "uncertainty_key")
            .attr("x", 2)
            .attr("y", 10)
            .text("Uncertainty Key");

        var key_g = color_key_g.selectAll("g.uncertainty_color_key")
            .data(this.model.color_range_key).enter()
            .append("g")
            .attr("class", "uncertainty_label")
            .attr("class", "uncertainty_color_key")
            .attr("transform", function(d, i) {
                var new_y = 20 + i * 30;
                return "translate(0, "+new_y+")";
            });

        // On event behavior
        key_g
            .on("mouseover", function(hex_key, i) {
                // Class this color key box
                // -------------------------------------------------
                d3.select(this).select("rect")
                    .style("stroke", "red")
                    .style("stroke-width", "4px");
                // -------------------------------------------------

                // Class the ellipse ring
                // ------------------------------------------------------------------------------------
                var percent_key = this_model.color_domain_key[i] + "%";
                var ellipse_id = "#" + this_model.class_id_key[percent_key] + "_path";

                d3.select(ellipse_id).classed("ellipse_highlight", true);
                // ------------------------------------------------------------------------------------
            })
            .on("mouseout", function(hex_key, i) {
                // Class this color key box
                // -------------------------------------------------
                d3.select(this).select("rect")
                    .style("stroke", "black")
                    .style("stroke-width", "1px");
                // -------------------------------------------------

                // Class the ellipse ring
                // ------------------------------------------------------------------------------------
                var percent_key = this_model.color_domain_key[i] + "%";
                var ellipse_id = "#" + this_model.class_id_key[percent_key] + "_path";
                d3.select(ellipse_id).classed("ellipse_highlight", false);
                // ------------------------------------------------------------------------------------
            });


        // TEXT
        key_g.append("text")
            .attr("x", 20)
            .attr("y", 15)
            .style("fill", "black")
            .style("stroke", "black")
            .text(function(d, i) {
                return this_view.model.color_domain_key[i] + "%";
            });

        // COLOR BOXES
        key_g.append("rect")
            .attr("id", function(d, i) {
                var key = this_view.model.color_domain_key[i] + "%";
                var ellipse_id = this_model.class_id_key[key];
                return "ellipse_color_key_" + ellipse_id;
            })
            .attr("x", 80)
            .attr("height", 20)
            .attr("width", 20)
            .style("stroke", "black")
            .style("fill", function(d) {
                return d;
            });
        // ===================================================================================


        // Velocity vector key
        // ===================================================================================
        var velocity_key_g = label_g.append("g")
            .attr("id", "velocity_key_g")
            .attr("transform", "translate(230, 420)");

        velocity_key_g.append("line")
            .attr("class", "velocity_vec_style")
            .attr("x1", 0)
            .attr("x2", 40)
            .attr("y1", 0)
            .attr("y2", 0);

        velocity_key_g.append("text")
            .attr("id", "velocity_vector_key")
            .attr("x", 60)
            .attr("y", 5)
            .text("Velocity Vector");

        // ===================================================================================


    },
    clearLabels: function() {
        d3.selectAll(".uncertainty_label").remove();
    },
    updateLabels: function(lat, lon) {
        d3.select("#uncertainty_centroid_tooltip_text").transition()
            .text(function() {
                var lat_sym = (lon <= 0) ? "W" : "E";
                var lon_sym = (lat >= 0) ? "N" : "S";
                var lon_abs = Math.abs(lon);
                var lat_abs = Math.abs(lat);
                return lon_abs + " " + lon_sym + ", " + lat_abs + " " + lat_sym;
            });
    },
    getCurrentCentroidCoords: function() {
        // Get current centroid position
        // -----------------------------------------------------------------------------------------------
        var current_centroid_data = this.model.centroids;
        var lat = current_centroid_data.lat[0];
        var lon = current_centroid_data.lon[0];
        // -----------------------------------------------------------------------------------------------

        return {lon : lon, lat : lat};
    }


};

// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------








// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//              VELOCITY VECTOR PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var VelocityVectorPrototype  = {
    initVelocityVector: function(lonScale, latScale, init_lat, init_lon) {

        this.vector_scaling_factor = 0.1;

        d3.select("#velocity_vector_line").remove();

        var init_velocity_data = this.model.velocity_data;
        var init_vx = init_velocity_data.vx[this.model.current_playback_frame];
        var init_vy = init_velocity_data.vy[this.model.current_playback_frame];


        // Initialize eigen vector line constructor
        var velocity_vec_constructor = d3.line()
            .x(function(d) { return lonScale(d.x); })
            .y(function(d) { return latScale(d.y); });


        // Plot velocity vector
        // -------------------------------------------------------------------------------------------------------------
        var velocity_vec_data = [
            {
                x   : init_lon,
                y   : init_lat
            },
            {
                x   : init_lon + init_vy * this.vector_scaling_factor,
                y   : init_lat + init_vx * this.vector_scaling_factor
            }
        ];


        // Create svg group for vector
        var vector_svg_g = this.ellipse_vis_svg_g.append("g").attr("id", "vector_svg_g");

        vector_svg_g.append("path")
            .attr("id", "velocity_vector_line")
            .attr("class", "velocity_vec_style")
            .attr("d", velocity_vec_constructor(velocity_vec_data))
            .attr('marker-start', function(){
                return 'url(#velocity_vec_arrow)'
            })
            .attr('marker-end', function(){
                return 'url(#velocity_vec_arrow)'
            });
        // -------------------------------------------------------------------------------------------------------------


        // Arrow Head -- TODO: Not functioning
        // Ref: http://bl.ocks.org/dustinlarimer/5888271
        // ********************************************************
        vector_svg_g.append("svg:defs").append("svg:marker")
            .attr("id", "velocity_vec_arrow")
            .attr("refX", 25)
            .attr("refY", -25)
            .attr("markerWidth", 20)
            .attr("markerHeight", 20)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", velocity_vec_constructor(velocity_vec_data))
            .attr("fill", "black");
        // ********************************************************
    },
    updateVelocityVector: function(lonScale, latScale, init_lat, init_lon) {

        var velocity_data = this.model.velocity_data;
        var new_vx = velocity_data.vx[this.model.current_playback_frame];
        var new_vy = velocity_data.vy[this.model.current_playback_frame];


        // Initialize velocity vector line constructor
        var velocity_vec_constructor = d3.line()
            .x(function(d) { return lonScale(d.x); })
            .y(function(d) { return latScale(d.y); });


        // Plot velocity vector
        var velocity_vec_data = [
            {
                x   : init_lon,
                y   : init_lat
            },
            {
                x   : init_lon + new_vy * this.vector_scaling_factor,
                y   : init_lat + new_vx * this.vector_scaling_factor
            }
        ];

        // Update velocity vec
        d3.select("#velocity_vector_line").transition().attr("d", velocity_vec_constructor(velocity_vec_data));
        // d3.select("#velocity_vec_arrow").transition().attr("d", velocity_vec_constructor(velocity_vec_data));
        // ------------------------------------------------------
        // ------------------------------------------------------
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------












// // COMBINE PROTOTYPES
// // ----------------------------------------------------------------------------------------------------
// // ----------------------------------------------------------------------------------------------------

for (var velocityVectorObject in VelocityVectorPrototype) {
    UncertaintyVisViewConstructor.prototype[velocityVectorObject] = VelocityVectorPrototype[velocityVectorObject];
}

for (var ellipseObject in EllipsePrototype) {
    UncertaintyVisViewConstructor.prototype[ellipseObject] = EllipsePrototype[ellipseObject];
}


for (var labelsObject in LabelsPrototype) {
    UncertaintyVisViewConstructor.prototype[labelsObject] = LabelsPrototype[labelsObject];
}


// // ----------------------------------------------------------------------------------------------------
// // ----------------------------------------------------------------------------------------------------
//
//

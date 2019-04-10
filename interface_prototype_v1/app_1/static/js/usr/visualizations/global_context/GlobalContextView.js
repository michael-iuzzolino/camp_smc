
//   Animate Regions: http://openlayers.org/en/latest/examples/feature-animation.html
//
//
//
//


var GlobalContextViewConstructor = function(model) {

    this.model = model;


    // ** MAP **
    // --------------------
    this.map = null;
    this.GLOBAL_CONTEXT_OPACITY = 0.8;
    // --------------------

    // Region Features
    // ---------------
    this.regions = {};
    // ---------------

    // Map layers
    // --------------------
    this.map_layers = {
        OSM             : null,
        Drawing         : null,
        Regions         : {},
        Coordinates     : null,
        LocalContextBox : null
    };
    // --------------------

    // Map settings
    // --------------------
    this.settings = {
        zoom    : {
            init    : 2,
            max     : 4,
            min     : 1
        },
        initLat : 30,
        initLon : 0
    };
    // --------------------


    // Drawing options
    // --------------------
    this.drawing = {
        options         : ["None", "Point", "LineString", "Polygon", "Circle"],
        current_object  : null,
        objects         : [],
        vector          : null
    };
    // --------------------


    // --------------------
    this.initDivs();
    // --------------------

    this.initAnimationParameters();
};

GlobalContextViewConstructor.prototype = {
    init: function() {
        // Initialize Map
        this.initMap();
    },
    initDivs: function() {
        var main_div = d3.select("#main_div").append("div").attr("id", "global_context_main_div").style("opacity", 1.0);
        var container_div = main_div.append("div").attr("id", "global_context_main_container_div");
        container_div.append("div").attr("id", "global_context_map_div");
    },
    initMap: function() {

        // Initialize map LAYERS
        // --------------------------------------------------------------
        // OSM
        // ------------------------
        this.map_layers.OSM = new ol.layer.Tile({
            source: new ol.source.OSM({wrapX: false})
        });

        // SET OPACITY
        // -----------
        this.map_layers.OSM.setOpacity(this.GLOBAL_CONTEXT_OPACITY);


        // DRAWING
        // ------------------------
        this.drawing.vector = new ol.source.Vector({wrapX: false});
        this.map_layers.Drawing = new ol.layer.Vector({
            source: this.drawing.vector
        });
        // --------------------------------------------------------------


        // Create new map
        // --------------------------------------------------------------
        this.map = new ol.Map({
            target: "global_context_map_div",
            controls: this.initMouseoverMapControls(),
            view: new ol.View({
                center: ol.proj.transform([this.settings.initLon, this.settings.initLat], 'EPSG:4326', 'EPSG:3857'),
                zoom: this.settings.zoom.init,
                maxZoom: this.settings.zoom.max,
                minZoom: this.settings.zoom.min
            }),
            layers: [
                this.map_layers.OSM,
                this.map_layers.Drawing
            ]
        });
        // --------------------------------------------------------------
    },
    initMouseoverCoordinateDisplay: function() {

        var latScale = d3.scaleLinear()
            .domain([-1e6, 1e6])
            .range([]);

        // Create div for coords
        var buttons_container = d3.select("#global_context_main_div").append("div")
            .attr("id", "global_context_controls__mouseover_coords_container");

        buttons_container.append("div").attr("id", "global_coordinates_mouse_position");


        return new ol.control.MousePosition({
            // coordinateFormat    :   ol.coordinate.createStringXY(3),
            projection          :   'EPSG:4326',
            className           :    'custom-mouse-position',
            target              :   document.getElementById('global_coordinates_mouse_position'),
            coordinateFormat: function(coordinate) {
                var lon = coordinate[0];
                var lat = coordinate[1];
                var lon_direction = (lon >= 0) ? "&#176 E" : "&#176 W";
                var lat_direction = (lat >= 0) ? "&#176 N" : "&#176 S";
                lon = Math.abs(lon);

                var lon_string = '{x}' + lon_direction;
                var lat_string = '{y}' + lat_direction;
                var coord_string = lon_string + ", " + lat_string;
                coordinate[0] = lon;
                return ol.coordinate.format(coordinate, coord_string, 4);
            }
            // undefinedHTML       :   '&nbsp;'
        });
    },
    initMouseoverMapControls: function() {
        var mouse_pos_cntrls = this.initMouseoverCoordinateDisplay();
        return ol.control.defaults({
            attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
                collapsible: false
            })
        }).extend([mouse_pos_cntrls]);
    }
};







// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          HELPER PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var HelperPrototype = {
    createStyle: function(style_type) {

        // Styles
        // -----------------------------------------
        var default_style = {
            fill_color : [180, 0, 0, 0.3],
            stroke_color : [180, 0, 0, 1],
            stroke_width : 1,
            circle_radius : 14
        };

        var clicked_style = {
            fill_color      :   [0, 255, 0, 0.6],
            stroke_color    :   [0, 0, 0, 1],
            stroke_width    :   3,
            circle_radius   :   20
        };

        var mouseover_style = {
            fill_color      :   [255, 157, 23, 0.5],
            stroke_color    :   [0, 0, 0, 1],
            stroke_width    :   3,
            circle_radius   :   20
        };
        // -----------------------------------------

        var style_obj = (style_type === "default") ? default_style : (style_type === "mouseover") ? mouseover_style : clicked_style;

        var fill_color = style_obj.fill_color;
        var stroke_color = style_obj.stroke_color;
        var stroke_width = style_obj.stroke_width;
        var circle_radius = style_obj.circle_radius;

        var fill = new ol.style.Fill({
            color: fill_color
        });

        var stroke = new ol.style.Stroke({
            color: stroke_color,
            width: stroke_width
        });

        return new ol.style.Style({
            image: new ol.style.Circle({
                fill: fill,
                stroke: stroke,
                radius: circle_radius
            }),
            fill: fill,
            stroke: stroke
        });
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------




// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          Local Context Box PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

var LocalContextBoxPrototype = {
    updateLocalContextBox: function(new_extent) {
        try {
            this.map_layers.LocalContextBox.getSource().clear();
        }
        catch (e) {
            // console.log(e);
        }

        // Setup pixel space coordinates
        // -----------------------------------------------------------------------------
        var min_lon_pixel = new_extent[0];
        var min_lat_pixel = new_extent[1];
        var max_lon_pixel = new_extent[2];
        var max_lat_pixel = new_extent[3];

        var pixelSpaceCoordinates = [[min_lon_pixel, max_lat_pixel], [min_lon_pixel, min_lat_pixel], [max_lon_pixel, min_lat_pixel], [max_lon_pixel, max_lat_pixel]];
        // -----------------------------------------------------------------------------


        // Create vector source with polygon feature
        // -----------------------------------------------------------------------------
        var vectorSource = new ol.source.Vector({});

        // create feature
        var polygonFeature = new ol.Feature({
            geometry: new ol.geom.Polygon([pixelSpaceCoordinates])
        });

        // add feature
        vectorSource.addFeature(polygonFeature);
        // -----------------------------------------------------------------------------


        // Create local context box layer and add it to mapp
        // -----------------------------------------------------------------------------
        // create layer
        this.map_layers.LocalContextBox = new ol.layer.Vector({
            source: vectorSource
        });

        // Add layer to map
        this.map.addLayer(this.map_layers.LocalContextBox);
        // -----------------------------------------------------------------------------
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------




// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          ANIMATION PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var AnimationPrototype = {
    initAnimationParameters: function () {
        this.animate_duration = 3000;
        this.animation_interval = 1500;


    },
    initAlerts: function() {
        var this_view = this;
        console.log("REGION_OF_INTEREST: " + REGION_OF_INTEREST);
        console.log("this.regions: " + this.regions);
        console.log(this.regions[REGION_OF_INTEREST]);

        var region_feature = this.regions[REGION_OF_INTEREST].feature;


        // Secondary Animation Loop (repeats the animation loop)
        // -------------------------------------------------
        this.regions[REGION_OF_INTEREST].interval.map = setInterval(function() {

            // Set new animation start time
            // --------------------------------------------
            this_view.animation_start = new Date().getTime();
            // --------------------------------------------

            // Add new listener
            this_view.listenerKey = this_view.map.on('postcompose', function(event) {

                // Start primary animation loop (draws the circle animation)
                // ------------------------------------------------------------
                this_view.animateRegion(event, region_feature);
                // ------------------------------------------------------------
            });

        }, this.animation_interval);
        // -------------------------------------------------
    },
    animateRegion: function(event, region_feature) {

        // Get vector context and frame state
        // --------------------------------------
        var vectorContext = event.vectorContext;
        var frameState = event.frameState;
        // --------------------------------------
        
        // Get geometry and clone it for editing
        // --------------------------------------------------
        var flashGeom = region_feature.getGeometry().clone();
        // --------------------------------------------------

        // Track time
        // --------------------------------------------------------
        var elapsed = frameState.time - this.animation_start;
        var elapsedRatio = elapsed / this.animate_duration;
        // --------------------------------------------------------

        // Set radius and opacity for current loop - Note: radius will be 5 at start and 30 at end.
        // -------------------------------------------------------
        var radius = ol.easing.easeOut(elapsedRatio) * 55 + 5;
        var opacity = ol.easing.easeOut(1 - elapsedRatio);

        var style = new ol.style.Style({
            image: new ol.style.Circle({
                radius: radius,
                snapToPixel: false,
                stroke: new ol.style.Stroke({
                    color: 'rgba(255, 0, 0, ' + opacity + ')',
                    width: 0.25 + opacity
                })
            })
        });
        // -------------------------------------------------------

        // Set style and draw new geometry
        // ------------------------------------
        vectorContext.setStyle(style);
        vectorContext.drawGeometry(flashGeom);
        // ------------------------------------


        // Exit animation if animation loop has finished
        // -------------------------------------------------------
        if (elapsed > this.animate_duration) {
            ol.Observable.unByKey(this.listenerKey);
            return;
        }
        // -------------------------------------------------------


        // tell OpenLayers to continue postcompose animation
        // -------------------------------------------------------
        this.map.render();
        // -------------------------------------------------------
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------













// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          REGIONS PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var RegionsPrototype = {
    initRegionExtentAndMarkerOverlays: function() {
        for (var region_name in this.model.regions) {

            // Initialize container for current region view objects
            this.regions[region_name] = {interval : {}};

            // Get region extent from the model
            var region_extent = this.model.regions[region_name];

            // Geo space, EPSG: 4326
            // ------------------------------------
            var min_lat_geo = region_extent.latmin;
            var max_lat_geo = region_extent.latmax;
            var min_lon_geo = region_extent.lonmin;
            var max_lon_geo = region_extent.lonmax;
            // -------------------------------------


            // Calculate center of region
            // --------------------------------------------------
            var mid_lon_geo = (min_lon_geo + max_lon_geo) / 2.0;
            var mid_lat_geo = (min_lat_geo + max_lat_geo) / 2.0;
            // --------------------------------------------------

            // Create geometry for region point
            // ------------------------------------------------------------------------
            var point_geom = new ol.geom.Point(
                ol.proj.transform([mid_lon_geo, mid_lat_geo], 'EPSG:4326', 'EPSG:3857')
            );
            // ------------------------------------------------------------------------);

            // Create new feature POINT
            // ------------------------------------
            var region_feature = new ol.Feature({
                name : "detection_region",
                region_name: region_name,
                geometry: point_geom
            });

            this.regions[region_name].feature = region_feature;
            // ------------------------------------


            // Create detection vector
            // ----------------------------------------------
            var detection_vector = new ol.source.Vector({ });
            detection_vector.addFeature(region_feature);
            // ----------------------------------------------


            // Create detection layer
            // ---------------------------------------------
            var new_region_layer = new ol.layer.Vector({
                name: "detection_layer",
                source: detection_vector
            });

            // Add detection layer to map
            this.map.addLayer(new_region_layer);
            // ---------------------------------------------


            // Add styles
            // ------------------------------------------------------------------------
            var style = this.createStyle("default");

            // Apply style to detection layer
            new_region_layer.setStyle(style);
            // ------------------------------------------------------------------------


            // Add to map layers and set status to deactive (i.e., it is not currently selected)
            this.map_layers.Regions[region_name] = {"layer" : new_region_layer, "active" : false};


            // Turn on list alert
            this.listAlertON(region_name);

        }
    },
    initRegionListMapOverlay: function(region_data) {

        var region_names = Object.keys(region_data);

        // Region list
        // ------------------------------------------------------------------------------------------
        var region_list_overlay = d3.select("#global_context_main_div").append("div").attr("id", "global_context__region_list_overlay");

        region_list_overlay.append("label").html("Regions");

        region_list_overlay.append("ul")
            .selectAll("li")
            .data(region_names).enter()
            .append("li")
            .attr("class", "global_context_list_li")
            .attr("id", function(d) {
                return "global_context_list__"+d;
            })
            .text(function (d) { return printName(d); })
        // ------------------------------------------------------------------------------------------
    },
    listAlertON: function(region_name) {
        var interval_time = 1000;
        var alert_class;
        // TODO: HARDCODING FOR NOW
        // ************************************************************************************************************************
        if (region_name === "boulder") {
            alert_class = "global_context_region_list_li_alert_LOW";
        }
        else if (region_name === "israel") {
            alert_class = "global_context_region_list_li_alert_HIGH";
        }
        else {
            alert_class = "global_context_region_list_li_alert_MEDIUM";
        }
        // ************************************************************************************************************************

        // Set loop for region name blink
        // -----------------------------------------------------------------------------
        // this.regions[region_name].interval.list = setInterval(function() {
        //     d3.select("#global_context_list__"+region_name).classed(alert_class, true);
        //     setTimeout(function() {
        //         d3.select("#global_context_list__"+region_name).classed(alert_class, false);
        //     }, interval_time*0.70);
        // }, interval_time);
        // -----------------------------------------------------------------------------
    },
    initAlertKey: function() {
        var alert_keys = {
            High    :   "global_context_region_list_li_alert_HIGH",
            Medium  :   "global_context_region_list_li_alert_MEDIUM",
            Low     :   "global_context_region_list_li_alert_LOW"
        };

        // Region list
        // ------------------------------------------------------------------------------------------
        var region_list_overlay = d3.select("#global_context_main_div").append("div").attr("id", "global_context__region_alert_key_overlay");

        region_list_overlay.append("label").html("Alert Levels");

        region_list_overlay.append("ul")
            .selectAll("li")
            .data(Object.keys(alert_keys)).enter()
            .append("li")
            .attr("id", function(d) {
                return "global_context_list__"+d;
            })
            .text(function (d) {
                return printName(d);
            })
        // ------------------------------------------------------------------------------------------
    }


};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------



















// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          EVENTS PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var EventPrototype = {
    mouseoverRegion: function(region_name) {

        // Check if active - if active, return
        // -----------------------------------
        if (this.map_layers.Regions[region_name].active) {
            return;
        }
        // -----------------------------------

        // STYLE MAP FEATURE
        // ------------------------------------------------------------
        var new_style = this.createStyle("mouseover");

        // Apply style to detection layer
        this.map_layers.Regions[region_name].layer.setStyle(new_style);
        // ------------------------------------------------------------

        // STYLE LIST
        // ---------------------------------------------------------------------------------------------------
        // d3.select("#global_context_list__"+region_name).classed('global_context_region_list_li_mouseover', true);
        // ---------------------------------------------------------------------------------------------------

        // Mouse Over Text
        // --------------
        this.mouseoverText(region_name);
        // --------------
    },
    mouseoverText: function(region_name) {
        d3.select("body").append("div")
            .attr("class", "region_name_tooltip")
            .attr("id", "region_name_tooltip")
            .html(function() {
                return "Region: " + region_name;
            })
            .style("position", "absolute")
            .attr("top", function() {
                return $(document).mousemove(function(e) {
                    return e.pageY;
                });
            })
            .attr("left", function() {
                return $(document).mousemove(function(e) {
                    return e.pageX;
                });
            });
    },
    mouseoutText: function() {
        d3.select("#region_name_tooltip").remove();
    },
    mouseoutRegion: function(previous_region_name) {
        // Check if region is active!
        var style_type = (this.map_layers.Regions[previous_region_name].active) ? "clicked" : "default";

        // STYLE MAP FEATURE
        // ------------------------------------------------------------
        var new_style = this.createStyle(style_type);

        // Apply style to detection layer
        this.map_layers.Regions[previous_region_name].layer.setStyle(new_style);
        // ------------------------------------------------------------

        // STYLE LIST
        // ---------------------------------------------------------------------------------------------------
        d3.select("#global_context_list__"+previous_region_name).classed('global_context_region_list_li_mouseover', false);
        // ---------------------------------------------------------------------------------------------------

        // Remove tooltip
        // -----------------
        this.mouseoutText();
        // -----------------
    },
    activateRegion: function(region_name) {

        // STYLE MAP FEATURE
        // ------------------------------------------------------------
        var new_style = this.createStyle("clicked");

        // Apply style to detection layer
        this.map_layers.Regions[region_name].layer.setStyle(new_style);
        // ------------------------------------------------------------

        // Turn OFF Interval for region
        // -----------------------------------------------
        clearInterval(this.regions[region_name].interval.map);
        // -----------------------------------------------

        // STYLE LIST
        // ---------------------------------------------------------------------------------------------------
        clearInterval(this.regions[region_name].interval.list);

        d3.select("#global_context_list__"+region_name).classed('global_context_region_list_li_active', true);

        // Turn off mouseover if active
        d3.select("#global_context_list__"+region_name).classed('global_context_region_list_li_mouseover', false);
        // ---------------------------------------------------------------------------------------------------
    },
    deactivateRegion: function(region_name) {

        // STYLE MAP FEATURE
        // ------------------------------------------------------------
        var new_style = this.createStyle("default");

        // Apply style to detection layer
        this.map_layers.Regions[region_name].layer.setStyle(new_style);
        // ------------------------------------------------------------

        // TODO: Turn on only if new detections in region!
        // ***************************************************************
        // Turn ON Interval for region
        // ------------------------------------------------------
        // var this_view = this;
        // var region_feature = this.regions[region_name].feature;
        //
        // var new_region_interval = setInterval(function() {
        //     this_view.regionAlertAnimation(region_feature);
        // }, 2000);
        //
        // this.regions[region_name].interval.map = new_region_interval;
        // ------------------------------------------------------
        // ***************************************************************

        // STYLE LIST
        // ----------------------------------------------------------------------------------------------------
        d3.select("#global_context_list__"+region_name).classed('global_context_region_list_li_active', false);
        // ----------------------------------------------------------------------------------------------------
    },
    deactivateOtherRegions: function(skip_region_name) {
        for (var region_name in this.map_layers.Regions) {
            if (region_name === skip_region_name) {
                continue;
            }

            this.map_layers.Regions[region_name].active = false;

            // DEACTIVATE non-selected region
            // --------------------------------
            this.deactivateRegion(region_name);
            // --------------------------------
        }
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------







// COMBINE PROTOTYPES
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
// Add Regions Objects from prototype to global context prototype
for (var eventObject in EventPrototype) {
    GlobalContextViewConstructor.prototype[eventObject] = EventPrototype[eventObject];
}

// Add Regions Objects from prototype to global context prototype
for (var helperObject in HelperPrototype) {
    GlobalContextViewConstructor.prototype[helperObject] = HelperPrototype[helperObject];
}

// Add Regions Objects from prototype to global context prototype
for (var regionObject in RegionsPrototype) {
    GlobalContextViewConstructor.prototype[regionObject] = RegionsPrototype[regionObject];
}

// Add Local Context Box Objects from prototype to global context prototype
for (var localBoxObject in LocalContextBoxPrototype) {
    GlobalContextViewConstructor.prototype[localBoxObject] = LocalContextBoxPrototype[localBoxObject];
}


// Add Animation Objects from prototype to global context prototype
for (var animationObject in AnimationPrototype) {
    GlobalContextViewConstructor.prototype[animationObject] = AnimationPrototype[animationObject];
}
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------




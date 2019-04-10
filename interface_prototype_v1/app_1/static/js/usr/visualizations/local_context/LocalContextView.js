var LocalContextViewConstructor = function(model) {
    this.model = model;


    // Divs and Containers
    // --------------------
    this.containers = {
        main        : null,
        map         : null,
        controls    : null,
        tracks      : null
    };
    // --------------------


    // ** MAP **
    // --------------------
    this.map = null;
    this.LOCAL_CONTEXT_OPACITY = 0.8;
    // --------------------


    // Map Layers
    // --------------------
    this.map_layers = {OSM : null,
        Drawing : {},
        PointTargets : {},
        Coordinates : null,
        Reference : null,
        Kalman : {},
        KalmanHead : {},
        SatelliteBox: {}};

    // Map settings
    // --------------------
    this.map_settings = {
        zoom        : {init : 14, max : 18, min : 1},
        opacity     : 0.6,
        brightness  : 0.2};
    // --------------------




    // Point Targets
    // --------------------

    // Point target flag
    this.POINT_TARGET_SELECTED = null;
    this.point_targets = {};
    this.point_target_settings = {
        colors : {
            fill : {
                selected    : [0, 255, 0, 0.6],
                unselected  : [180, 0, 0, 0.3]
            },
        stroke : [180, 0, 0, 1]
        }
    };
    // --------------------



    // Scales
    // --------------------
    this.scales = {
        lat : null,
        lon : null
    };
    // --------------------



    // Display Flags
    // --------------------
    this.DISPLAY_PROFILES = false;
    this.DISPLAY_SAT_CONTEXT_BOX = true;
    this.DISPLAY_TRACK_LIST = false;
    // --------------------

    // AUTO-INITIALIZER
    // --------------------
    this.initDivs();
    // --------------------

    // Init STYLES
    // --------------------
    this.initStyles();
    // --------------------
};

LocalContextViewConstructor.prototype = {
    initMap: function() {
        // Clear map layers
        // -------------------
        this.clearMapLayers();
        // -------------------


        // Initialize map LAYERS
        // ========================================================
        // OSM
        // ------------------------
        this.map_layers.OSM = new ol.layer.Tile({
            source: new ol.source.OSM()
        });

        // Set opacity
        this.map_layers.OSM.setOpacity(this.LOCAL_CONTEXT_OPACITY);
        // ----------------------------------


        // Local Drawing Layer
        // ----------------------------------
        this.AR_drawing_vector = new ol.source.Vector({wrapX: false});
        this.map_layers.Drawing.local = new ol.layer.Vector({
            source: this.AR_drawing_vector
        });
        // ----------------------------------


        // Global Drawing Layer
        // ----------------------------------
        // Get Drawing Layer from Global Context
        this.map_layers.Drawing.global = AppController.global_context.view.map_layers.Drawing;
        // ----------------------------------
        // ========================================================


        // Initialize map
        // --------------------------------------------------------------
        this.map = new ol.Map({
            layers: [
                this.map_layers.OSM,
                this.map_layers.Drawing.local,  // Add local drawing layer
                this.map_layers.Drawing.global  // Add global drawing layer to local context map
            ],
            renderer: 'canvas',
            target: "local_context_map_div",
            controls: this.initMouseoverMapControls()
        });
        // --------------------------------------------------------------

        // Init Controls for recentering view, turning on/off satellite context box, etc.
        this.initControls();

        // Init AUTO RELEASE
        this.initAutoRelease();

        // Initialize Region Name Overlay
        this.initRegionNameMapOverlay();
    },
    clearMapLayers: function() {
        this.map_layers = {
            OSM : null,
            Drawing : {},
            PointTargets : {},
            Coordinates : null,
            Reference : null,
            Kalman : {},
            KalmanHead : {},
            SatelliteBox: {}
        };
    },
    initRegionNameMapOverlay: function() {
        this.containers.region_name.append("label").attr("id", "local_context_region_name_text").html("Region: None");
        this.containers.region_name.append("p").attr("id", "local_context_region_info_text").html("Lat: N/A -- Lon: N/a");
    },
    resetRegionNameMapOverlay: function() {
        d3.select("#local_context_region_name_text").html("Region: None");
        d3.select("#local_context_region_info_text").html("Lat: N/A -- Lon: N/a");
    },
    initDivs: function() {
        // Remove previous containers
        for (var container in this.containers) {
            var current_container = this.containers[container];
            if (current_container !== null) {
                this.containers[container].remove();
            }
        }

        // Init Divs
        var main_div = d3.select("#satellite_and_local_context_div").append("div").attr("id", "local_context_main_div").style("opacity", 1.0);
        d3.select("#primary_view_div").append("div").attr("id", "track_listing_div");
        main_div.append("div").attr("id", "local_context_map_div");
        main_div.append("div").attr("id", "local_context_region_name_container");

        // Init containers
        this.containers.main = d3.select("#local_context_main_div");
        this.containers.map = d3.select("#local_context_map_div");
        this.containers.region_name = d3.select("#local_context_region_name_container");
        this.containers.tracks = d3.select("#track_listing_div").style("opacity", 0.0);


        // Initialize map container as no visibility!
        this.containers.map.style("opacity", 0.0);
    },
    initNewRegionView: function(this_controller, region_name) {


        // Ensure map container is visible
        this.containers.map.style("opacity", 1.0);

        // ANIMATE REGION CHANGE: https://openlayersbook.github.io/ch03-charting-the-map-class/example-04.html
        // Extent format [minx, miny, maxx, maxy]


        // Determine the center of the view
        // ------------------------------------------------------------------------------------------
        // Get lat lon minimums and maximums
        // ------------------
        var lon_min = this.model.geospatial_extent.lonmin;
        var lat_min = this.model.geospatial_extent.latmin;
        var lon_max = this.model.geospatial_extent.lonmax;
        var lat_max = this.model.geospatial_extent.latmax;
        // ------------------

        // Transform to pixel space
        // ------------------
        var minLonLatPixel = ol.proj.transform([lon_min, lat_min], 'EPSG:4326', 'EPSG:3857');
        var maxLonLatPixel = ol.proj.transform([lon_max, lat_max], 'EPSG:4326', 'EPSG:3857');
        // ------------------

        // Set inidividual variables
        // ------------------
        var lon_min_pixel = minLonLatPixel[0];
        var lat_min_pixel = minLonLatPixel[1];
        var lon_max_pixel = maxLonLatPixel[0];
        var lat_max_pixel = maxLonLatPixel[1];
        // ------------------

        // Define extents in pixelspace
        // ------------------
        var geospatial_extent = [lon_min_pixel, lat_min_pixel, lon_max_pixel, lat_max_pixel];


        // Define center
        // ------------------
        var center = ol.extent.getCenter(geospatial_extent);
        // ------------------------------------------------------------------------------------------


        // Append center to list
        // ------------------------------------
        this.model.region_view_centers[region_name] = center;
        // ------------------------------------


        // Set the region's view at center
        // ------------------------------------
        this.map.setView(new ol.View( {
            center: center,
            zoom: this.map_settings.zoom.init,
            minZoom: this.map_settings.zoom.min,
            maxZoom: this.map_settings.zoom.max
        }));
        // ------------------------------------


        // Add listener
        // ------------------------------------
        this.map.getView().on('change:resolution', this_controller.updateContextOnGlobal);
        // ------------------------------------


        // Initialize Region Name Overlay
        // ------------------------------------
        this.setRegionNameMapOverlay(region_name);
        // ------------------------------------
    },
    setRegionNameMapOverlay: function(region_name) {
        this.containers.region_name.select("label").html("Region: " + printName(region_name));

        // Information:
        var center = this.map.getView().getCenter();
        var deg_center = ol.proj.transform(center, 'EPSG:3857', 'EPSG:4326');

        var lat = deg_center[1];
        var lon = deg_center[0];
        var lat_symbol = (deg_center[1] >= 0) ? "&#176 N" : "&#176 S";
        var lon_symbol = (deg_center[0] >= 0) ? "&#176 E" : "&#176 W";

        // Update lon
        lon = (lon < 0) ? -lon : lon;

        this.containers.region_name.select("p").html("Lat: " + lat.toFixed(2) + lat_symbol + " -- Lon: " + lon.toFixed(2) + lon_symbol);

    },
    initMouseoverCoordinateDisplay: function() {

        // Create div for coords
        var buttons_container = d3.select("#local_context_main_div").append("div")
            .attr("id", "local_context_controls__mouseover_coords_container");

        buttons_container.append("div").attr("id", "local_coordinates_mouse_position");

        return new ol.control.MousePosition({
            // coordinateFormat: ol.coordinate.createStringXY(4),
            projection: 'EPSG:4326',
            className: 'custom-mouse-position',
            target: document.getElementById('local_coordinates_mouse_position'),
            undefinedHTML: '&nbsp;',
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
        });
    },
    initMouseoverMapControls: function() {
        var mouse_pos_cntrls = this.initMouseoverCoordinateDisplay();
        return ol.control.defaults({
            attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
                collapsible: false
            })
        }).extend([mouse_pos_cntrls]);
    },
    initControls: function() {
        var this_view = this;
        var this_model = this.model;

        // CONTROL BUTTONS
        // ------------------------------------------------------------------------------------------


        // Add RECENTER CONTEXT VIEW button
        // -----------------------------------------------------
        d3.select("#local_context__reset_view_button").remove();

        var center_button_container = d3.select("#local_context_main_div").append("div").attr("id", "local_context_controls__center_button_container");

        center_button_container.append("input")
            .attr("id", "local_context__reset_view_button")
            .attr("type", "button")
            .attr("value", "Recenter View")
            .on("click", function() {
                try {
                    this_view.loadRegionView(this_model.current_region_name);
                }
                catch(e) {}
            });
        // -----------------------------------------------------


        // Add HIDE SATELLITE CONTEXT BOX button
        // -----------------------------------------------------
        d3.select("#local_context__satellite_context_box_button").remove();

        d3.select("#local_context_main_div").append("input")
            .attr("id", "local_context__satellite_context_box_button")
            .attr("type", "button")
            .attr("value", "Hide Satellite Context")
            .on("click", function() {
                try {
                    this_view.DISPLAY_SAT_CONTEXT_BOX = !this_view.DISPLAY_SAT_CONTEXT_BOX;
                    this_view.updateSatelliteContextBox(this_model.current_region_name);
                }
                catch(e) {}
            });
        // -----------------------------------------------------
        // ------------------------------------------------------------------------------------------
    },
    loadRegionView: function() {
        // Determine new center
        var new_center = this.model.region_view_centers[this.model.current_region_name];

        // Set the view
        this.map.setView(new ol.View({
            center: new_center,
            zoom: this.map_settings.zoom.init,
            minZoom: this.map_settings.zoom.min,
            maxZoom: this.map_settings.zoom.max
        }));

        // UPDATE MAP SIZE FOR NEW REGION
        this.map.updateSize();

        // Reset satellite context box to ON
        this.DISPLAY_SAT_CONTEXT_BOX = true;
        this.updateSatelliteContextBox(this.model.current_region_name);
    }
};






















// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          SATELLITE CONTEXT BOX PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var SatelliteContextBoxPrototype = {
    initSatelliteContextBox: function() {

        // Check if satellite context box has already been initialized
        if (this.model.current_region_name in this.map_layers.SatelliteBox) {
            return;
        }

        // Determine pixel coordinates
        // ------------------------------------------------------------------------

        // this.model.geospatial_extent
        // {latmax: 39.990298, latmin: 39.971308, lonmax: -105.265918, lonmin: -105.296981}

        var lower_left = ol.proj.transform([this.model.geospatial_extent.lonmax, this.model.geospatial_extent.latmin], 'EPSG:4326', 'EPSG:3857');
        var upper_left = ol.proj.transform([this.model.geospatial_extent.lonmax, this.model.geospatial_extent.latmax], 'EPSG:4326', 'EPSG:3857');
        var upper_right = ol.proj.transform([this.model.geospatial_extent.lonmin, this.model.geospatial_extent.latmax], 'EPSG:4326', 'EPSG:3857');
        var lower_right = ol.proj.transform([this.model.geospatial_extent.lonmin, this.model.geospatial_extent.latmin], 'EPSG:4326', 'EPSG:3857');

        var satellite_bounding_box = [lower_left, upper_left, upper_right, lower_right];

        // Create feature and vector source for satellite box layer
        // ------------------------------------------------------------------------
        var polygonFeature = new ol.Feature({
            geometry : new ol.geom.Polygon([satellite_bounding_box])
        });

        var vectorSource = new ol.source.Vector();

        vectorSource.addFeature(polygonFeature);
        // ------------------------------------------------------------------------

        // Create layer and add to map
        // ------------------------------------------------------------------------
        var satellite_box_layer = new ol.layer.Vector({
            source: vectorSource
        });

        // Add layer to map
        this.map.addLayer(satellite_box_layer);

        // Update map layers container
        this.map_layers.SatelliteBox[this.model.current_region_name] = satellite_box_layer;
        // ------------------------------------------------------------------------


        // Add style to layer
        // ------------------------------------------------------------------------
        // Create style
        var new_style = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'black',
                width: 5
            }),
            fill: new ol.style.Fill({
                color: 'rgba(0, 0, 0, 0.1)'
            })
        });

        // Add style
        satellite_box_layer.setStyle(new_style);
        // ------------------------------------------------------------------------


        // Set display context box to true, update visualization / buttons
        // ------------------------------------------------------------------------
        this.DISPLAY_SAT_CONTEXT_BOX = true;
        this.updateSatelliteContextBox(this.model.current_region_name);
        // ------------------------------------------------------------------------

        // Set z index!
        // ------------------------------------------------------------------------
        satellite_box_layer.setZIndex(0);
        // ------------------------------------------------------------------------
    },
    updateSatelliteContextBox: function(region_name) {
        // Catch a bug
        if (this.map_layers.SatelliteBox[region_name] === undefined) {
            this.initSatelliteContextBox();
            return;
        }


        var new_opacity = (this.DISPLAY_SAT_CONTEXT_BOX) ? 1.0 : 0.0;

        this.map_layers.SatelliteBox[region_name].setOpacity(new_opacity);

        var new_text = (this.DISPLAY_SAT_CONTEXT_BOX) ? "Hide" : "Show";

        // Update button
        d3.select("#local_context__satellite_context_box_button")
            .transition()
            .attr("value", function() {
                return new_text + " Satellite Context"
            });
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

















// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          POINT TARGETS PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var PointTargetHelpersPrototype = {
    addPoint: function(point_target_id, feature_id, init_lon, init_lat, i) {

        // Create POINT Geometry
        // ---------------
        var point_geometry = new ol.geom.Point([init_lon, init_lat]);
        // ---------------

        // ------------------------------------------------------------------------
        // CREATE: feature, vector, layer
        // ------------------------------------------------------------------------
        this.objectBase(point_geometry, point_target_id, feature_id, i);
        // ------------------------------------------------------------------------

    },
    addLine: function(point_target_id, feature_id, track_data, i) {

        // Create LINE Geometry
        // ---------------
        var line_geometry = new ol.geom.LineString(track_data);
        // ---------------


        // ------------------------------------------------------------------------
        // CREATE: feature, vector, layer
        // ------------------------------------------------------------------------
        this.objectBase(line_geometry, point_target_id, feature_id, i);
        // ------------------------------------------------------------------------
    },
    objectBase: function(new_geometry, point_target_id, feature_id, i) {
        // Create Feature
        // ---------------
        var point_target_feature = new ol.Feature({
            geometry: new_geometry,
            name : "feature__point_target_"+feature_id+"_" + i
        });
        // ---------------

        // Create Vector
        // ---------------
        var point_target_vector = new ol.source.Vector({
            name : "vector__point_target_"+feature_id+"_" + i
        });
        point_target_vector.addFeature(point_target_feature);
        // ---------------

        // Create Layer
        // ---------------
        var point_target_layer = new ol.layer.Vector({
            source: point_target_vector,
            name: "layer__point_target_"+feature_id+"_" + i
        });
        // ---------------

        // Set objects into this.point_target container
        // ---------------
        this.point_targets[this.model.current_region_name][point_target_id][feature_id].geometry = new_geometry;
        this.point_targets[this.model.current_region_name][point_target_id][feature_id].feature = point_target_feature;
        this.point_targets[this.model.current_region_name][point_target_id][feature_id].vector = point_target_vector;
        this.point_targets[this.model.current_region_name][point_target_id][feature_id].layer = point_target_layer;
        // ---------------
    },
    createStyle: function(classification, highlight) {
        var fill_color, stroke_color, circle_color;

        classification = (classification) ? classification : this.selected_AR_classification;

        // Determine styles
        if (highlight) {
            fill_color = this.AR_styles[classification].fill_color.highlight;
            stroke_color = this.AR_styles[classification].stroke_color.highlight;
            circle_color = this.AR_styles[classification].circle_color.highlight;
        }
        else {
            fill_color = this.AR_styles[classification].fill_color.default;
            stroke_color = this.AR_styles[classification].stroke_color.default;
            circle_color = this.AR_styles[classification].circle_color.default;
        }

        // Return new style
        return new ol.style.Style({
            fill: new ol.style.Fill({
                color: fill_color
            }),
            stroke: new ol.style.Stroke({
                color: stroke_color,
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: circle_color
                })
            })
        });
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------









// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          POINT TARGETS PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var PointTargetCentroidsViewPrototype = {
    initPointTargetCentroids: function() {
        // TODO: PLACE THIS SOMEWHERE ELSE - It clears ALL point target visualization objects (kalman tracks, uncertainty ellipses, etc.) - not just centroids
        // Ensure layers are clear for point target centroids
        // if (this.model.current_region_name in this.map_layers.PointTargets) {
        //     this.resetPointTargets();
        // }



        // Initialize Container for point target objects
        // ------------------------------------------------------------------------------------------------
        // Organization:
        //    this.point_targets[REGION] = {point_target_ID : {centroid : {feature : Obj, geometry : Obj, vector : Obj, layer : Obj},
        //                                                     uncertainty_ellipse: {feature : Obj, geometry : Obj, vector : Obj, layer : Obj},
        //                                                     Kalman_track: {feature : Obj, geometry : Obj, vector : Obj, layer : Obj},
        //                                                     Kalman_head: {feature : Obj, geometry : Obj, vector : Obj, layer : Obj}
        //                                                      }
        //                                  }
        // ------------------------------------------------------------------------------------------------
        this.point_targets[this.model.current_region_name] = {};
        // ------------------------------------------------------------------------------------------------


        // Get init lat and lon from model
        var init_point_target_centroids = this.model.getCurrentPointTargetCentroids(0);


        // Iterate through each centroid in the frame
        for (var i=0; i < init_point_target_centroids.length; i++) {

            // Declare current centroid in list for current frame (initial frame here)
            var point_target_centroid = init_point_target_centroids[i];

            // Declare ID for current point target
            var point_target_id = point_target_centroid.track_id;


            // Initialize this.point_target container with current point target id
            this.point_targets[this.model.current_region_name][point_target_id] = {
                centroid : {
                    geometry    : null,
                    feature     : null,
                    vector      : null,
                    layer       : null
                }
            };

            // Declare init lat and lon of centroid (** Recall: coords here are in EPSG: 3857 (OL projection pixelspace))
            var init_lat = point_target_centroid.lat;
            var init_lon = point_target_centroid.lon;


            // ------------------------------------------------------------------------
            // CREATE POINT
            // ------------------------------------------------------------------------
            var feature = "centroid";
            this.addPoint(point_target_id, feature, init_lon, init_lat, i);
            // ------------------------------------------------------------------------

            // Get Layer
            // ---------------
            var centroid_layer = this.point_targets[this.model.current_region_name][point_target_id].centroid.layer;
            // ---------------


            // ------------------------------------------------------------------------
            // CREATE STYLES: fill, stroke, style object
            // ------------------------------------------------------------------------
            var centroid_default_style = this.styles.centroid.not_classified;

            // Apply style
            this.addStyle(centroid_layer, centroid_default_style);
            // ------------------------------------------------------------------------


            // ------------------------------------------------------------------------
            // Add point target layer to map
            // ------------------------------------------------------------------------
            this.map.addLayer(centroid_layer);
            // ------------------------------------------------------------------------
        }
    },

    updatePointTargetCentroids: function() {

        // Set current playback frame (it should correspond with stream frames by default)
        var current_playback_frame = AppController.CURRENT_REGION.playback.getCurrentFrame();

        var current_point_target_centroids = this.model.getCurrentPointTargetCentroids(current_playback_frame);


        for (var i=0; i < current_point_target_centroids.length; i++) {

            // Declare current centroid in list for current frame (initial frame here)
            var point_target_centroid = current_point_target_centroids[i];

            // Declare ID for current point target
            var point_target_id = point_target_centroid.track_id;

            // Retrieve current point target geometry
            var point_target_geometry = this.point_targets[this.model.current_region_name][point_target_id].centroid.geometry;

            // CHECK IF TRACK INACTIVE
            if (point_target_centroid.lat === null) {
                this.point_targets[this.model.current_region_name][point_target_id].centroid.layer.setVisible(false);
            }
            else {
                this.point_targets[this.model.current_region_name][point_target_id].centroid.layer.setVisible(true);
                // Declare init lat and lon of centroid (** Recall: coords here are in EPSG: 3857 (OL projection pixelspace))
                var current_lat = point_target_centroid.lat;
                var current_lon = point_target_centroid.lon;

                // Update geometry with new coordinates
                point_target_geometry.setCoordinates([current_lon, current_lat]);
            }
        }
    },
    resetPointTargets: function() {
        // Remove detection layer
        var point_target_centroid_layers = this.map_layers.PointTargets[this.model.current_region_name].centroids;

        for (var i=0; i < point_target_centroid_layers.length; i++) {
            var point_target_centroid_layer = point_target_centroid_layers[i];
            this.map.removeLayer(point_target_centroid_layer);
            delete this.map_layers.PointTargets[this.model.current_region_name].centroids[point_target_centroid_layer];
        }
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------












// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          KALMAN TRACKS PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var PointTargetKalmanTracksViewPrototype = {

    initPointTargetKalmanTracks: function() {

        var region_name = this.model.current_region_name;
        var init_frame_index = 0;

        var kalman_track_list = this.model.getTrackList(region_name);


        for (var i=0; i < kalman_track_list.length; i++) {
            var track = kalman_track_list[i];

            var point_target_id = track.track_id;


            // Initialize this.point_target container with current point target id
            // ------------------------------------------------------------------------
            // Initialize Kalman Track
            this.point_targets[region_name][point_target_id].kalman_track = {
                geometry : null, feature : null, vector : null, layer : null
            };
            // Initialize Kalman Head
            this.point_targets[region_name][point_target_id].kalman_head = {
                geometry : null, feature : null, vector : null, layer : null
            };
            // ------------------------------------------------------------------------


            var init_track_data = this.model.getKalmanFilterData(point_target_id, init_frame_index);

            // Get lat lon for kalman head
            var init_lat = init_track_data[init_frame_index][1];
            var init_lon = init_track_data[init_frame_index][0];

            // ------------------------------------------------------------------------
            // CREATE LINE
            // ------------------------------------------------------------------------
            var feature = "kalman_track";
            this.addLine(point_target_id, feature, init_track_data, i);
            // ------------------------------------------------------------------------


            // Get Layer
            // ---------------
            var kalman_track_layer = this.point_targets[region_name][point_target_id].kalman_track.layer;
            // ---------------


            // ------------------------------------------------------------------------
            // CREATE STYLES: fill, stroke, style object
            // ------------------------------------------------------------------------
            var track_style = (this.DISPLAY_PROFILES) ? this.styles.kalman_track.selected : this.styles.kalman_track.not_classified;

            // Set style
            this.addStyle(kalman_track_layer, track_style);
            // ------------------------------------------------------------------------


            // ------------------------------------------------------------------------
            // Add kalman track layer to map
            // ------------------------------------------------------------------------
            this.map.addLayer(kalman_track_layer);
            // ------------------------------------------------------------------------


            // ------------------------------------------------------------------------
            // Init kalman heads
            // ------------------------------------------------------------------------
            this.initKalmanHead(point_target_id, init_lat, init_lon, i);
            // ------------------------------------------------------------------------
        }
        // Initialize Kalman Tracks and Head to be hidden:
        this.hideKalmanTracks();
    },
    updatePointTargetKalmanTracks: function() {

        // Set current playback frame (it should correspond with stream frames by default)
        var current_playback_frame = AppController.CURRENT_REGION.playback.getCurrentFrame();
        var region_name = this.model.current_region_name;

        var kalman_track_list = this.model.getTrackList(region_name);

        var current_lat, current_lon;

        for (var i=0; i < kalman_track_list.length; i++) {
            var track = kalman_track_list[i];

            var point_target_id = track.track_id;


            // Retrieve current point target geometry
            var kalman_track_geometry = this.point_targets[region_name][point_target_id].kalman_track.geometry;


            // Get current track data
            var track_data = this.model.getKalmanFilterData(point_target_id, current_playback_frame);

            // Get lat lon for kalman head
            current_lat = track_data[current_playback_frame][1];
            current_lon = track_data[current_playback_frame][0];

            // Check if track empty
            if (current_lat === null) {
                this.model.deactivateTrack(point_target_id, current_playback_frame);
                this.point_targets[this.model.current_region_name][point_target_id].kalman_track.layer.setVisible(false);
            }
            else {
                this.point_targets[this.model.current_region_name][point_target_id].kalman_track.layer.setVisible(true);
                // Update geometry with updated track data
                kalman_track_geometry.setCoordinates(track_data);
            }
            // Update Kalman head
            this.updateKalmanHead(point_target_id, current_lat, current_lon);

        }
    },
    showKalmanTracks: function() {
        var point_targets = this.point_targets[this.model.current_region_name];
        for (var point_target_id in point_targets) {
            var point_target = point_targets[point_target_id];

            point_target.kalman_track.layer.setOpacity(1.0);

            // Hide Kalman Head
            point_target.kalman_head.layer.setOpacity(1.0);
        }
    },
    hideKalmanTracks: function() {

        // Initialize new style
        var point_targets = this.point_targets[this.model.current_region_name];
        for (var point_target_id in point_targets) {
            var point_target = point_targets[point_target_id];

            point_target.kalman_track.layer.setOpacity(0.0);

            // Hide Kalman Head
            point_target.kalman_head.layer.setOpacity(0.0);
        }
    },
    selectKalmanTracks: function() {
        // Initialize new style
        var kalman_track_layer = this.point_targets[region_name][point_target_id].kalman_track.layer;
        var track_style = this.styles.kalman_track.selected;

        // Set style
        this.addStyle(kalman_track_layer, track_style);
    },
    deselectKalmanTracks: function() {
        // Initialize new style
        var kalman_track_layer = this.point_targets[region_name][point_target_id].kalman_track.layer;
        var track_style = this.styles.kalman_track.not_classified;

        // Set style
        this.addStyle(kalman_track_layer, track_style);
    },
    resetKalmanTracks: function() {
        // Remove Kalman Track
        var kalman_layer = this.map_layers.Kalman[this.model.current_region_name];
        this.map.removeLayer(kalman_layer);
        delete this.map_layers.Kalman[this.model.current_region_name];

        // Remove Kalman Track Head
        var kalman_head_layer = this.map_layers.KalmanHead[this.model.current_region_name];
        this.map.removeLayer(kalman_head_layer);
        delete this.map_layers.KalmanHead[this.model.current_region_name];
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------










// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          KALMAN HEADS PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var PointTargetKalmanHeadsViewPrototype = {
    initKalmanHead: function(point_target_id, init_lat, init_lon, i) {

        // ------------------------------------------------------------------------
        // CREATE POINT
        // ------------------------------------------------------------------------
        var feature = "kalman_head";
        this.addPoint(point_target_id, feature, init_lon, init_lat, i);
        // ------------------------------------------------------------------------


        // Get Layer
        // ---------------
        var kalman_head_layer = this.point_targets[this.model.current_region_name][point_target_id].kalman_head.layer;
        // ---------------

        // ------------------------------------------------------------------------
        // CREATE STYLES: fill, stroke, style object
        // ------------------------------------------------------------------------
        var kalman_head_style = this.styles.kalman_head.default;


        // Apply style
        this.addStyle(kalman_head_layer, kalman_head_style);
        // ------------------------------------------------------------------------


        // ------------------------------------------------------------------------
        // Add Kalman Head Layer to local context map
        // ------------------------------------------------------------------------
        this.map.addLayer(kalman_head_layer);
        // ------------------------------------------------------------------------
    },
    updateKalmanHead: function(point_target_id, current_lat, current_lon) {
        // Check if track inactive!
        if (current_lat === null) {
            this.point_targets[this.model.current_region_name][point_target_id].kalman_head.layer.setVisible(false);
        }
        else {
            this.point_targets[this.model.current_region_name][point_target_id].kalman_head.layer.setVisible(true);
            var kalman_head_point_geom = new ol.geom.Point([current_lon, current_lat]);

            var kalman_head_feature = this.point_targets[this.model.current_region_name][point_target_id].kalman_head.feature;

            kalman_head_feature.setGeometry(kalman_head_point_geom);
        }
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------










// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          UNCERTAINTY ELLIPSES PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var PointTargetUncertaintyEllipsesViewPrototype = {
    initPointTargetUncertaintyEllipses: function() {

        // Get init lat and lon from model
        var init_point_target_ellipses = this.model.getPointTargetUncertaintyEllipses(0);


        // Iterate through each centroid in the frame
        for (var i=0; i < init_point_target_ellipses.length; i++) {

            // Declare ID for current point target
            var point_target_id = "point_target_" + i;

            // Initialize this.point_target container with current point target id
            this.point_targets[this.model.current_region_name][point_target_id] = {
                uncertainty_ellipse: {geometry: null, feature: null, vector: null, layer: null}
            };

            // Declare current ellipse in list for current frame (initial frame here)
            var point_target_ellipse = init_point_target_ellipses[i];
        }


    },
    updatePointTargetUncertaintyEllipses: function() {

    },
    resetPointTargetUncertaintyEllipses: function() {

    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------















// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          STYLES PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var stylesPrototype = {

    initStyles: function() {

        // TRACK STYLES
        // ---------------------------------------------

        var track_INACTIVE = {
            fill_color : [0, 0, 0, 0.3],
            stroke_color : [0, 0, 0, 0.9],
            stroke_width : 6,
            object_radius : 14,
            z_index : 10
        };


        // Event styles
        // ----------------------
        var track_HOVER_ON = {
            fill_color : [255, 157, 23, 0.6],
            stroke_color : [255, 157, 23, 0.8],
            stroke_width : 8,
            object_radius : 14,
            z_index : 10
        };

        var track_CLICKED = {
            fill_color : [255, 157, 23, 0.6],
            stroke_color : [255, 157, 23, 1.0],
            stroke_width : 12,
            object_radius : 18,
            z_index : 10
        };


        // Classification styles
        // ----------------------
        var track_NOT_CLASSIFIED = {
            fill_color : [180, 0, 0, 0.5],
            stroke_color : [180, 0, 0, 0.8],
            stroke_width : 8,
            object_radius : 14,
            z_index : 10
        };

        var track_SELECTED = {
            fill_color : [50, 255, 0, 0.4],
            stroke_color : [50, 255, 0, 0.9],
            stroke_width : 8,
            object_radius : 14,
            z_index : 10
        };

        var track_IGNORE = {
            fill_color : [255, 255, 255, 0.3],
            stroke_color : [255, 255, 255, 0.7],
            stroke_width : 8,
            object_radius : 12,
            z_index : 10
        };

        // AUTO
        var track_SELECTED_AUTO = {
            fill_color : [164, 255, 255, 0.6],
            stroke_color : [164, 255, 255, 0.9],
            stroke_width : 8,
            object_radius : 14,
            z_index : 10
        };

        var track_IGNORE_AUTO = {
            fill_color : [0, 0, 255, 0.2],
            stroke_color : [0, 0, 255, 0.7],
            stroke_width : 8,
            object_radius : 12,
            z_index : 10
        };
        // ---------------------------------------------


        // TRACK HEAD STYLES
        // ---------------------------------------------
        var track_head_DEFAULT = {
            fill_color : [0, 0, 0, 0.3],
            stroke_color : [0, 0, 0, 0.6],
            stroke_width : 1,
            object_radius : 6,
            z_index : 999
        };
        // ---------------------------------------------



        // CENTROID STYLES
        // ---------------------------------------------
        var centroid_INACTIVE = {
            fill_color : [0, 0, 0, 0.3],
            stroke_color : [0, 0, 0, 0.9],
            stroke_width : 2,
            object_radius : 16,
            z_index : 99
        };


        // Event styles
        // ----------------------
        var centroid_HOVER_ON = {
            fill_color : [255, 157, 23, 0.6],
            stroke_color : [255, 157, 23, 0.9],
            stroke_width : 6,
            object_radius : 18,
            z_index : 99
        };

        var centroid_CLICKED = {
            fill_color : [255, 157, 23, 0.4],
            stroke_color : [255, 157, 23, 1.0],
            stroke_width : 8,
            object_radius : 22,
            z_index : 10
        };

        // Classification styles
        // ----------------------
        var centroid_NOT_CLASSIFIED = {
            fill_color : [180, 0, 0, 0.75],
            stroke_color : [0, 0, 0, 1.0],
            stroke_width : 2,
            object_radius : 20,
            z_index : 99
        };

        var centroid_SELECTED = {
            fill_color : [50, 255, 0, 0.4],
            stroke_color : [0, 0, 0, 1.0],
            stroke_width : 2,
            object_radius : 20,
            z_index : 99
        };



        var centroid_IGNORE = {
            fill_color : [255, 255, 255, 0.3],
            stroke_color : [0, 0, 0, 1.0],
            stroke_width : 2,
            object_radius : 14,
            z_index : 99
        };


        // AUTO
        var centroid_SELECTED_AUTO = {
            fill_color : [164, 255, 255, 0.6],
            stroke_color : [0, 0, 0, 1.0],
            stroke_width : 2,
            object_radius : 20,
            z_index : 10
        };

        var centroid_IGNORE_AUTO = {
            fill_color : [0, 0, 255, 0.2],
            stroke_color : [0, 0, 0, 1.0],
            stroke_width : 2,
            object_radius : 14,
            z_index : 10
        };
        // ---------------------------------------------



        // Build styles into respective objects
        // ---------------------------------------------
        var trackStyles = {
            inactive        : track_INACTIVE,
            hoverON         : track_HOVER_ON,
            clicked         : track_CLICKED,
            not_classified  : track_NOT_CLASSIFIED,
            selected        : track_SELECTED,
            ignore          : track_IGNORE,
            selected_AUTO   : track_SELECTED_AUTO,
            ignore_AUTO     : track_IGNORE_AUTO
        };

        var trackHeadStyles = {
            default : track_head_DEFAULT
        };

        var centroidStyles = {
            inactive        : centroid_INACTIVE,
            hoverON         : centroid_HOVER_ON,
            clicked         : centroid_CLICKED,
            not_classified  : centroid_NOT_CLASSIFIED,
            selected        : centroid_SELECTED,
            ignore          : centroid_IGNORE,
            selected_AUTO   : centroid_SELECTED_AUTO,
            ignore_AUTO     : centroid_IGNORE_AUTO
        };
        // ---------------------------------------------


        // MAIN STYLES OBJECT
        // ---------------------------------------------
        // ---------------------------------------------
        this.styles = {
            kalman_track    : trackStyles,
            kalman_head     : trackHeadStyles,
            centroid        : centroidStyles
        };
        // ---------------------------------------------
        // ---------------------------------------------
    },
    addStyle: function (layer, style_obj) {

        // Unpack style object
        var fill_color = style_obj.fill_color;
        var stroke_color = style_obj.stroke_color;
        var stroke_width = style_obj.stroke_width;
        var object_radius = style_obj.object_radius;
        var z_index = style_obj.z_index;


        // ------------------------------------------------------------------------
        // CREATE STYLES: fill, stroke, style object
        // ------------------------------------------------------------------------
        // FILL
        // ---------------
        var fill = new ol.style.Fill({
            color: fill_color
        });
        // ---------------

        // STROKE
        // ---------------
        var stroke = new ol.style.Stroke({
            color: stroke_color,
            width: stroke_width
        });
        // ---------------

        // STYLE OBJECT
        // ---------------
        var style = new ol.style.Style({
            image: new ol.style.Circle({
                fill: fill,
                stroke: stroke,
                radius: object_radius
            }),
            fill: fill,
            stroke: stroke
        });
        // ---------------

        // APPLY style to layer
        // ---------------
        layer.setStyle(style);
        // ---------------

        // Place Object on top of map - Set Z index of object so it's always on top of kalman track
        // ---------------
        layer.setZIndex(z_index);
        // ---------------
        // ------------------------------------------------------------------------
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------












// COMBINE PROTOTYPES
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

// Add Point Target Centroids Objects from prototype to local context prototype
for (var pointTargetObject in PointTargetCentroidsViewPrototype) {
    LocalContextViewConstructor.prototype[pointTargetObject] = PointTargetCentroidsViewPrototype[pointTargetObject];
}

// Add Point Target Uncertainty Ellipses Objects from prototype to local context prototype
for (var ellipseObject in PointTargetUncertaintyEllipsesViewPrototype) {
    LocalContextViewConstructor.prototype[ellipseObject] = PointTargetUncertaintyEllipsesViewPrototype[ellipseObject];
}

// Add Point Target Kalman Tracks Objects from prototype to local context prototype
for (var kalmanObject in PointTargetKalmanTracksViewPrototype) {
    LocalContextViewConstructor.prototype[kalmanObject] = PointTargetKalmanTracksViewPrototype[kalmanObject];
}

// Add Point Target Kalman Head Objects from prototype to local context prototype
for (var kalmanHeadObject in PointTargetKalmanHeadsViewPrototype) {
    LocalContextViewConstructor.prototype[kalmanHeadObject] = PointTargetKalmanHeadsViewPrototype[kalmanHeadObject];
}


// Add Point Target Helper Objects from prototype to local context prototype
for (var helperObject in PointTargetHelpersPrototype) {
    LocalContextViewConstructor.prototype[helperObject] = PointTargetHelpersPrototype[helperObject];
}


// Add Satellite Context Box Objects from prototype to local context prototype
for (var satContextBoxObject in SatelliteContextBoxPrototype) {
    LocalContextViewConstructor.prototype[satContextBoxObject] = SatelliteContextBoxPrototype[satContextBoxObject];
}


// Add Release Controls Objects from prototype to local context prototype
for (var releaseControlsObject in ReleaseControlsPrototype) {
    LocalContextViewConstructor.prototype[releaseControlsObject] = ReleaseControlsPrototype[releaseControlsObject];
}


// Add Track List Objects from prototype to local context prototype
for (var trackListObject in TrackListPrototype) {
    LocalContextViewConstructor.prototype[trackListObject] = TrackListPrototype[trackListObject];
}

// Add Track List Color Key from prototype to local context prototype
for (var colorKeyObject in ColorKeyPrototype) {
    LocalContextViewConstructor.prototype[colorKeyObject] = ColorKeyPrototype[colorKeyObject];
}


// Add Track List Event Objects from prototype to local context prototype
for (var trackListEventObject in TrackListEventsPrototype) {
    LocalContextViewConstructor.prototype[trackListEventObject] = TrackListEventsPrototype[trackListEventObject];
}



// Add styles Objects from prototype to local context prototype
for (var styleObject in stylesPrototype) {
    LocalContextViewConstructor.prototype[styleObject] = stylesPrototype[styleObject];
}

// Add AR Objects from prototype to local context prototype
for (var ARObject in ARObjectsPrototype) {
    LocalContextViewConstructor.prototype[ARObject] = ARObjectsPrototype[ARObject];
}
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

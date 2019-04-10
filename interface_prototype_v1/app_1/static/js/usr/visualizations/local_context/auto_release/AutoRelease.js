









// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          AUTO-RELEASE OBJECTS PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var ARObjectsPrototype = {
    initAutoRelease: function() {

        this.AR_classifications = ["None", "Track", "Ignore"];
        this.AR_list = {"Track" : {}, "Ignore" : {}};

        this.AR_centroids = {};

        this.initARStyles();
        this.initAutoReleaseDrawingControls();

        // Initialize active drawing object as null
        this.active_AR_object = null;
    },
    initARStyles: function() {
        this.AR_highlight_stroke_width = 2;

        this.AR_styles = {
            None      : {type : "None"},

            Track     : {
                type : "Polygon",
                stroke_color : {default : "rgba(164, 255, 255, 1.0)", highlight : "rgba(164, 255, 255, 1.0)"},
                fill_color   : {default : "rgba(164, 255, 255, 0.7)", highlight : "rgba(164, 255, 255, 0.85)"},
                circle_color : {default : "rgba(164, 255, 255, 1.0)", highlight : "rgba(164, 255, 255, 1.0)"}
            },
            Ignore    : {
                type : "Polygon",
                stroke_color : {default : "rgba(0, 0, 255, 1.0)", highlight : "rgba(0, 0, 255, 1.0)"},
                fill_color   : {default : "rgba(0, 0, 255, 0.3)", highlight : "rgba(0, 0, 255, 0.45)"},
                circle_color : {default : "rgba(0, 0, 255, 1.0)", highlight : "rgba(0, 0, 255, 1.0)"}
            }
        };
    },
    createNewARObject: function() {

        // Get the drawing type (i.e., None, Track, Ignore)
        // ----------------------------------------
        var drawing_classification = this.AR_styles[this.selected_AR_classification].type;
        // ----------------------------------------

        // Generate new AR Key
        // ----------------------------------------
        var new_AR_key = this.generateARKey();
        // ----------------------------------------


        // Generate New Style
        // ----------------------------------------
        var AR_style = this.createStyle();
        // ----------------------------------------


        // New vector source and layer
        // ========================================================
        // source
        // ---------
        this.new_source = new ol.source.Vector({wrapX: false});

        // layer
        // ---------
        this.new_layer = new ol.layer.Vector({
            source: this.new_source,
            style: AR_style
        });
        // ========================================================


        // Create and set active AR object
        // ----------------------------------------
        this.active_AR_object = new ol.interaction.Draw({
            source: this.new_source,
            name: new_AR_key,
            type: /** @type {ol.geom.GeometryType} */ (drawing_classification),
            style: AR_style
        });
        // ----------------------------------------


        // Add the interaction to map
        // ----------------------------------------
        this.map.addInteraction(this.active_AR_object);
        // ----------------------------------------

        // Add the new layer to map
        // ----------------------------------------
        this.map.addLayer(this.new_layer);
        // ----------------------------------------


        // Add interactions
        // ------------------
        this.addARObjectEvents(new_AR_key);
        // ------------------


    },
    addARObjectEvents: function(new_AR_key) {

        // Set this view for us in on click events
        // ----------------------------------------
        var this_view = this;
        // ----------------------------------------

        // =======================================================
        // Draw end - add newly drawn object to list
        // ------------------------------------------------
        this.active_AR_object.on('drawend', function() {
            this_view.updateARList(new_AR_key);
        });
        // ------------------------------------------------


        // Add on click behavior
        // ------------------------------------------------
        // this.map.on('singleclick', function(event){
        //     var coordinate = event.coordinate;
        //     var pixel = event.pixel;
        //
        //     //
        //     var layer = this_view.map.forEachLayerAtPixel(event.pixel, function (layer_n) {
        //         return layer_n;
        //     });
        //
        //     // Check to see if clicked object has an event
        //     try {
        //         var layer_name = layer.get("name");
        //         console.log("FEATURE NAME: " + layer_name);
        //     }
        //     catch (e) {
        //         return;
        //     }
        //
        // });
        // ------------------------------------------------

        // this.active_AR_object.on('singleclick', function() {
        //     alert("Yes!");
        // });
        // =======================================================

    },
    addInteraction: function() {

        var this_view = this;
        // Add color reference: https://openlayers.org/en/latest/examples/draw-and-modify-features.html

        // Select drawing object
        var localDrawTypeSelect = document.getElementById('local_context__auto_release_draw_type');

        // Get the classification of the newly selected dropdown item (e.g., None, Track, Ignore)
        this.selected_AR_classification = localDrawTypeSelect.value;


        if (this.selected_AR_classification !== 'None') {
            // Create new AR Object
            this.createNewARObject();
        }
    },
    selectARfromList: function(AR_key) {
        // REFERENCES:
        // https://openlayers.org/en/latest/apidoc/ol.source.Vector.html#forEachFeatureIntersectingExtent
        // https://openlayers.org/en/latest/examples/box-selection.html
        // http://www.acuriousanimal.com/thebookofopenlayers3/chapter07_08_selecting_features_box.html
        //

        this.highlightAR_region(AR_key);


        // TODO: CALCULATE SPATIAL EXTENT AND USE FOR DETECTING / AUTO-CLASSING TARGETS IN REGION
        // ****************************************************************

        // DRAW A BOUNDING BOX AROUND SELECTED AR REGION
        // ==========================================================================

        // ==========================================================================

        // Check for collisions
        // this.checkCollisions();
        // ****************************************************************


        // TODO: ADD OPTION TO REMOVE
        // ****************************************************************


        // ****************************************************************
    },
    removeAllRegionHighlights: function() {
        for (var class_id in this.AR_list) {
            var current_classification_data = this.AR_list[class_id];

            for (var AR_id in current_classification_data) {
                var current_AR = current_classification_data[AR_id];
                var current_layer = current_AR.layer;

                // Apply default style
                var default_style = this.createStyle(class_id, false);

                // Set default style
                current_layer.setStyle(default_style);
            }
        }

        // Remove highlihght layer from map
        // ------------------------------------------------------------
        try {
            this.map.removeLayer(this.currentARHighlightLayer);
        }
        catch(e) {}
        // ------------------------------------------------------------
    },
    highlightAR_region: function(AR_key) {

        if (AR_key === "---") {
            this.removeAllRegionHighlights();
            return;
        }

        // Split text (<classification>_AR_<id_num>)
        // -----------------------------------
        var split_text = AR_key.split("_");
        // -----------------------------------

        // Get classification from text
        // -----------------------------------
        var classification = split_text[0];
        // -----------------------------------

        // Access AR list
        // -----------------------------------
        var data = this.AR_list[classification][AR_key];
        // -----------------------------------


        // Grab AR region's source and layer
        // -----------------------------------
        var source = data.source;
        var layer = data.layer;
        var drawing_object = data.drawing;
        // -----------------------------------


        // Remove highlight style from all ARs
        // -----------------------------------
        this.removeAllRegionHighlights();
        // -----------------------------------





        // Apply highlight style to currently selected
        // ------------------------------------------------------------
        var highlight_style = this.createStyle(classification, true);

        layer.setStyle(highlight_style);

        // Draw bounding box around chosen layer
        this.drawExactAR_Extent(source);
        // ------------------------------------------------------------
    },
    drawExactAR_Extent: function(source) {

        var this_view = this;

        // Get the specific coordinates of the geometry (exact shape rather than bounding box)
        var drawing_coords = this.getExactAR_Coords(source);

        var polygonFeature = new ol.Feature({
            geometry : new ol.geom.Polygon(drawing_coords)
        });
        var vectorSource = new ol.source.Vector();

        vectorSource.addFeature(polygonFeature);
        // ------------------------------------------------------------------------

        // Create layer and add to map
        // ------------------------------------------------------------------------
        this.currentARHighlightLayer = new ol.layer.Vector({
            source: vectorSource,
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: this_view.AR_highlight_stroke_width
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0.1)'
                })
            })
        });

        // Add layer to map
        this.map.addLayer(this.currentARHighlightLayer);
        // ------------------------------------------------------------------------
    },
    getExactAR_Coords: function(source) {
        // Get the array of features
        var features = source.getFeatures();

        var drawing_coords;
        features.forEach(function(feature) {
            drawing_coords = feature.getGeometry().getCoordinates();
        });


        return drawing_coords;
    },
    getExactAR_Extent: function(source) {
        // EXTENT:
        // An array of numbers representing an extent: [minx, miny, maxx, maxy]

        // Get the array of features
        var features = source.getFeatures();

        var drawing_coords;
        features.forEach(function(feature) {
            drawing_coords = feature.getGeometry().getCoordinates();
        });

        drawing_coords = drawing_coords[0];


        var X = [];
        var Y = [];
        for (var i=0; i < drawing_coords.length; i++) {
            var coords =  drawing_coords[i];

            X.push(coords[0]);
            Y.push(coords[1]);
        }
        // Make loop
        X.push(X[0]);
        Y.push(Y[0]);

        var exact_extents = [];
        for (var i=0; i < X.length-1; i++) {
            var x0 = X[0];
            var x1 = X[1];
            var y0 = Y[0];
            var y1 = Y[1];

            var minx = Math.min(x0, x1);
            var maxx = Math.max(x0, x1);
            var miny = Math.min(y0, y1);
            var maxy = Math.max(y0, y1);

            var new_extent = [minx, miny, maxx, maxy];
            exact_extents.push(new_extent);
        }

        return exact_extents;
    },
    checkCollisions: function(exact) {
        // REFERENCE: https://www.topcoder.com/community/data-science/data-science-tutorials/geometry-concepts-line-intersection-and-its-applications/#line_line_intersection

        var region_name = this.model.current_region_name;


        // Iterate through all AR regions
        for (var AR_class in this.AR_list) {
            var current_AR_class = this.AR_list[AR_class];

            // Iterate through each AR region in the above class
            for (var AR_key in current_AR_class) {
                var current_AR_data = current_AR_class[AR_key];

                var current_source = current_AR_data.source;
                var current_AR_extent = current_source.getExtent();

                // DO COLLISION CHECKING
                for (var point_target_id in this.point_targets[region_name]) {

                    // NOTES:
                    // *****************************************************************************
                    // MAYBE USE KALMAN TRACK TO CHECK FOR LINE INTERSECTIONS instead of centroid x,y in extent
                    // https://gis.stackexchange.com/questions/147829/how-to-check-for-geometry-intersection-point-in-polygon-using-openlayers3
                    //
                    // http://openlayers.org/en/latest/apidoc/ol.extent.html#.getIntersection
                    // Check extent of 2 vectors
                    // So, get the exact exent of the object
                    //   - move from point to point creating an extent vector
                    //   - compare kalman track to extent.
                    //          ol.extent.getIntersection(extent1, extent2)
                    //   - If extents intersect, flag
                    //

                    // TODO: FIX THIS
                    //
                    // ------
                    if (exact) {
                        // Access AR list
                        var data = this.AR_list[AR_class][AR_key];

                        // Grab AR region's source and layer
                        var source = data.source;

                        var exact_extents = this.getExactAR_Extent(source);
                        var kalman_track_geometry = this.point_targets[region_name][point_target_id].kalman_track.geometry;
                        var track_extent = kalman_track_geometry.getExtent();


                        for (var i=0; i < exact_extents.length; i++) {
                            var exact_extent = exact_extents[i];
                            var collision = ol.extent.getIntersection(exact_extent, track_extent);
                            if (collision) {
                                console.log("Collision!");
                            }
                        }
                    }
                    // *****************************************************************************


                    // Check if current centroid has already been auto-classed
                    // ------------------------------------------------------------
                    if (point_target_id in this.AR_centroids) {
                        continue;
                    }
                    // ------------------------------------------------------------

                    // Only check centroids for now (can check Kalman tracks later maybe)

                    // ------------------------------------------------------------
                    var current_centroid = this.point_targets[region_name][point_target_id].centroid;

                    // ------------------------------------------------------------

                    // Get centroid geometry and coordinates
                    // ------------------------------------------------------------
                    var centroid_geometry = current_centroid.geometry;
                    var centroid_coords = centroid_geometry.getCoordinates();
                    // ------------------------------------------------------------


                    //  ** Check if intersection occurs
                    // ----------------------------------
                    var intersection_occurs = ol.extent.containsXY(current_AR_extent, centroid_coords[0], centroid_coords[1]);
                    // ----------------------------------

                    // INTERSECTION OCCURS - Update data
                    if (intersection_occurs) {

                        // Update Intersecting Centorid/Track for AUTO RELEASE
                        this.intersectionOccurs(AR_key, AR_class, point_target_id, region_name);
                    }
                }
            }
        }
    },
    intersectionOccurs: function(AR_key, AR_class, point_target_id, region_name) {

        // Highlight the region a detection occurs in.
        // ------------------------------------------------
        this.highlightAR_region(AR_key);
        // ------------------------------------------------


        // Update the model classification
        // ==================================================================================================
        var new_classification = (AR_class === "Track") ? "Track" : "Ignore";

        // Update model object with classification and classification type
        // ------------------------------------------------------------------------------------
        this.model.updateTrackListObject(point_target_id, "classification", new_classification);
        this.model.updateTrackListObject(point_target_id, "classification_type", "auto");
        // ------------------------------------------------------------------------------------
        // ==================================================================================================


        // Initialize centroid into tracking list
        // ------------------------------------------------
        this.AR_centroids[point_target_id] = {classification : new_classification};
        // ------------------------------------------------



        // Update TRACK LIST STYLES
        // ========================================================================
        var track_li = d3.select("#"+region_name + "_" + point_target_id + "_li");

        var classification_form_select = track_li.select("select");

        // Update box text
        // ----------------------

        // classification_form_select.selectedIndex = 2;
        // Update the value associated with the box
        //     .property
        // classification_form_select.value = "Track";
        var track_div = point_target_id + "_classification";
        var track_form = track_div + " form";
        var track_select = track_div + " select";
        $(track_select).val("Track");
        $(track_form).prop('selected', true);


        // ----------------------

        // clear current classes
        // ----------------------
        var exempt_classes = ["track_list_mouseover"];
        removeAllClasses(track_li, exempt_classes, true);
        // ----------------------

        // Set New class
        // ----------------------
        if (new_classification === "Track") {
            track_li.classed("track_list_track_AUTO", true);
        }
        else if (new_classification === "Ignore") {
            track_li.classed("track_list_ignore_AUTO", true);
        }
        // ----------------------
        // ========================================================================



        // Update styles on local-context object
        // ========================================================================
        // Layers
        // --------------------
        var centroid_layer = this.point_targets[region_name][point_target_id].centroid.layer;
        var track_layer = this.point_targets[region_name][point_target_id].kalman_track.layer;
        // --------------------

        // Initialize styles
        // --------------------
        var centroid_style = (AR_class === "Track") ? this.styles.centroid.selected_AUTO : this.styles.centroid.ignore_AUTO;
        var track_style = (AR_class === "Track") ? this.styles.kalman_track.selected_AUTO : this.styles.kalman_track.ignore_AUTO;
        // --------------------

        // Set styles
        // --------------------
        this.addStyle(centroid_layer, centroid_style);
        this.addStyle(track_layer, track_style);
        // --------------------
        // ========================================================================
    },
    generateARKey: function() {

        // Determine the new AR region id number
        // ------------------------------------------------
        var AR_region_id = Object.keys(this.AR_list[this.selected_AR_classification]).length;
        // ------------------------------------------------

        var new_AR_key = this.selected_AR_classification + "_AR_" + AR_region_id;


        // Ensure the key doesn't exist already
        // ------------------------------------------------
        if (new_AR_key in this.AR_list[this.selected_AR_classification]) {
            // Initialize back to 0 (maybe AR_item_0 was deleted and is now free)
            AR_region_id = 0;

            // Loop until unused ID num found
            while (new_AR_key in this.AR_list[this.selected_AR_classification]) {
                AR_region_id++;
                new_AR_key = this.selected_AR_classification + "_AR_" + AR_region_id;
            }
        }
        // ------------------------------------------------

        return new_AR_key;
    },
    updateARList: function(new_AR_key) {

        // Set the new AR data
        // ------------------------------------------------
        // Create new object
        var new_AR_data = {
            layer : this.new_layer,
            source : this.new_source,
            drawing: this.active_AR_object,
            classification : this.selected_AR_classification
        };

        // Set it to list
        this.AR_list[this.selected_AR_classification][new_AR_key] = new_AR_data;
        // ------------------------------------------------


        // Update controller list
        // ------------------------------------------------
        this.updateARControllerList();
        // ------------------------------------------------


        // Refresh the Current Interaction
        // ---------------------------------------------------------
        // Remove current object
        this.map.removeInteraction(this.active_AR_object);

        // Add new one of same type
        this.createNewARObject();
        // ---------------------------------------------------------
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------


















// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          AUTO-RELEASE CONTROLS PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var ReleaseControlsPrototype = {
    initAutoReleaseDrawingControls: function() {
        var this_view = this;

        d3.select("#local_context_controls__auto_discrim_controls_container").remove();

        // Drawing Controls Container
        // ------------------------------------------------------------------------------------------
        var discrimination_stage_container = d3.select("#local_context_main_div").append("div").attr("id", "local_context_controls__auto_discrim_controls_container");

        // Container header label
        discrimination_stage_container.append("label").html("Auto-Release Marking");


        // Drawing Selection Form
        var draw_type_form = discrimination_stage_container.append("form")
            .attr("id", "local_context__auto_discrim_form")
            .attr("class", "form-inline");

        // Drawing Form select
        var draw_type_select = draw_type_form.append("select")
            .attr("id", "local_context__auto_release_draw_type")
            .on("change", function() {

                // Remove the Current Interaction
                this_view.map.removeInteraction(this_view.active_AR_object);

                // Add new interaction
                this_view.addInteraction();
            });

        // Add drawing options
        draw_type_select.selectAll("option")
            .data(this.AR_classifications).enter()
            .append("option")
            .attr("value", function(d) { return d; })
            .html(function(d) { return d; });

        // Initialize as invisible! Only bring about on stage 5 via pipeline
        discrimination_stage_container.style("opacity", 0.0);
        // ------------------------------------------------------------------------------------------



        // List of drawings
        // ==========================================================================================
        var AR_list_container = discrimination_stage_container.append("div").attr("id", "AR_list_container");

        // Track
        // ------------------------------------------------------------------------------------------
        var AR_list_auto_track_form = AR_list_container.append("form")
            .attr("id", "AR_list_auto_track_form")
            .attr("class", "form-inline");

        AR_list_auto_track_form.append("label").attr("id", "AR_auto_track_label").html("Track");

        // Track list
        var track_select_form = AR_list_auto_track_form.append("select")
            .attr("id", "AR_list_auto_track_select")
            .attr("class", "AR_list_auto_select")
            .on("change", function(d) {
                this_view.selectARfromList(this.value);


                // Remove all highlight classes from others
                // ----------------------------------------
                d3.selectAll(".AR_list_auto_select").classed("AR_region_select_ACTIVE", false);
                // ----------------------------------------

                // Class the currently selected option
                // ----------------------------------------
                if (d !== "---") {
                    d3.select(this).select("option").classed("AR_region_select_ACTIVE", true);
                }
                // ----------------------------------------

            });

        track_select_form.selectAll("option")
            .data(["---"]).enter()
            .append("option")
            .attr("value", function(d) {
                return d;
            })
            .html(function(d) {
                return d;
            });
        // ------------------------------------------------------------------------------------------



        // Ignore
        // ------------------------------------------------------------------------------------------
        var AR_list_ignore_form = AR_list_container.append("form")
            .attr("id", "AR_list_ignore_form")
            .attr("class", "form-inline");

        AR_list_ignore_form.append("label").attr("id", "AR_ignore_label").html("Ignore");

        // Ignore list
        var track_ignore_form = AR_list_ignore_form.append("select")
            .attr("id", "AR_list_ignore_select")
            .attr("class", "AR_list_auto_select")
            .on("change", function(d) {
                this_view.selectARfromList(this.value);

                // Remove all highlight classes from others
                // ----------------------------------------
                d3.selectAll(".AR_list_auto_select").classed("AR_region_select_ACTIVE", false);
                // ----------------------------------------

                // Class the currently selected option
                // ----------------------------------------
                if (d !== "---") {
                    d3.select(this).classed("AR_region_select_ACTIVE", true);
                }
                // ----------------------------------------

            });

        track_ignore_form.selectAll("option")
            .data(["---"]).enter()
            .append("option")
            .attr("value", function(d) {
                return d;
            })
            .html(function(d) {
                return d;
            });
        // ------------------------------------------------------------------------------------------
        // ==========================================================================================
    },
    updateARControllerList: function() {
        // UPDATE DISPLAYED LIST
        // =================================================================================
        // Set the list data
        // -----------------------------------
        var list_data = Object.keys(this.AR_list[this.selected_AR_classification]);
        // -----------------------------------

        // Determine which list to add to
        // -----------------------------------
        var form_id = (this.selected_AR_classification === "Ignore") ? "#AR_list_ignore_select" : "#AR_list_auto_track_select";
        // -----------------------------------

        // Update list data for none selection
        list_data.unshift("---");

        // Add new AR drawings
        // -----------------------------------
        var form_option = d3.select(form_id).selectAll("option")
            .data(list_data);

        // Remove old elements
        form_option.exit().remove();

        form_option.enter()
            .append("option")
            .attr("value", function(d) {
                return d;
            })
            .html(function(d) {
                return d;
            });
        // -----------------------------------
        // =================================================================================
    },
    showAutoReleaseControls: function() {
        d3.select("#local_context_controls__auto_discrim_controls_container").transition()
            .duration(500)
            .style("opacity", 1.0);
    },
    hideAutoReleaseControls: function() {
        d3.select("#local_context_controls__auto_discrim_controls_container").transition()
            .duration(400)
            .style("opacity", 0.0);
    },
    showTrackColorKey: function() {
        d3.select("#local_context_controls__color_key_container").transition()
            .duration(500)
            .style("opacity", 1.0);
    },
    hideTrackColorKey: function() {
        d3.select("#local_context_controls__color_key_container").transition()
            .duration(200)
            .style("opacity", 0.0);

        d3.select("#local_context_controls__color_key_container").style("height", 0);
    }
};


// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------




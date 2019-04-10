


// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          TRACK LIST PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var TrackListPrototype = {
    initTrackListOverlay: function() {
        // TODO: Correctly sort inactive and active tracks into respective UL's!

        d3.select("#track_list_div").remove();

        // Initialize main flag as false (user has to click on stage 4-5 to activate)
        this.DISPLAY_TRACK_LIST = true;

        // Initialize flag for track information container
        this.CURRENT_DISPLAY_TRACK_ID = null;

        // Initialize track container flags
        this.show_active_tracks = true;
        this.show_inactive_tracks = true;



        // Get region name
        var region_name = this.model.current_region_name;


        // CREATE LIST CONTAINER
        // --------------------------------------------------------------------
        var track_list_div = this.containers.tracks.append("div").attr("id", "track_list_div");


        // INITIALIZE HEADER
        // --------------------
        var track_list_header_div = track_list_div.append("div").attr("class", "track_list_header_div");
        track_list_header_div.append("h1")
            .attr("class", "track_list_header")
            .html(printName(region_name)+ " Tracks");
        // --------------------


        // INITIALIZE COLOR KEYS
        // --------------------
        this.initColorKey();


        // INITIALIZE TRACK LIST
        // --------------------------------------------------------------------
        var main_tracks_container = track_list_div.append("div").attr("id", "main_tracks_container");

        // Get track list from model
        var track_list = this.model.getTrackList(region_name);

        // Sort into active and inactive
        // --------------------------------------------------
        var sort_result = this.sortTracksActiveVsInactive(track_list);
        var active_track_list = sort_result.active;
        var inactive_track_list = sort_result.inactive;
        // --------------------------------------------------

        // **          ACTIVE TRACKS            **
        // ** --------------------------------- **
        this.initTrackContainer(main_tracks_container, active_track_list, "active");
        // ** --------------------------------- **



        // **        INACTIVE TRACKS            **
        // ** --------------------------------- **
        this.initTrackContainer(main_tracks_container, inactive_track_list, "inactive");
        // ** --------------------------------- **

    },
    initTrackContainer: function(main_tracks_container, track_list, track_activity) {

        d3.select("#main_"+track_activity+"_tracks_container").remove();


        var this_view = this;
        var region_name = this.model.current_region_name;

        var secondary_tracks_container = main_tracks_container.append("div").attr("id", "main_"+track_activity+"_tracks_container");


        //  TRACKS HEADER CONTAINER
        var track_main_header_container = secondary_tracks_container.append("div")
            .attr("class", "track_main_header_container")
            .attr("id", track_activity+"_track_main_header_container");

        //  tracks Header text
        track_main_header_container.append("div")
            .attr("id", track_activity+"_track_list_header")
            .append("h1")
            .html(function() {
                return (track_activity==="active") ? "Active Tracks" : "Inactive Tracks";
            });

        //  tracks Show / HIDE Buttons
        track_main_header_container.append("p")
            .attr("class", "show_"+track_activity+"_tracks_button")
            .html("Hide")
            .on("click", function() {
                this_view.onShowTrackContainer(track_activity, track_activity+"_track_list_container", "show_"+track_activity+"_tracks_button");
            });


        //  TRACK LIST CONTAINER
        var track_list_container = secondary_tracks_container.append("div").attr("id", track_activity+"_track_list_container");


        // Initialize list container (ul) for tracks
        // --------------------------------------------------------------------
        var track_list_ul = track_list_container.append("ul")
            .attr("id", track_activity+"_track_list_ul")
            .attr("class", "track_list_ul");

        var track_list_li = track_list_ul.selectAll("li")
            .data(track_list)
            .enter()
            .append("li")
            .attr("class", function(d) {

                var new_class;
                var classification = d.classification;

                if (d.active) {
                    if (classification === "Not Classified") {
                        new_class = "track_list_not_classified";
                    }
                    else if (classification === "Track") {
                        new_class = (d.classification_type === "manual") ? "track_list_track" : "track_list_track_AUTO";
                    }
                    else if (classification === "Ignore") {
                        new_class = (d.classification_type === "manual") ? "track_list_ignore" : "track_list_ignore_AUTO";
                    }
                }
                else {
                    if (classification === "Not Classified") {
                        new_class = "track_list_not_classified_INACTIVE";
                    }
                    else if (classification === "Track") {
                        new_class = (d.classification_type === "manual") ? "track_list_track_INACTIVE" : "track_list_track_AUTO_INACTIVE";
                    }
                    else if (classification === "Ignore") {
                        new_class = (d.classification_type === "manual") ? "track_list_ignore_INACTIVE" : "track_list_ignore_AUTO_INACTIVE";
                    }

                    // Add track_list_inactive class to all classes (base class for inactive)
                    new_class += " track_list_base_inactive";
                }

                // Add class to be able to access all these elements to remove style when clicking on show profile vis buttons
                new_class += " track_list_PROFILE_VIS_mutator_accesor";

                return new_class;
            })
            .attr("id", function(d) {
                return region_name + "_" + d.track_id + "_li";
            })
            .text(function (d) {
                var track_num = d.track_id.split("_");
                track_num = track_num[track_num.length-1];
                var inactive_text = (!d.active) ? " (inactive)" : "";
                return "Track " + track_num + inactive_text;
            });

        // Add event behavior
        if (track_activity === "active") {
            track_list_li
                .on("mouseover", function(d) {
                    this_view.trackHoverON(this, d);
                })
                .on("mouseout", function(d) {
                    this_view.trackHoverOFF(this, d);
                })
                .on("click", function(d) {
                    this_view.trackOnClick(track_activity, this, d);
                });
        }
        else {
            track_list_li
                .on("click", function(d) {
                    this_view.trackOnClick(track_activity, this, d);
                });
        }


        // Add div for classification selection
        this_view.setClassificationAndInfoSelectionDIV(track_list_li, region_name);


        // INITIALIZE HEIGHT OF  TRACKS CONTAINER
        var list_height = track_list_container.select("ul").node().getBoundingClientRect().height;
        track_list_container.style("height", list_height);
    },

    onShowTrackContainer: function(track_activity, track_list_container_id, clicked_button_id) {

        // Change color key flag
        var track_flag;
        if (track_activity === "active") {
            this.show_active_tracks = !this.show_active_tracks;
            track_flag = this.show_active_tracks;
        }
        else {
            this.show_inactive_tracks = !this.show_inactive_tracks;
            track_flag = this.show_inactive_tracks;
        }


        // Get the target div for rescaling
        var active_track_list_container = d3.select("#"+track_list_container_id);

        // Determine div height depending on show / hide
        var list_height = active_track_list_container.select("ul").node().getBoundingClientRect().height;
        var div_height = (track_flag) ? list_height : 0;

        // Set the height
        active_track_list_container.style("height", div_height);

        // Set the text for show/hide
        var hide_show_text = (track_flag) ? "hide" : "show";

        // Update hide/show
        d3.select("."+clicked_button_id).html(hide_show_text);

    },
    setClassificationAndInfoSelectionDIV: function(track_list_li, region_name) {

        var this_view = this;

        var default_classifications = [];
        var classification_options = ["Not Classified", "Track", "Ignore"];

        var classification_info_div = track_list_li.append("div")
            .attr("id", function(d) {
                return d.track_id+"_classification";
            })
            .attr("class", "track_classification_selection_and_info_div");

        // Add form to classification div
        // ------------------------------------------------------------
        var classification_div = classification_info_div.append("div").attr("class", "track_classification_div");

        var classification_form = classification_div.append("form")
            .text(function(d) {
                // use this space to setup default classifications
                default_classifications.push(d.classification);

                // Return nothing - no text required
                return "Release as: ";
            });

        // Add select to classification form
        var classification_select = classification_form.append("select");

        // Add event behavior to select form
        classification_select.on("change", function(d) {
            if (d.active) {
                this_view.trackChangeClassification(this, d, region_name);

            }
            else {
                d3.select(this).property("disabled", true);
            }
        });


        classification_select.each(function(d) {
            if (!d.active) {
                d3.select(this).property('disabled', true);
                d3.select(this).classed("form_select_disabled", true)
            }
        });


        // Add classification options to select
        var class_option_num = 0;

        // Add classification options
        classification_select.selectAll("option")
            .data(classification_options)
            .enter()
            .append("option").attr("value", function(e) {
            return e;
        })
            .property("selected", function(e) {
                return e === default_classifications[class_option_num];
            })
            .html(function(e) {
                class_option_num++;
                return e;
            });
        // ------------------------------------------------------------


        // Info Button
        // ------------------------------------------------------------
        var track_info_div = classification_info_div.append("div")
            .attr("class", "track_info_selection_div");

        track_info_div.append("input")
            .attr("class", "track_info_button")
            .attr("type", "button")
            .attr("value", "Show Info")
            .on("click", function(d) {
                var parent_div;
                // Check if current display track id is null
                if (this_view.CURRENT_DISPLAY_TRACK_ID === null) {
                    // Show track
                    this_view.showTrackProfile(d);

                    // Set current track display
                    this_view.CURRENT_DISPLAY_TRACK_ID = d.track_id;

                    // Change Display info button to "Hide Info"
                    d3.select(this).attr("value", "Hide Info");

                    // Update border color on button
                    d3.select(this).classed("track_list_SHOW_PROFILE_button", true);

                    // Update border color on parent
                    parent_div = d3.select(this.parentNode.parentNode.parentNode);
                    parent_div.classed("track_list_SHOW_PROFILE_li_container", true);

                    // SHOW uncertainty vis
                    d3.select("#main_uncertainty_container").transition().duration(750).style("visibility", "visible");
                }

                // Current clicked track is same as previous - Close it
                else if (this_view.CURRENT_DISPLAY_TRACK_ID === d.track_id) {

                    // Hide track display
                    this_view.hideTrackInfo();

                    // Reset current display track id
                    this_view.CURRENT_DISPLAY_TRACK_ID = null;

                    // Change Display info button back to "Show Info"
                    d3.select(this).attr("value", "Show Info");

                    // Update border color on button
                    d3.select(this).classed("track_list_SHOW_PROFILE_button", false);

                    // Update border color on parent
                    parent_div = d3.select(this.parentNode.parentNode.parentNode);
                    parent_div.classed("track_list_SHOW_PROFILE_li_container", false);

                    // HIDE uncertainty vis
                    d3.select("#main_uncertainty_container").transition().duration(750).style("visibility", "hidden");

                }
                // Next track is clicked
                else {
                    // Hide track display
                    this_view.showTrackProfile(d);

                    // Update display track id
                    this_view.CURRENT_DISPLAY_TRACK_ID = d.track_id;

                    // Reset all other buttons to 'show info'
                    d3.selectAll(".track_info_button").attr("value", "Show Info");

                    // Change Display info button to "Hide Info"
                    d3.select(this).attr("value", "Hide Info");

                    // Update border color on button
                    d3.selectAll(".track_info_button").classed("track_list_SHOW_PROFILE_button", false);
                    d3.select(this).classed("track_list_SHOW_PROFILE_button", true);

                    // Update border color on parent
                    parent_div = d3.select(this.parentNode.parentNode.parentNode);
                    // Remove all other parent classes
                    d3.selectAll(".track_list_SHOW_PROFILE_li_container").classed("track_list_SHOW_PROFILE_li_container", false);

                    // Apply color to this parent only
                    parent_div.classed("track_list_SHOW_PROFILE_li_container", true);
                }


                // ********************************************************************************************************
                // TODO: SET UNCERTAINY VIS
                // ********************************************************************************************************
                this_view.initUncertaintyVis(d.track_id);
                // ********************************************************************************************************
                // ******************************************************************************************************************
            });
        // ------------------------------------------------------------
    },


    // ********************************************************************************************************
    // TODO: SET UNCERTAINY VIS
    // ********************************************************************************************************
    initUncertaintyVis: function(track_id) {
        var point_target_info = this.point_targets[this.model.current_region_name][track_id];
        this.model.initUncertaintyVis(point_target_info, this.map, track_id);

        // Setup listener
        point_target_info.centroid.geometry.on('change', function() {
            var uncertainy_vis_track_id = this.model.uncertainty_vis_track_id;
            var track_data = this.point_targets[this.model.current_region_name][uncertainy_vis_track_id];
            this.model.updateUncertaintyVis(track_data, uncertainy_vis_track_id);
        }, this);
    },
    sortTracksActiveVsInactive: function(track_list) {

        var active_track_list = [];
        var inactive_track_list = [];
        track_list.forEach(function(track) {
            (track.active) ? active_track_list.push(track) : inactive_track_list.push(track);
        });

        return {active : active_track_list, inactive : inactive_track_list};
    },
    updateTrackListOverlay: function() {

        var this_view = this;
        var this_model = this.model;

        // Get region name
        var region_name = this.model.current_region_name;


        // Get track list from model
        // --------------------------------------------------
        var track_list = this.model.getTrackList(region_name);


        // Sort into active and inactive
        // --------------------------------------------------
        var sort_result = this.sortTracksActiveVsInactive(track_list);
        var inactive_track_list = sort_result.inactive;
        // --------------------------------------------------


        // HANDLE LI CHANGES OVER TO INACTIVE LIST
        // Ref: https://stackoverflow.com/questions/10781500/how-to-copy-option-from-one-select-to-another
        // ======================================================================================================
        inactive_track_list.forEach(function(inactive_track) {

            // Check if track already moved
            var track_already_moved = this_model.checkTrackInfo(inactive_track.track_id, "moved_to_inactive");
            if (track_already_moved) {
                return;
            }

            // STORE TRACK INTO HISTORY
            // ------------------------------------------------
            this_model.storeTrackHistory(inactive_track);
            // ------------------------------------------------

            // Get track id
            // ------------------------------------------------
            var inactive_track_id = inactive_track.track_id;
            // ------------------------------------------------

            // Update model to show track already moved - no need to update list again (allows for first check above)
            // ----------------------------------------------------------------------------
            this_model.updateTrackListObject(inactive_track_id, "moved_to_inactive", true);
            // ----------------------------------------------------------------------------

            // show track list?
            // -----------------------
            this_view.showTrackList();
            // -----------------------
        });
        // ======================================================================================================
    },

    showTrackList: function() {

        this.DISPLAY_TRACK_LIST = true;

        var this_view = this;

        // Obtain CSS variables
        // ---------------------------------------------------------------------------------
        var body_style = window.getComputedStyle(document.body);
        var primary_view_width = body_style.getPropertyValue('--primary-view-width');
        var local_context_width = body_style.getPropertyValue("--local-context-width");
        var local_context_height = body_style.getPropertyValue("--local-context-height");
        // ---------------------------------------------------------------------------------


        // Calculate difference
        // --------------------------------------------------------
        var difference =  parseFloat(primary_view_width) - parseFloat(local_context_width);
        // --------------------------------------------------------


        // Expand primary view to fit track listing
        d3.select("#primary_view_div").style("width", primary_view_width);

        // Shift global context to account for expanding track listing
        var global_context_left = parseFloat(body_style.getPropertyValue("--global-context-left"));
        global_context_left += difference;
        global_context_left += "px";

        d3.select("#global_context_main_div").style("left", global_context_left);

        setTimeout(function() {
            this_view.initTrackListOverlay();
            // Expand Track Listing and turn visibility on
            d3.select("#track_listing_div").transition().duration(1000).style("opacity", 1.0);
            d3.select("#track_listing_div").style("height", local_context_height).style("visibility", "visible");

            // Show Track Color Key
            this_view.showTrackColorKey();
        }, 1100);
    },
    hideTrackList: function() {

        this.DISPLAY_TRACK_LIST = false;

        var this_view = this;
        // Get css variable values
        var body_style = window.getComputedStyle(document.body);
        var primary_view_width = body_style.getPropertyValue('--primary-view-width');
        var local_context_width = body_style.getPropertyValue("--local-context-width");

        // Collapse Track Listing and turn visibility off
        d3.select("#track_listing_div").transition().duration(1000).style("opacity", 0.0);

        setTimeout(function() {
            d3.select("#track_listing_div").style("visibility", "hidden").style("height", 0);

            // Collapse primary view back down to fit only local context view
            d3.select("#primary_view_div").style("width", local_context_width);

            // Shift global context to account for collapsing track listing
            var global_context_left = parseFloat(body_style.getPropertyValue("--global-context-left"));

            d3.select("#global_context_main_div").style("left", global_context_left);

            // Hide Track Color Key
            this_view.hideTrackColorKey();
        }, 1000);
    },
    trackChangeClassification: function(this_change, d, region_name) {

        var new_classification = this_change.value;

        // Update d classification
        d.classification = new_classification;

        // Update d classification type
        d.classification_type = 'manual';

        // Update model with new classification and classification type
        // ------------------------------------------------------------------------------------
        this.model.updateTrackListObject(d.track_id, "classification", new_classification);
        this.model.updateTrackListObject(d.track_id, "classification_type", 'manual');
        // ------------------------------------------------------------------------------------

        // Update LIST STYLES
        // ========================================================================
        var track_li = d3.select("#"+region_name + "_" + d.track_id + "_li");

        // clear current classes
        // ----------------------
        var exempt_classes = ["track_list_mouseover"];
        removeAllClasses(track_li, exempt_classes, true);


        // Set New class
        // ----------------------
        if (d.classification === "Track") {
            track_li.classed("track_list_track", true);
        }
        else if (d.classification === "Ignore") {
            track_li.classed("track_list_ignore", true);
        }
        else if (d.classification === "Not Classified") {
            track_li.classed("track_list_not_classified", true);
        }
        // ========================================================================


        // ------------------------------------------------------------------------
        // SET CONTEXT OBJECT STYLES
        // ------------------------------------------------------------------------
        // Layers
        var centroid_layer = this.point_targets[region_name][d.track_id].centroid.layer;
        var track_layer = this.point_targets[region_name][d.track_id].kalman_track.layer;

        var centroid_style;
        var track_style;
        if (d.classification === "Track") {
            centroid_style = this.styles.centroid.selected;
            track_style = this.styles.kalman_track.selected;
        }
        else if (d.classification === "Ignore") {
            centroid_style = this.styles.centroid.ignore;
            track_style = this.styles.kalman_track.ignore;
        }
        else if (d.classification === "Not Classified") {
            centroid_style = this.styles.centroid.not_classified;
            track_style = this.styles.kalman_track.not_classified;
        }

        // Set styles
        this.addStyle(centroid_layer, centroid_style);
        this.addStyle(track_layer, track_style);
        // --------
        // ------------------------------------------------------------------------
    },
    showTrackProfile: function(d) {
        // Use point target id (e.g., "point_target_0") to find profile and uncertainty info
        var track_id = d.track_id;

        // Initialize profile vis with new track
        AppController.CURRENT_REGION.profile_vis.switchTracks(track_id);

    },
    hideTrackInfo: function() {
        this.hideTrackProfile();
    },
    hideTrackProfile: function() {
        // Initialize profile vis with new track
        AppController.CURRENT_REGION.profile_vis.hide();
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------












// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          COLOR KEY PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var ColorKeyPrototype = {
    initColorKey: function() {

        // Initialize color key as hidden
        this.show_color_key = false;

        // Initialize this view
        var this_view = this;

        // Set the track keys
        var track_keys = ["Not Classified", "Track (Manual)", "Ignore (Manual)", "Track (Auto)", "Ignore (Auto)", "Hover / Selected"];

        d3.select('#local_context_controls__color_key_container').remove();
        // Setup main container div for color key on local context
        var main_color_key_container = d3.select("#local_context_main_div").append("div").attr("id", "local_context_controls__color_key_container");

        var button_container = main_color_key_container.append("div").attr("id", "local_context_controls__color_key_button_container");

        // Set the button
        // ------------------------------------------------
        button_container.append("input")
            .attr("id", "color_key_button")
            .attr("type", "button")
            .attr("value", "Color Key")
            .on("click", function() {
                this_view.colorKeyClick();
            });
        // ------------------------------------------------




        // Main div for color keys
        var main_track_color_key_div = main_color_key_container.append("div").attr("class", "main_track_color_key_div");

        // Color Keys List Container
        var color_keys_list_div = main_track_color_key_div.append("div").attr("class", "track_list_key_box_divs");

        // Setup divs for each track color key
        var track_color_key_div = color_keys_list_div.selectAll("div")
            .data(track_keys).enter()
            .append("div")
            .attr("class", "track_color_key_div");

        // Key color name
        track_color_key_div.append("p")
            .attr("class", "color_key_title")
            .html(function(d) {
                return d;
            });

        // Color key svg
        var color_key_svg = track_color_key_div.append("svg")
            .attr("class", "color_key_svg")
            .attr("height", 20)
            .attr("width", 20);

        // Color key rect
        color_key_svg.append("rect")
            .attr("height", 20)
            .attr("width", 20)
            .attr("class", function(d, i) {
                if (d === "Not Classified") {
                    return "key_not_classified key_box";
                }
                else if (d === "Track (Manual)") {
                    return "key_track key_box";
                }
                else if (d === "Ignore (Manual)") {
                    return "key_ignore key_box";
                }
                else if (d === "Track (Auto)") {
                    return "key_track_AUTO key_box";
                }
                else if (d === "Ignore (Auto)") {
                    return "key_ignore_AUTO key_box";
                }
                else if (d === "Hover / Selected") {
                    return "key_hover_select key_box";
                }
            })
            .style("stroke", "black");


        // Initialize as invisible! Only bring about on stage 5 via pipeline
        main_color_key_container.style("opacity", 0.0);
        // ------------------------------------------------------------------------------------------
    },
    colorKeyClick: function() {
        console.log("HERE!");
        // Change color key flag
        this.show_color_key = !this.show_color_key;

        // Get the target div for rescaling
        var track_list_key_box_divs = d3.select(".track_list_key_box_divs");

        // Determine div height depending on show / hide
        var div_height = (this.show_color_key) ? 50 : 0;

        // Set the height
        track_list_key_box_divs.style("height", div_height);
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
















// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          TRACK LIST EVENTS PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var TrackListEventsPrototype = {
    trackHoverON: function(this_hover, d) {
        var region_name = this.model.current_region_name;

        // If selected, don't change style
        if (d.selected) {
            return;
        }

        // Class the UL list TODO: NOT WORKING
        removeAllClasses(d3.select(this_hover));

        d3.select(this_hover).classed("track_list_mouseover", true);


        // ------------------------------------------------------------------------
        // SET CONTEXT OBJECT STYLES
        // ------------------------------------------------------------------------
        // Layers
        // --------
        var centroid_layer = this.point_targets[region_name][d.track_id].centroid.layer;
        var track_layer = this.point_targets[region_name][d.track_id].kalman_track.layer;

        // Initialize styles
        var centroid_style = this.styles.centroid.hoverON;
        var track_style = this.styles.kalman_track.hoverON;

        // Set styles
        this.addStyle(centroid_layer, centroid_style);
        this.addStyle(track_layer, track_style);
        // --------
        // ------------------------------------------------------------------------

    },
    trackHoverOFF: function(this_hover, d) {

        var region_name = this.model.current_region_name;

        // If selected, don't change style
        if (d.selected) {
            return;
        }


        // Reapply classification

        // ------------------------------------------------------------------------
        // SET CONTEXT OBJECT STYLES
        // ------------------------------------------------------------------------
        // Layers
        // --------
        var centroid_layer = this.point_targets[region_name][d.track_id].centroid.layer;
        var track_layer = this.point_targets[region_name][d.track_id].kalman_track.layer;

        var centroid_style;
        var track_style;
        var list_style;


        // Get track classification from model - auto-release classifications will not show up on d!
        // ----****--------****--------****--------****--------****--------****--------****----
        var track_classification = this.model.checkTrackInfo(d.track_id, 'classification');
        // ----****--------****--------****--------****--------****--------****--------****----


        if (track_classification === "Track") {
            centroid_style = (d.classification_type === "manual") ? this.styles.centroid.selected : this.styles.centroid.selected_AUTO;
            track_style = (d.classification_type === "manual") ? this.styles.kalman_track.selected : this.styles.kalman_track.selected_AUTO;
            list_style = (d.classification_type === "manual") ? "track_list_track" : "track_list_track_AUTO";
        }
        else if (track_classification === "Ignore") {
            centroid_style = (d.classification_type === "manual") ? this.styles.centroid.ignore : this.styles.centroid.ignore_AUTO;
            track_style = (d.classification_type === "manual") ? this.styles.kalman_track.ignore : this.styles.kalman_track.ignore_AUTO;
            list_style = (d.classification_type === "manual") ? "track_list_ignore" : "track_list_ignore_AUTO";
        }
        else if (track_classification === "Not Classified") {
            centroid_style = this.styles.centroid.not_classified;
            track_style = this.styles.kalman_track.not_classified;
            list_style = "track_list_not_classified";
        }

        // Set styles
        this.addStyle(centroid_layer, centroid_style);
        this.addStyle(track_layer, track_style);
        // --------
        // ------------------------------------------------------------------------

        // Class the UL list
        // ------------------------------------------------------------------------
        // Remove mouseover
        d3.select(this_hover).classed("track_list_mouseover", false);

        // Reapply previous style
        d3.select(this_hover).classed(list_style, true);
        // ------------------------------------------------------------------------
    },
    trackOnClick: function(track_activity, this_click, d) {

        var region_name = this.model.current_region_name;

        // IMPORTANT: Stops event propogation from children!
        if (d3.event.target !== this_click) {
            d3.event.stopPropagation();
            return;
        }


        // Switch selection state
        d.selected = !d.selected;

        // Update model object
        // ---------------------------------------------------------------
        this.model.updateTrackListObject(d.track_id, "selected", d.selected);
        // ---------------------------------------------------------------


        // Handle the ul list
        // ====================================================================================
        var classification_div;

        // Open Manual Release Section and determine its height
        // ------------------------------------------------------------------------
        // If the current track li is selected
        if (d.selected) {
            classification_div = d3.select("#"+d.track_id+"_classification");
            var form_height = classification_div.select("form").node().getBoundingClientRect().height;
            var track_info_height = classification_div.select("input").node().getBoundingClientRect().height;

            var div_height = form_height + track_info_height;

            classification_div.style("height", div_height);
        }
        else {
            d3.select("#"+d.track_id+"_classification").style("height", 0.0);
        }
        // ------------------------------------------------------------------------


        // Reset height of parent div
        // ------------------------------------------------------------------------
        // Determine div height depending on show / hide
        setTimeout(function() {
            var max_height = 340;
            var list_height = d3.select("#"+track_activity+"_track_list_ul").node().getBoundingClientRect().height;
            if (list_height > max_height) {
                // Set the height
                d3.select("#"+track_activity+"_track_list_container").style("height", max_height)
                    .style("overflow", "scroll");
            }
            else {
                // Set the height
                d3.select("#"+track_activity+"_track_list_container").style("height", list_height)
                    .style("overflow", "auto");
            }
        }, 1000);
        // ------------------------------------------------------------------------
        // ====================================================================================


        // ------------------------------------------------------------------------
        // SET CONTEXT OBJECT STYLES
        // ====================================================================================
        // Layers
        // --------------------------
        var centroid_layer = this.point_targets[region_name][d.track_id].centroid.layer;
        var track_layer = this.point_targets[region_name][d.track_id].kalman_track.layer;
        // --------------------------


        // Determine the styles
        // --------------------------
        var centroid_style;
        var track_style;
        if (d.selected) {
            centroid_style = this.styles.centroid.clicked;
            track_style = this.styles.kalman_track.clicked;
        }
        else {

            if (d.classification === "Track") {
                centroid_style = (d.classification_type === "manual") ? this.styles.centroid.selected : this.styles.centroid.selected_AUTO;
                track_style = (d.classification_type === "manual") ? this.styles.kalman_track.selected : this.styles.kalman_track.selected_AUTO;
            }
            else if (d.classification === "Ignore") {
                centroid_style = (d.classification_type === "manual") ? this.styles.centroid.ignore : this.styles.centroid.ignore_AUTO;
                track_style = (d.classification_type === "manual") ? this.styles.kalman_track.ignore : this.styles.kalman_track.ignore_AUTO;
            }
            else if (d.classification === "Not Classified") {
                centroid_style = this.styles.centroid.not_classified;
                track_style = this.styles.kalman_track.not_classified;
            }
        }
        // --------------------------

        // Set styles
        // --------------------------
        this.addStyle(centroid_layer, centroid_style);
        this.addStyle(track_layer, track_style);
        // --------------------------
        // ====================================================================================
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

"use strict";

var AppControllerConstructor = function(model, view) {
    this.model = model;
    this.view = view;

    // Declare variables used
    this.CURRENT_REGION = null;

    // Application objects
    this.global_context = null;
    this.local_context = null;
    this.pipeline = null;


    // TEMP
    // ** HOLDS LIST OF REGIONS ALREADY VISITED TO PREVENT REVISITING - reason "no new activity"
    this.VISITED_REGIONS = {};
    this.moused_over_regions = {};

    // Auto Initialize
    this.init();
};

AppControllerConstructor.prototype = {
    init: function() {

        // Init variables
        this.CURRENT_REGION = null;

        // Initialize control menu (along top of app: File, Edit, etc.)
        this.initControlMenu();

        // Initialize pipeline
        this.initPipeline();

        // Initialize Global Context
        this.initGlobalContextVis();

        // Add on-click listeners to Global Context for on-click region selection
        this.initGlobalContextListeners();
    },
    initGlobalContextListeners: function() {
        // Button Click
        this.global_context.addListener('singleclick', this.eventClick);

        // Mouseover
        this.global_context.addListener('pointermove', this.eventMouseover);
    },
    initLocalContext: function() {
        // Initialize Local context
        this.initLocalContextVis();
    },
    initScenario: function() {
        // Initialize the scenario on global context
        this.initScenario_AJAX();
    },
    initVoiceServer: function() {
        var voice_active = false;

        setInterval(function() {
            if (!voice_active) {
                AppController.VoiceListener(function(voice_response) {
                    console.log(voice_response);
                    voice_active = true;
                    if (voice_response["command"] == "bio" && !voice_active) {

                        var audio = document.getElementById("myAudio");
                        audio.play();

                        audio.onended = function() {
                            voice_active = false;
                        };
                    }
                });
            }
        }, 1500);
    },
    VoiceListener: function(voiceCallback) {
        $.ajax({
            url: "/get_voice_command",
            success: function (response) {
                voiceCallback(response);
            },
            fail: function(response) {
                voiceCallback({"command" : "FAIL"});
            }
        });
    },
    initScenario_AJAX: function() {

        // Initialize the spinner to indicate loading status
        spinner_1.spin(document.getElementById(SPINNER_DIV));

        var this_controller = this;
        $.ajax({
            url: "/initialize_scenario",
            success: function (response) {

                // Set global context params: tell it regions, regions' geospatial extents, etc.
                this_controller.global_context.initRegions(response.regions);

                // Store region properties (nFrames, nRows, nCols)
                this_controller.scenario_properties = response.properties;

                // Stop the loading spinner
                spinner_1.stop();
                spinnerDeconstruct();

            },
            fail: function (result) {
                alert("Fail to initialize scenario!");
            }
        });
    },
    initGlobalContextVis: function() {
        var global_context_model = new GlobalContextModelConstructor();
        var global_context_view = new GlobalContextViewConstructor(global_context_model);
        this.global_context = new GlobalContextControllerConstructor(global_context_model, global_context_view);
    },
    initLocalContextVis: function() {
        var local_context_model = new LocalContextModelConstructor(this.model.current_region_name);
        var local_context_view = new LocalContextViewConstructor(local_context_model);
        this.local_context = new LocalContextControllerConstructor(local_context_model, local_context_view);
    },
    initControlMenu: function() {
        var control_menu_model = new ControlMenuModelConstructor();
        var control_menu_view = new ControlMenuViewConstructor(control_menu_model);
        window.ControlMenu = new ControlMenuControllerConstructor(control_menu_model, control_menu_view);
    },
    initPipeline: function() {
        var pipeline_model = new PipelineModelConstructor();
        var pipeline_view = new PipelineViewConstructor(pipeline_model);
        this.pipeline =  new PipelineControllerConstructor(pipeline_model, pipeline_view);
    },
    eventDetector: function(event) {
        var global_map, feature, feature_name;

        global_map = AppController.global_context.getMap();
        try {
            feature = global_map.forEachFeatureAtPixel(event.pixel, function (feature) {
                return feature;
            });

            feature_name = feature.get("name");
        }
        catch(e) {
            // console.log("** Map Event Failure: No object found in event region...");
            return "NONE";
        }

        return {"feature" : feature, "name" : feature_name};
    },
    eventMouseover: function(event) {
        var eventResult = AppController.eventDetector(event);

        if (eventResult.name === "NONE") {
            return;
        }

        // If clicked feature is a region
        if (eventResult.name === "detection_region") {

            var region_name = eventResult.feature.get("region_name");

            // Click region event
            AppController.regionMouseover(region_name);
        }
    },
    regionMouseover: function(region_name) {

        if (region_name in this.moused_over_regions) {
            return;
        }

        this.moused_over_regions[region_name] = null;

        this.global_context.regionMouseover(region_name);

        (function(region_name, app_controller, global_context) {
            setTimeout(function() {
                global_context.regionMouseout(region_name);
                delete app_controller.moused_over_regions[region_name];
            }, 1100);
        })(region_name, this, this.global_context);
    },
    eventClick: function(event) {
        var eventResult = AppController.eventDetector(event);

        if (eventResult.name === "NONE") {
            return;
        }

        // If clicked feature is a region
        if (eventResult.name === "detection_region") {

            var region_name = eventResult.feature.get("region_name");

            // Click region event
            AppController.regionClick(region_name);
        }
    },
    regionClick: function(region_name) {
        // If region active, deactivate; else if region deactivated, activate.
        this.global_context.changeActivationStateOf(region_name);

        // Set name of current region (or set to null if region deselected)
        this.model.current_region_name = ( this.global_context.getActivationStateOf(region_name) ) ? region_name : null;

        // Update pipeline controller to set at stage 3 on switching
        this.pipeline.setToDefault();

        // New region! Create new view
        if (!(region_name in this.VISITED_REGIONS)) {

            // STYLE THE GLOBAL CONTEXT MARKERS
            // ------------------------------------------------------------------------------
            // Deselect all other regions
            this.global_context.view.deactivateOtherRegions(region_name);

            // Activate or deactivate, depending on previous state (change style of markers on global context)
            (this.global_context.view.map_layers.Regions[region_name].active) ? this.global_context.view.activateRegion(region_name) : this.global_context.view.deactivateRegion(region_name);
            // ------------------------------------------------------------------------------


            // Check if other regions are active - deactive them if they are
            for (var region_id in this.VISITED_REGIONS) {
                // Skip current region
                if (region_id === region_name) {
                    continue;
                }

                if (this.VISITED_REGIONS[region_id].current_vis) {

                    // Deactive if found
                    this.deactiveRegion(region_id);
                }
            }


            // UPDATE REGION VISIT HISTORY
            // -----------------------------------
            this.VISITED_REGIONS[region_name] = {
                visited     :   true,
                current_vis :   true
            };
            // -----------------------------------

            // CREATE NEW REGION
            // -----------------------------------------------------
            this.CURRENT_REGION = this.createNewRegion(region_name);
            // -----------------------------------------------------

            // Update the CACHE
            // --------------------------------------------------------
            this.model.REGION_CACHE[region_name] = this.CURRENT_REGION;
            // --------------------------------------------------------

        }
        else if (this.VISITED_REGIONS[region_name].current_vis) {

            // STYLE THE GLOBAL CONTEXT MARKERS
            // ------------------------------------------------------------------------------
            // Deselect all other regions
            this.global_context.view.deactivateOtherRegions(region_name);

            // Activate or deactivate, depending on previous state (change style of markers on global context)
            (this.global_context.view.map_layers.Regions[region_name].active) ? this.global_context.view.activateRegion(region_name) : this.global_context.view.deactivateRegion(region_name);
            // ------------------------------------------------------------------------------

            // Deactive region
            // ---------------------
            this.deactiveRegion(region_name);
            // ---------------------
        }
        else {
            alert("No new activity in this region.");
        }
    },
    deactiveRegion: function(region_name) {

        // Close region
        // Hide track list
        // -----------------------------------
        this.local_context.view.hideTrackList();
        // -----------------------------------

        // Hide AR interface, if open
        // -----------------------------------
        this.local_context.hideAutoReleaseControls();
        // -----------------------------------


        // Reset pipeline to stage 3
        // ----------------------------
        this.pipeline.setToDefault();
        // ----------------------------

        // Deactivate current region
        // ------------------------------
        this.CURRENT_REGION.deactivate();
        // ------------------------------


        // Clear map
        // ----------------------------------
        // this.local_context.view.map.setView();
        this.local_context.clearTarget();
        // ----------------------------------

        // Clear local context info overlay
        // ----------------------------------
        this.local_context.view.resetRegionNameMapOverlay();
        // ----------------------------------

        // Set to false to disallow reentry (TODO: fix later)
        // ---------------------------------------------------
        this.VISITED_REGIONS[region_name].current_vis = false;
        // ---------------------------------------------------
    },
    createNewRegion: function(region_name) {
        console.log("Initializing New Region...");
        // Create new region object and INITIALIZE STREAM
        return new RegionControllerConstructor(region_name, this.local_context, this.scenario_properties);
    },
    resetStream: function() {
        // Get region name
        var region_name = this.CURRENT_REGION.region_name;

        // Clear Local Context
        this.local_context.clearContext();

        // Reset Playback
        this.CURRENT_REGION.playback.reset();

        // Clear Region
        this.CURRENT_REGION = this.createNewRegion(region_name);
    }
};

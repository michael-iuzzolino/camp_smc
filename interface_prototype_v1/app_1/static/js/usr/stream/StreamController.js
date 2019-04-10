
var StreamControllerConstructor = function(model, view) {
    this.model = model;
    this.view = view;

    this.streamInterval = null;
    this.STREAM_ON = null;

    this.external_controllers = {};

};


StreamControllerConstructor.prototype = {
    init: function(scenario_properties) {

        // Set frame properties
        this.view.scenario_properties = scenario_properties;

        // Initialize the controls
        this.initControls();

        // Update progress bar to show first frame loaded
        this.view.updateProgressBar();
    },
    initExternalControllers: function(external_controllers) {
        // Setup external controllers (uncertainty_vis, kalman_filter, profiles)
        this.external_controllers = external_controllers;

        // Initialize the stream model with a link to this controller for updating visualizations later
        this.model.initControllers(external_controllers);

        // Initialize all controllers with current playback frame!
        // ----------------------------------------
        this.updateExternalControllers();
        // ----------------------------------------

        // ** Initialize external controllers with data **
        // -----------------------------------------------
        this.initializeControllersWithData();
        // -----------------------------------------------
    },
    updateExternalControllers: function() {
        for (var controller_id in this.external_controllers) {
            try {
                this.external_controllers[controller_id].updateStreamLoadFrame(this.model.load_frame);
            }
            catch(e) {
                // Controller may not be active yet
                // E.g., uncertainty ellipses and profiles are not instantiated until later
            }
        }
    },
    initializeControllersWithData: function() {
        this.external_controllers.satellite_vis.updateStreamData(this.model.data);
    },
    initOnClickRegion_AJAX: function(streamCallback) {
        var stream_model = this.model;

        $.ajax({
            url             :   "/initialize_region",
            method          :   'POST',
            contentType     :   'application/json',
            dataType        :   'json',
            data            :   JSON.stringify({"region_name" : stream_model.region_name}),
            success : function(result) {

                // Initialize the stream model with the ajax result
                stream_model.initData(result);

                return streamCallback("Success");
            },
            fail : function() {
                return streamCallback("Fail");
            }
        });
    },
    startStream: function() {
        var this_controller = this;
        var this_view = this.view;
        var this_model = this.model;

        // Set state of stream
        this.STREAM_ON = true;


        //          **** Start playback ****
        // ================================================
        this.external_controllers.playback.startPlayback();
        // ================================================


        // **** SET STREAM INTERVAL
        // ======================================================================
        this.streamInterval = setInterval(function() {

            this_model.streamingOn_AJAX(function(streamAJAXResult) {

                // Log info
                // console.log("Loading Stream Frame: " + this_model.load_frame);

                // ***   MAIN STREAM LOOP    ***
                // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
                // ----------------------------------------------------------------------------------------------------------------

                // END OF STREAM
                // ========================================================
                if (streamAJAXResult === "EoS") {
                    // Last progress bar update
                    this_view.updateProgressBar();

                    // Turn stream button off
                    this_view.styleStreamButton("ENDED");

                    // Set state of stream
                    // ------------------------
                    this_controller.STREAM_ON = false;
                    // ------------------------

                    // End Stream
                    clearInterval(this_controller.streamInterval);

                    console.log("End of Stream");
                }
                // ========================================================


                // STREAMING NEXT FRAME
                // ========================================================
                else if (streamAJAXResult === "Success") {

                    // Update stream controls to display current load status
                    // ------------------------
                    this_view.updateProgressBar();
                    // ------------------------

                    // Increment load frame
                    // ------------------------
                    this_model.load_frame++;
                    // ------------------------

                    // UPDATE ALL OBJECTS WITH NEW LOAD FRAME
                    // --------------------------------------------------------------
                    this_controller.updateExternalControllers();
                    // --------------------------------------------------------------
                }
                // ========================================================


                // ** STREAM FAILED **
                // ========================================================
                else {
                    // Set state of stream
                    // ------------------------
                    this_controller.STREAM_ON = false;
                    // ------------------------
                }
                // ========================================================
                // ----------------------------------------------------------------------------------------------------------------
                // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
            });
        }, this_model.SIMULATION_TIME);
        // ======================================================================



    },
    pauseStream: function() {

        // Is the stream on? If not, no need to pause - so return!
        // %%%%%%%%%%%%%%%%%%%%
        if (!this.STREAM_ON) {
            return;
        }
        // %%%%%%%%%%%%%%%%%%%%


        console.log("PAUSING STREAM!");

        // Turn OFF Stream
        // ------------------------
        this.turnOffStream();
        // ------------------------




        // Set the STREAMING... button text to PAUSED - and restyle it
        // --------------------------------
        this.view.styleStreamButton("PAUSED");
        // --------------------------------
    },
    turnOffStream: function() {
        // Flag the stream to OFF
        // ------------------------
        this.STREAM_ON = false;
        // ------------------------

        // Turn off stream! (clear the stream interval)
        // --------------------------------
        clearInterval(this.streamInterval);
        // --------------------------------
    },
    resetStream: function() {
        console.log("Reset stream!");

        // Turn OFF Stream
        // ------------------------
        this.turnOffStream();
        // ------------------------

        // Do hard stream reset from the app controller
        // --------------------------------
        AppController.resetStream();
        // --------------------------------
    },
    getStreamFrame: function() {
        return this.model.load_frame;
    }
};









// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//              STREAM CONTROLS PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var StreamControlsPrototype = {

    initControls: function() {
        // Initialize controls with this controller
        this.view.initControls(this);
    },
    showControls: function() {
        this.view.show();
    },
    hideControls: function() {
        this.view.hide();
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------







// COMBINE PROTOTYPES
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

// Add Stream Controls prototype to stream prototype
for (var streamControlObject in StreamControlsPrototype) {
    StreamControllerConstructor.prototype[streamControlObject] = StreamControlsPrototype[streamControlObject];
}

// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------



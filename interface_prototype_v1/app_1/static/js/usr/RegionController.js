var RegionControllerConstructor = function(region_name, local_context, scenario_properties) {
    this.region_name = region_name;
    this.local_context = local_context;
    this.scenario_properties = scenario_properties;


    this.stream = null;
    this.kalman_filter = null;
    this.playback = null;
    this.uncertainty_ellipses = null;
    this.satellite_vis = null;
    this.profile_vis = null;
    this.velocity_profile_vis = null;
    this.intensity_profile_vis = null;


    this.init();
};

RegionControllerConstructor.prototype = {
    init: function() {

        // Create KALMAN FILTER and STREAM FIRST
        // -- Need info from these AJAX objects to create all other objects
        // ------------------------------
        this.createKalmanFilterObject();
        this.createStreamObject();
        // ------------------------------


        // Begin stream by calling Stream AJAX followed by Kalman AJAX once each - just to initialize
        // If successful, streamInitialized__loadRegion is called.
        this.beginStream_AJAX();
    },
    streamInitialized__loadRegion: function() {
        // ***************************************** //
        // **** beginStream_AJAX was succesful! **** //
        // ***************************************** //

        // Init Stream with scenario properties (nFrames, nRows, nCols, etc.)
        // ---------------------------------------
        this.stream.init(this.scenario_properties);
        // ---------------------------------------

        // Create Playback Object
        // ---------------------------------------
        this.createPlaybackObject();                    // creates this.playback
        // ---------------------------------------


        // Create Satellite Object
        // ---------------------------------------
        this.createSatelliteVisObject();                // creates this.satellite_vis
        // ---------------------------------------


        // Initialize Uncertainty Vis (MAP) and SVGS
        // ---------------------------------------
        this.createUncertaintyVis();                    // creates this.uncertainty_vis
        // ---------------------------------------


        // Create PROFILE VIS Object
        // -----------------------------------------------------------------
        // Controllers to send to velocity and intensity profile models
        var ProfileVisControllers = {
            kalman_filter       :   this.kalman_filter,
            playback            :   this.playback,
            stream              :   this.stream
        };

        this.createProfileVisObject(ProfileVisControllers);
        // -----------------------------------------------------------------




        // Initialize Playback Controllers
        // ---------------------------------------------------------
        var PlaybackControllers = {
            kalman_filter           : this.kalman_filter,
            profile_vis             : this.profile_vis,
            local_context           : this.local_context,
            satellite_vis           : this.satellite_vis
        };

        // Init controllers and set current playback frame into all controllers
        this.playback.initExternalControllers(PlaybackControllers);
        // ---------------------------------------------------------


        // Initialize Stream Controllers
        // ------------------------------------------------------
        var StreamControllers = {
            kalman_filter           : this.kalman_filter,
            profile_vis             : this.profile_vis,
            local_context           : this.local_context,
            satellite_vis           : this.satellite_vis,
            playback                : this.playback
        };

        // Init controllers and initialize satellite vis with init data from stream ajax
        this.stream.initExternalControllers(StreamControllers);
        // ------------------------------------------------------



        // Initialize Kalman Filter Controllers
        // ------------------------------------------------------
        var KalmanFilterControllers = {
            local_context           : this.local_context,
            profile_vis             : this.profile_vis,
        };

        // Init external controllers and initialize all controllers with init Kalman DATA!
        this.kalman_filter.initExternalControllers(KalmanFilterControllers);
        // ------------------------------------------------------



        // Initialize Local Context Controllers
        // ------------------------------------------------------
        var LocalContextControllers = {
            uncertainty_vis         : this.uncertainty_vis
        };

        // Init external controllers and initialize all controllers with init Kalman DATA!
        this.local_context.initExternalControllers(LocalContextControllers);
        // ------------------------------------------------------



        // Create new region on Local Context
        // ---------------------------------------------------
        // Initialize the local region as a layer on the local context map
        this.local_context.initNewRegion(this.region_name);
        // ---------------------------------------------------


        // Initialize the satellite image
        // ----------------------------
        this.satellite_vis.init();
        // ----------------------------


        // Reset pipeline to stage 3
        // -----------------------------------
        AppController.pipeline.setToDefault();
        // -----------------------------------


        // ALL INIT STREAM FUNCTIONS HAVE FINISHED. Increment!
        this.stream.model.load_frame = 1;
    },
    updateVisualizations: function() {

        // UPDATE SATELLITE VIS
        // ---------------------------------------------------------------
        this.satellite_vis.drawFrame();
        // ---------------------------------------------------------------



        // UPDATE LOCAL CONTEXT
        // ---------------------------------------------------------------
        // Update models
        this.local_context.updateVisualizations();
        // ---------------------------------------------------------------


        // UPDATE TRACK LIST
        // ---------------------------------------------------------------
        this.local_context.updateTrackList();
        // ---------------------------------------------------------------
    },
    resetVisualizations: function() {
        // RESET SATELLITE VIS
        // ---------------------------------------------------------------
        this.satellite_vis.drawFrame();
        // ---------------------------------------------------------------



        // RESET LOCAL CONTEXT
        // ---------------------------------------------------------------
        // Update models
        this.local_context.updateVisualizations();
        // ---------------------------------------------------------------


        // RESET TRACK LIST
        // ---------------------------------------------------------------
        this.local_context.updateTrackList();
        // ---------------------------------------------------------------
    },
    deactivate: function() {
        console.log("Deactivating " + this.region_name + "...");

        // Hide Satellite
        // -----------------------
        this.satellite_vis.hide();
        // -----------------------


        // Hide profile vis
        // ------------------------------------
        this.profile_vis.hide();
        // ------------------------------------



        // Pause stream and hide stream controls
        this.stream.pauseStream();
        this.stream.hideControls();

        // Reset playback
        // this.playback.reset();


    },
    reset: function() {
        // Kill playback
        this.playback.reset();

        // Reset stream
        this.createStreamObject();

        // Reinitialize Region
        this.beginStream_AJAX();
    }
};











// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          OBJECT CREATOR PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var StreamObjectPrototype = {
    beginStream_AJAX: function() {
        // Set variables for access to this in ajax
        var this_controller = this;

        this.stream.initOnClickRegion_AJAX(function(streamAJAXResult) {
            (streamAJAXResult === "Success") ? this_controller.beginKalman_AJAX() : alert("ERROR: Stream AJAX Failed.");
        });
    },
    beginKalman_AJAX: function() {
        // Set variables for access to this in ajax
        var this_controller = this;

        // INITIALIZE Kalman
        this.kalman_filter.init_AJAX(function(kalmanAJAXResult) {
            (kalmanAJAXResult === "Success") ? this_controller.streamInitialized__loadRegion() : alert("ERROR: Kalman AJAX Failed.");
        });
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
















// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          OBJECT CREATOR PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var ObjectCreatorPrototype = {

    createKalmanFilterObject: function() {
        var kalman_filter_model = new KalmanModelConstructor(this.region_name);
        var kalman_filter_view = new KalmanViewConstructor(kalman_filter_model);
        this.kalman_filter = new KalmanControllerConstructor(kalman_filter_model, kalman_filter_view);
    },
    createStreamObject: function() {
        // Set current stream
        var stream_model = new StreamModelConstructor(this.region_name);
        var stream_view = new StreamViewConstructor(stream_model);
        this.stream = new StreamControllerConstructor(stream_model, stream_view);
    },
    createPlaybackObject: function() {
        var playback_model = new PlaybackModelConstructor();
        var playback_view = new PlaybackViewConstructor(playback_model);
        this.playback =  new PlaybackControllerConstructor(playback_model, playback_view);

        // Initialize controls after constructor completes
        this.playback.initControls();
    },
    createSatelliteVisObject: function() {
        var satellite_vis_model = new SatelliteModelConstructor(this.region_name);
        var satellite_vis_view = new SatelliteViewConstructor(satellite_vis_model);
        this.satellite_vis = new SatelliteControllerConstructor(satellite_vis_model, satellite_vis_view);
    },
    createProfileVisObject: function(controllers) {

        // Velocity Profile, MVC
        // --------------------------------------------------------------------------------
        var velocity_profile_vis_model = new VelocityProfileModelConstructor(controllers);
        var velocity_profile_vis_view = new VelocityProfileViewConstructor(velocity_profile_vis_model);
        this.velocity_profile_vis = new VelocityProfileControllerConstructor(velocity_profile_vis_model, velocity_profile_vis_view);
        // --------------------------------------------------------------------------------


        // Intensity Profile, MVC
        // --------------------------------------------------------------------------------
        var intensity_profile_vis_model = new IntensityProfileModelConstructor(controllers);
        var intensity_profile_vis_view = new IntensityProfileViewConstructor(intensity_profile_vis_model);
        this.intensity_profile_vis = new IntensityProfileControllerConstructor(intensity_profile_vis_model, intensity_profile_vis_view);
        // --------------------------------------------------------------------------------

        // Update controllers
        // --------------------------------------------------
        controllers.velocity = this.velocity_profile_vis;
        controllers.intensity = this.intensity_profile_vis;
        // --------------------------------------------------

        // Main Profile Container, MVC
        // --------------------------------------------------------------------------------
        var profile_vis_view = new ProfileViewConstructor();
        this.profile_vis = new ProfileControllerConstructor(profile_vis_view, controllers);
        // --------------------------------------------------------------------------------
    },
    createUncertaintyVis: function() {
        var uncertainty_vis_model = new UncertaintyVisModelConstructor();
        var uncertainty_vis_view = new UncertaintyVisViewConstructor(uncertainty_vis_model);
        this.uncertainty_vis = new UncertaintyVisControllerConstructor(uncertainty_vis_model, uncertainty_vis_view);
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------




// COMBINE PROTOTYPES
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

// Add from prototype to region controller prototype
for (var creatorObject in ObjectCreatorPrototype) {
    RegionControllerConstructor.prototype[creatorObject] = ObjectCreatorPrototype[creatorObject];
}

// Add from prototype to region controller prototype
for (var streamObject in StreamObjectPrototype) {
    RegionControllerConstructor.prototype[streamObject] = StreamObjectPrototype[streamObject];
}
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

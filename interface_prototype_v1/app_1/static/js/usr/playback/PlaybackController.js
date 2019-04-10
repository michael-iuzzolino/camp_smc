var PlaybackControllerConstructor = function(model, view) {
    this.model = model;
    this.view = view;
};


PlaybackControllerConstructor.prototype = {
    initControls: function() {

        // Set controller into model for playback
        this.model.initController(this);

        // Initialize view controls
        this.view.initControls();
    },
    initExternalControllers: function(controllers) {
        this.external_controllers = controllers;

        // Initialize all controllers with current playback frame!
        // ----------------------------------------
        this.updateExternalControllers();
        // ----------------------------------------
    },
    updateExternalControllers: function() {
        for (var controller in this.external_controllers) {
            this.external_controllers[controller].updatePlaybackFrame(this.model.current_playback_frame);
        }
    },
    startPlayback: function() {
        // Activate animation flag
        this.model.active = true;

        // Turn the playback on for the model and view
        this.model.playbackON();
        this.view.playbackON();
    },
    nextPlaybackFrame: function() {

        // ** DEBUGGING **
        // ----------------
        // console.log("Current Playback Frame: " + this.model.current_playback_frame);
        // ----------------


        // Bound the playback frame number at a max. If current playback is greater, return
        // ---------------------------------------------------------------------------------
        if (this.model.current_playback_frame >= this.model.current_stream_frame) {
            return;
        }
        // ---------------------------------------------------------------------------------

        // *** Update Visualizations
        // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
        // --------------------------------------------------------
        AppController.CURRENT_REGION.updateVisualizations();
        // --------------------------------------------------------
        // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$


        // Update Playback Slider
        // ----------------------
        this.view.updateSlider();
        // ----------------------


        // Increment current frame number
        // ---------------------------------
        this.model.current_playback_frame++;
        // ---------------------------------


        // TODO: Reset human observations
        // console.log(this.external_controllers.profile_vis);
        this.external_controllers.profile_vis.resetHumanObservations();


        // Update all controllers with current playback frame!
        // ----------------------------------------
        this.updateExternalControllers();
        // ----------------------------------------

    },
    clickUpdate: function() {
        // *** Update Visualizations
        // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
        // --------------------------------------------------------
        AppController.CURRENT_REGION.updateVisualizations();
        // --------------------------------------------------------
        // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$


        // Update Playback Slider
        // ----------------------
        this.view.updateSlider();
        // ----------------------

        // Update all controllers with current playback frame!
        // ----------------------------------------
        this.updateExternalControllers();
        // ----------------------------------------
    },
    reset: function() {
        // Reset playback model and view
        this.model.reset();
        this.view.reset();
    },
    updatePlaybackRate: function(new_rate) {
        this.model.updatePlaybackRate(new_rate);
    },
    getCurrentFrame: function() {
        return this.model.current_playback_frame;
    },
    setCurrentPlaybackFrame: function(new_frame_num){
        this.model.current_playback_frame = new_frame_num;
        this.clickUpdate();
    },
    isActive: function() {
        return this.model.active;
    },
    setRate: function(new_rate) {
        this.model.rate = new_rate;
    },
    getRate: function() {
        return this.model.rate;
    },
    pause: function() {
        this.model.pause();

        if (this.model.current_playback_frame > 0) {
            this.view.updatePlayButtonClick();
        }
    },
    updateStreamLoadFrame: function(current_load_frame_index) {
        this.model.current_stream_frame = current_load_frame_index;
    }
};
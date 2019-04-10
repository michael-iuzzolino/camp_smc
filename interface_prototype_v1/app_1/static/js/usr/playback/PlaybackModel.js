
var PlaybackModelConstructor = function() {
    this.rate = null;
    this.active = false;
    this.paused = false;
    this.interval = null;
    this.rate_params = {
        "min"       : 2,
        "max"       : 400,
        "default"   : 30,
        "stepsize"  : 2
    };

    this.frame_params = {
        "min"       : 0,
        "max"       : 1,
        "default"   : 0,
        "stepsize"  : 1
    };

    this.current_playback_frame = 0;
    this.controller = null;

    this.current_stream_frame = null;

    this.init();
};


PlaybackModelConstructor.prototype = {
    init: function() {
        this.rate = this.rate_params.default;
        this.current_playback_frame = 0;
        this.interval = null;
        this.active = false;
        this.PLAYBACK_RATE = (1000*60) / this.rate;
    },
    initController: function(controller) {
        this.controller = controller;
    },
    playbackON: function() {

        // Init variable for this controller for use in setInterval
        // ----------------------------
        var this_controller = this.controller;
        // ----------------------------


        // Clear previous animation interval
        // ----------------------------
        clearInterval(this.interval);
        // ----------------------------


        // ***  SET PLAYBACK INTERVAL ***
        // =============================================
        this.interval = setInterval(function() {

            // Necessary to keep animation paused
            // -----------------------------------------
            if (!this_controller.isActive()) { return; }
            // -----------------------------------------

            // Update playback if not paused
            // -----------------------------------------
            this_controller.nextPlaybackFrame();
            // -----------------------------------------

        }, this.PLAYBACK_RATE);
        // =============================================

    },
    updatePlaybackRate: function(new_rate) {

        // Set new rate
        // -------------------------
        this.PLAYBACK_RATE = (1000 * 60) / new_rate;
        // -------------------------


        // ** Reset playback interval
        // -------------------------
        this.playbackON();
        // -------------------------
    },
    pause: function() {

        // Flag playback OFF
        // -----------------
        this.active = false;
        // -----------------


        // Clear the playback interval
        // ---------------------------
        clearInterval(this.interval);
        // ---------------------------
    },
    reset: function() {

        // Flag playback OFF
        // -----------------
        this.active = false;
        // -----------------


        // Clear the playback interval
        // ---------------------------
        clearInterval(this.interval);
        // ---------------------------


        // Reset Current playback frame to 0
        // ---------------------------------------
        this.current_playback_frame = 0;
        // ---------------------------------------
    }
};


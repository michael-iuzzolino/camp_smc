
var KalmanModelConstructor = function(feature_name) {

    this.region_name = feature_name;

    // Stream and Playback Frames
    // --------------------------------
    this.current_stream_frame = null;
    this.current_playback_frame = null;
    // --------------------------------

    this.empty_key = window.EMPTY_KEY;

    this.init();

};

KalmanModelConstructor.prototype = {
    init: function() {
        this.raw_results = [];
        this.track_logging_history = {};


        this.track_id_history = {};
        this.tracks_data = {};
        this.velocity_data = {};
        this.intensity_data = {};
        this.centroids = {};
        this.ellipse_data = {};
    },
    setEmptyFrames: function(track_id) {
        // Empty centroids
        // ----------------------------------------
        this.centroids[track_id].lat.push(this.empty_key);
        this.centroids[track_id].lon.push(this.empty_key);
        // ----------------------------------------

        // Empty Tracks
        // ---------------------------------------------------------
        this.tracks_data[track_id].lat.push(this.empty_key);
        this.tracks_data[track_id].lon.push(this.empty_key);
        this.tracks_data[track_id].active = false;
        // ---------------------------------------------------------


        // Empty Uncertainty Ellipses
        // ---------------------------------------------------------
        this.ellipse_data[track_id].push(this.empty_key);
        // ---------------------------------------------------------


        // Empty Velocity Data
        // ---------------------------------------------
        this.velocity_data[track_id].vx.push(this.empty_key);
        this.velocity_data[track_id].vy.push(this.empty_key);
        this.velocity_data[track_id].v_mag.push(this.empty_key);
        this.velocity_data[track_id].v_angle.push(this.empty_key);

        // ---------------------------------------------


        // Empty Intensity Data
        // ----------------------------------------------------
        this.intensity_data[track_id].push(this.empty_key);
        // ----------------------------------------------------
    },
    initializeNewTrack: function(track_id) {

        // Update track id history list
        // ----------------------------------
        this.track_id_history[track_id] = true;
        // ----------------------------------

        // Create new track member for history (used for logging)
        // -----------------------------------------
        this.track_logging_history[track_id] = [];
        // -----------------------------------------

        // Initialize tracks data
        // --------------------------------
        this.tracks_data[track_id] = {
            lat         : [],
            lon         : [],
            active      : true,
            track_id    : track_id
        };
        // --------------------------------

        // Initialize new velocity data
        // --------------------------------
        this.velocity_data[track_id] = {
            vx : [],
            vy : [],
            v_mag : [],
            v_angle : []
        };
        // --------------------------------


        // Initialize new intensity data
        // --------------------------------
        this.intensity_data[track_id] = [];
        // --------------------------------


        // Initialize new centroids
        // --------------------------------
        this.centroids[track_id] = {
            lat : [],
            lon : []
        };
        // --------------------------------

        // Initialize ellipses
        // --------------------------------
        this.ellipse_data[track_id] = [];
        // --------------------------------
    },
    storeData: function(kalman_results) {

        // Store raw results
        // -----------------------------------
        this.raw_results.push(kalman_results);
        // -----------------------------------




        // Iterate through each track in current frame kalman result
        for (var track_id in kalman_results) {

            // Set the current track from kalman result
            // ----------------------------------------
            var track = kalman_results[track_id];
            // ----------------------------------------

            // Setup history logging for current frame
            // ****************************************
            var frame_i_logger = {
                centroids       :   null,
                tracks_data     :   null,
                ellipse_data    :   null,
                velocity_data   :   null,
                intensity_data  :   null
            };
            // ****************************************


            // ** IMPORTANT **
            // CHECK IF TRACK IS INACTIVE!
            // ====================================================
            if (!track.active) {
                this.setEmptyFrames(track_id);

                continue;
            }
            // ====================================================


            // Check if track already exists
            // ====================================================
            if (!(track_id in this.track_id_history)) {
                this.initializeNewTrack(track_id);
            }
            // ====================================================


            // Setup centroids
            // ---------------------------------------------
            this.centroids[track_id].lat.push(track.centroids[0]);
            this.centroids[track_id].lon.push(track.centroids[1]);
            // ---------------------------------------------


            // Setup Tracks
            // ---------------------------------------------
            this.tracks_data[track_id].lat.push(track.lat);
            this.tracks_data[track_id].lon.push(track.lon);
            // ---------------------------------------------



            // Setup Uncertainty Ellipses
            // ---------------------------------------------------------
            this.ellipse_data[track_id].push(track.ellipse_data.ellipses);
            // ---------------------------------------------------------


            // Setup Velocity Data
            // ---------------------------------------------
            this.velocity_data[track_id].vx.push(track.vx);
            this.velocity_data[track_id].vy.push(track.vy);
            this.velocity_data[track_id].v_mag.push(track.v_magnitude);
            this.velocity_data[track_id].v_angle.push(track.v_angle_deg);
            // ---------------------------------------------


            // Setup Intensity Data
            // ----------------------------------------------------
            this.intensity_data[track_id].push(track.intensity[0]);
            // ----------------------------------------------------



            // Update track logger
            // *******************************************************
            frame_i_logger.centroids = {
                lat : track.centroids[0],
                lon : track.centroids[1]
            };

            frame_i_logger.tracks_data = {
                lat : track.lat,
                lon : track.lon
            };

            frame_i_logger.ellipse_data = track.ellipse_data.ellipses;

            frame_i_logger.velocity_data = {
                vx : track.vx,
                vy : track.vy,
                v_mag : [],
                v_angle : []
            };

            frame_i_logger.intensity_data = track.intensity[0];


            this.track_logging_history[track_id].push(frame_i_logger);
            // *******************************************************
        }
    },
    getHistoryForTrack: function(track_id) {
        return this.track_logging_history[track_id];
    }
};
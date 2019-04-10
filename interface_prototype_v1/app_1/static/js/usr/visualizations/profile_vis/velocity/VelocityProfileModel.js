var VelocityProfileModelConstructor = function(external_controllers) {

    this.external_controllers = external_controllers;

    this.vx = {};
    this.vy = {};
    this.profile_type = "velocity";

    this.current_stream_frame = null;
    this.current_playback_frame = null;

    this.kalman_velocity_data = null;

    this.track_id = null;

    this.all_scales = {};

    // Current frame items
    this.vx = null;
    this.vy = null;
    this.scales = null;

    this.marker_vx = null;
    this.marker_vy = null;

    this.VALID_OUTPUT = {};
    this.INITIALIZED = false;
};


VelocityProfileModelConstructor.prototype = {
    KalmanAJAXDataUpdate: function(velocity_data) {

        // If not initialized, set current track id to first velocity data element
        if (!this.INITIALIZED) {
            // Flag as initialized!
            this.INITIALIZED = true;

            this.track_id = Object.keys(velocity_data)[0];

            for (var track_id in velocity_data) {
                this.VALID_OUTPUT[track_id] = {};
                this.VALID_OUTPUT[track_id].active = true;
            }
        }

        // Check data for empty
        this.checkDataForEmpty(velocity_data);

        // Set ALL Kalman Data
        this.kalman_velocity_data = velocity_data;

        // Update Scales
        this.updateScales();

        // Set current track data
        this.setSelectedTrackData();

        // Update playback marker
        this.playbackMarkerDataUpdate();

        // RETURN AND PASS TO INTENSITY
        return this.VALID_OUTPUT;
    },
    checkDataForEmpty: function(velocity_data) {

        for (var track_id in velocity_data) {
            var track_data = velocity_data[track_id];

            var last_element_index = track_data.vx.length - 1;
            var last_element = track_data.vx[last_element_index];

            if (last_element === EMPTY_KEY || (Math.abs(last_element) > 5000)) {
                this.VALID_OUTPUT[track_id].active = false;
            }
        }
    },
    is_active: function() {
        return this.VALID_OUTPUT[this.track_id].active;
    },
    valid_playback: function() {
        return (this.marker_vx !== EMPTY_KEY) ? true : false;
    },
    switchTrack: function(track_id) {
        // Set new track id
        this.track_id = track_id;

        // Update data for new track
        this.setSelectedTrackData();

        // Update playback marker
        this.playbackMarkerDataUpdate();
    },
    setSelectedTrackData: function() {

        // Set new vx, vy
        this.vx = this.kalman_velocity_data[this.track_id].vx;
        this.vy = this.kalman_velocity_data[this.track_id].vy;

        // Set new scales
        this.scales = this.all_scales[this.track_id];
    },
    playbackMarkerDataUpdate: function() {

        // Set current marker frame
        this.marker_frame = this.current_playback_frame;

        // Check if marker frame is not overextending data indices
        if (this.marker_frame >= this.vx.length) {
            while (this.marker_frame >= this.vx.length) {
                this.marker_frame--;
            }
        }

        // Set marker vx, vy
        this.marker_vx = this.vx[this.marker_frame];
        this.marker_vy = this.vy[this.marker_frame];
    },


    updateScales: function() {
        var group_height = 200;
        var group_width = 400;

        for (var track_id in this.kalman_velocity_data) {

            // Check if track id is currently active - if not, do not update scales
            if (!this.is_active()) {
                continue;
            }

            // Get full new data array
            var velocity_x_data = this.kalman_velocity_data[track_id].vx;
            var velocity_y_data = this.kalman_velocity_data[track_id].vy;

            // Concat data to find min/max
            var velocity_data = velocity_x_data.concat(velocity_y_data);

            // Find min/max of velocity data
            var min_velocity = d3.min(velocity_data);
            var max_velocity = d3.max(velocity_data);

            // Ensure min and max are different
            if (Math.abs(max_velocity - min_velocity) < 0.002) {
                min_velocity = min_velocity - 2;
                max_velocity = max_velocity + 2;
            }

            // Set x domain
            var x_extent_raw = velocity_x_data.length;

            var x_extent_offset = parseInt(velocity_x_data.length*0.55);
            var vx_extent = x_extent_raw + x_extent_offset;

            // Initialize Scales
            var xScale = d3.scaleLinear()
                .domain([0, vx_extent])
                .range([0, group_width]);

            var yScale = d3.scaleLinear()
                .domain([min_velocity, max_velocity*1.1])
                .range([group_height, 0]);

            var xScaleInverse = d3.scaleLinear()
                .domain([0, group_width])
                .range([0, vx_extent]);

            // Add scales to profile data
            this.all_scales[track_id] = {
                x           : xScale,
                y           : yScale,
                x_inverse   : xScaleInverse
            };
        }
    }
};





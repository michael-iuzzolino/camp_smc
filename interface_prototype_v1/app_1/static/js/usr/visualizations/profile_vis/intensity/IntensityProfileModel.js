var IntensityProfileModelConstructor = function(controllers) {

    this.external_controllers = controllers;

    this.intensity_data = [];
    this.profile_type = "intensity";

    this.current_stream_frame = null;
    this.current_playback_frame = null;

    this.kalman_intensity_data = null;

    this.track_id = null;

    this.all_scales = {};

    // Current frame items
    this.intensity_data = null;
    this.scales = null;

    this.intensity_marker = null;

    this.VALID_OUTPUT = {};
    this.INITIALIZED = false;
};


IntensityProfileModelConstructor.prototype = {

    KalmanAJAXDataUpdate: function(intensity_data, valid_output) {

        // Get valid output from velocity profile model
        this.VALID_OUTPUT = valid_output;

        // If not initialized, set current track id to first velocity data element
        if (!this.INITIALIZED) {
            // Flag as initialized!
            this.INITIALIZED = true;

            // Initialize track id as track_0
            this.track_id = Object.keys(intensity_data)[0];
        }

        // Set ALL Kalman Data
        this.kalman_intensity_data = intensity_data;

        // Update Scales
        this.updateScales();

        // Set current track data
        this.updateSelectedTrackData();

        // Update playback marker
        this.playbackMarkerDataUpdate();
    },
    switchTrack: function(track_id) {
        this.track_id = track_id;

        this.updateSelectedTrackData();

        this.playbackMarkerDataUpdate();
    },
    updateSelectedTrackData: function() {
        this.intensity_data = this.kalman_intensity_data[this.track_id];

        this.scales = this.all_scales[this.track_id];

    },
    is_active: function() {
        return this.VALID_OUTPUT[this.track_id].active;
    },
    valid_playback: function() {
        return (this.intensity_marker !== EMPTY_KEY) ? true : false;
    },
    playbackMarkerDataUpdate: function() {
        this.marker_frame = this.current_playback_frame;

        if (this.marker_frame >= this.intensity_data.length) {
            while (this.marker_frame >= this.intensity_data.length) {
                this.marker_frame--;
            }
        }

        this.intensity_marker = this.intensity_data[this.marker_frame];
    },
    updateScales: function() {
        var group_height = 200;
        var group_width = 400;

        for (var track_id in this.kalman_intensity_data) {

            // Check if track id is currently active - if not, do not update scales
            if (!this.is_active()) {
                continue;
            }

            // Get full new data array
            var intensity_data = this.kalman_intensity_data[track_id];


            // Find min/max of intensity data
            var min_intensity = d3.min(intensity_data);
            var max_intensity = d3.max(intensity_data);

            // Ensure min and max are different
            if (Math.abs(max_intensity - min_intensity) < 0.002) {
                min_intensity = min_intensity - 2;
                max_intensity = max_intensity + 2;
            }

            // Set x domain
            var x_extent_raw = intensity_data.length;

            var x_extent_offset = parseInt(intensity_data.length*0.55);
            var vx_extent = x_extent_raw + x_extent_offset;

            // Initialize Scales
            var xScale = d3.scaleLinear()
                .domain([0, vx_extent])
                .range([0, group_width]);

            var yScale = d3.scaleLinear()
                .domain([0, max_intensity + 4])
                // .domain([min_intensity, max_intensity])
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







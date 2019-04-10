var SatelliteModelConstructor = function(region_name) {
    this.data = [];
    this.frame_data = {
        shake_base          : null,
        noise               : null,
        pixel_bleed         : null,
        structured_noise    : null,
        shotgun_noise       : null,
        detections          : null
    };

    this.current_region = region_name;

    this.current_stream_frame = null;
    this.current_playback_frame = null;

};

SatelliteModelConstructor.prototype = {
    initData: function() {

        this.current_stream_frame = 0;
        this.current_playback_frame = 0;

        // Get DATA
        var initial_data = this.data[this.current_playback_frame];

        for (var data_layer in this.frame_data) {
            this.frame_data[data_layer] = initial_data[data_layer];
        }
    },
    setCurrentFrameData: function() {

        // Initialize Data for current frame
        var current_frame_data = this.data[this.current_playback_frame];

        // Initialize frame_data
        for (var data_layer in this.frame_data) {
            this.frame_data[data_layer] = current_frame_data[data_layer];
        }
    },
    updateStreamData: function(stream_data) {
        this.data = stream_data;
    }
};

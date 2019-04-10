var SatelliteControllerConstructor = function(model, view) {
    this.model = model;
    this.view = view;
};

SatelliteControllerConstructor.prototype = {
    init: function() {
        // Calculate initial data
        this.model.initData();

        // Draw the initial canvas
        this.on();

        // Hide it (pipeline stages will show / hide as necessary)
        this.hide();
    },
    on: function() {
        this.view.initCanvas();
    },
    drawFrame: function() {
        // Update the model
        this.model.setCurrentFrameData();

        // Draw the frame
        this.view.drawFrame();
    },
    show: function() {
        d3.select("#satellite_view_container_div").transition().duration(1000).delay(750)
            .style("opacity", 1.0).style("display", "inline");

        this.view.drawFrame();
    },
    hide: function() {
        d3.select("#satellite_view_container_div").transition().duration(500)
            .style("opacity", 0.0).style("display", "none");
    },
    updateStreamLoadFrame: function(current_load_frame_index) {
        this.model.current_stream_frame = current_load_frame_index;
    },
    updatePlaybackFrame: function(current_playback_frame) {
        this.model.current_playback_frame = current_playback_frame;
    },
    updateStreamData: function(stream_data) {
        this.model.updateStreamData(stream_data);
    }
};

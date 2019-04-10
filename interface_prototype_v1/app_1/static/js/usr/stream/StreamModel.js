

var StreamModelConstructor = function(region_name){
    this.region_name = region_name;

    this.load_frame = null;
    this.data = null;
    this.controller = null;
    this.scenario_properties = null;
    this.initialized = false;
    this.controllers = {};

    this.SIMULATION_TIME = window.SIM_TIME;
};


StreamModelConstructor.prototype = {
    initControllers: function(external_controllers) {
        this.external_controllers = external_controllers;
    },
    initData: function(result) {

        if (result !== undefined) {
            // Initialize data with first frame
            // -----------------------
            this.data = [result.data];
            // -----------------------

            // Set initialized as true
            // -----------------------
            this.initialized = true;
            // -----------------------
        }

        // Initialize load frame to 1 (frame 0 just loaded)
        this.load_frame = 0;
    },
    streamingOn_AJAX: function(streamCallback) {
        var this_model = this;

        $.ajax({
            url             :       '/get_next_frame',
            method          :       'POST',
            contentType     :       'application/json',
            dataType        :       'json',
            data            :       JSON.stringify({"load_frame_index": this.load_frame}),
            success: function (response) {

                // Check if end of data frames - END STREAM IF EoF
                // ----------------------------------------
                if (response.data === "EoF") return streamCallback("EoS");
                // ----------------------------------------

                // Store data to stream. Data includes all layers of the frame + lat/lon and intensity data.
                // ----------------------------------------
                this_model.storeStreamData(response.data);
                // ----------------------------------------

                // Update kalman filter
                // -------------------------------------------------
                this_model.updateKalman_AJAX(function(AJAXResult) { return streamCallback(AJAXResult); });
                // -------------------------------------------------
            },
            fail: function() { return streamCallback("Fail"); }
        });
    },
    updateKalman_AJAX: function(callBack) {
        var kalman_filter_controller = this.external_controllers.kalman_filter;

        // Update KalmanController
        kalman_filter_controller.update_AJAX(this.load_frame, function(KalmanAJAXResult) {
            return callBack(KalmanAJAXResult);
        });
    },
    storeStreamData: function(data) {
        this.data.push(data);

        this.updateControllerWithData();
    },
    updateControllerWithData: function() {
        // NOTE: Only the satellite vis uses stream data - I think...
        this.external_controllers.satellite_vis.updateStreamData(this.data);
    }
};






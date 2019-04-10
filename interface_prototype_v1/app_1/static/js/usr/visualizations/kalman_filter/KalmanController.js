var KalmanControllerConstructor = function(model, view) {
    this.model = model;
    this.view = view;

    this.external_controllers = [];
};

KalmanControllerConstructor.prototype = {
    initExternalControllers: function(external_controllers) {
        this.external_controllers = external_controllers;

        // Initialize data to external controllers
        this.updateExternalControllersData();
    },
    init_AJAX: function(initCallback) {
        var this_model = this.model;
        $.ajax({
            url: '/init_UKF',
            success: function (response) {

                // Store the initial result
                // ----------------------------
                this_model.storeData(response);
                // ----------------------------
                return initCallback("Success");
            },
            fail: function() { return initCallback("Fail"); }
        });
    },
    update_AJAX: function(current_stream_frame, updateCallback) {
        var this_controller = this;
        var this_model = this.model;
        $.ajax({
            url             :   '/update_UKF',
            method          :   'POST',
            contentType     :   'application/json',
            dataType        :   'json',
            data            :    JSON.stringify({"load_frame_index": current_stream_frame}),
            success: function (response) {

                // Store updated result
                // ---------------------------
                this_model.storeData(response);
                // ---------------------------


                // Send data to all respective external controllers
                // ------------------------------------
                this_controller.updateExternalControllersData();
                // ------------------------------------

                return updateCallback("Success");
            },
            fail: function() { return updateCallback("Fail"); }
        });
    },
    updateExternalControllersData: function() {

        // Update Local Context
        // ================================
        this.external_controllers.local_context.KalmanAJAXDataUpdate(this.model.tracks_data, this.model.centroids, this.model.ellipse_data, this.model.velocity_data);
        // ================================


        // Update Profile
        // ================================
        this.external_controllers.profile_vis.KalmanAJAXDataUpdate(this.model.velocity_data, this.model.intensity_data);
        // ================================
    },
    reset: function(callBack) {
        this.model.init();
        this.init_AJAX(function(KalmanAJAXResult) {
            return (KalmanAJAXResult === "Success") ? callBack("Success") : callBack("Fail");
        });

        // TODO: REINITIALIZE DATA ON ALL EXTERNAL CONTROLLERS
        // *************************************************

        // *************************************************
    },
    updateStreamLoadFrame: function(current_load_frame_index) {
        this.model.current_stream_frame = current_load_frame_index;
    },
    updatePlaybackFrame: function(current_playback_frame) {
        this.model.current_playback_frame = current_playback_frame;
    },
    getHistoryForTrack: function(track_id) {
        return this.model.getHistoryForTrack(track_id);
    }
};

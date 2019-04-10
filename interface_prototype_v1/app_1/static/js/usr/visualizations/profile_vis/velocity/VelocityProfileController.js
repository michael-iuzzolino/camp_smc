var VelocityProfileControllerConstructor = function(model, view) {
    this.model = model;
    this.view = view;

    this.profile_type = "velocity";

    // Fed automatically by playback object on update only
    // ------------------------------------
    this.current_playback_frame = null;
    // ------------------------------------
};




VelocityProfileControllerConstructor.prototype = {
    init: function(parent_svg, controller) {
        // Initialize view container and controller
        this.view.init(parent_svg, controller);
    },
    switchTracks: function(track_id) {

        this.model.switchTrack(track_id);

        this.view.updateProfiles();
    },
    update: function() {
        // Update views
        this.view.updateProfiles();
    }
};








// --------------------------------------------------------------------------------------------
// Update Objects
// --------------------------------------------------------------------------------------------
var UpdateObjects = {
    updateStreamLoadFrame: function(current_load_frame_index) {
        this.current_playback_frame = current_load_frame_index;
        this.model.current_stream_frame = current_load_frame_index;
    },
    updatePlaybackFrame: function(current_playback_frame) {
        this.model.current_playback_frame = current_playback_frame;
    },

    // ****** IMPORTANT UPDATE HAPPENS HERE *******
    // ********************************************************
    KalmanAJAXDataUpdate: function(velocity_data) {

        var valid_output = this.model.KalmanAJAXDataUpdate(velocity_data);

        // Initialize all views for tracks on first frame only
        if (!this.view.INITIALIZED) {
            this.view.initNewTrack();
        }

        // **** UPDATE ****
        // ************************
        this.view.updateProfiles();
        // ************************

        return valid_output;
    }
    // ********************************************************
};
// --------------------------------------------------------------------------------------------



// Join all objects
// --------------------------------------------------------------------------------------------
for (var updateObject in UpdateObjects) {
    VelocityProfileControllerConstructor.prototype[updateObject] = UpdateObjects[updateObject];
}
// --------------------------------------------------------------------------------------------
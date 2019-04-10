var ProfileControllerConstructor = function(view, controllers) {

    this.profile_view = view;
    this.external_controllers = controllers;

    this.controllers = {
        velocity    : controllers.velocity,
        intensity   : controllers.intensity
    };

    this.models = {
        velocity    : controllers.velocity.model,
        intensity   : controllers.intensity.model
    };

    this.views = {
        velocity    : controllers.velocity.view,
        intensity   : controllers.intensity.view
    };

    this.track_id = null;

    this.init();
};


ProfileControllerConstructor.prototype = {
    init: function() {

        // Get parent svg
        var parent_svg = this.profile_view.svg;

        // Init velocity and intensity controllers with parent svg
        // --------------------------------------------------------
        this.controllers.velocity.init(parent_svg, this);
        this.controllers.intensity.init(parent_svg, this);
        // --------------------------------------------------------
    },
    switchTracks: function(track_id) {
        // Set Track ID
        // -----------------------
        this.track_id = track_id;
        // -----------------------

        // Initialize controllers with new track
        // -------------------------------------------------
        this.controllers.velocity.switchTracks(track_id);
        this.controllers.intensity.switchTracks(track_id);
        // -------------------------------------------------

        // Init track header
        // ---------------------------------------------
        this.profile_view.initTrackTitle(this.track_id);
        // ---------------------------------------------

        // Probability Vis
        // -----------------------------------------------------
        this.profile_view.visualizeProbabilities(this.track_id, init=true);
        // -----------------------------------------------------

        // Init Show me more of X button
        // ---------------------------------------------
        this.profile_view.initShowMoreButton(this.track_id);
        // ---------------------------------------------

        // Make sure profiles are showing
        this.show();
    },
    update: function() {

        // Update velocity controller
        this.controllers.velocity.update();

        // Update intensity controller
        this.controllers.intensity.update();

        // Fixes issue with mouse remaining still over plot when updates
        this.markerMouseout();
    },
    show: function() {
        this.profile_view.show();
    },
    hide: function() {
        this.profile_view.hide();
    },
    updateStreamLoadFrame: function(current_load_frame_index) {
        this.controllers.velocity.updateStreamLoadFrame(current_load_frame_index);
        this.controllers.intensity.updateStreamLoadFrame(current_load_frame_index);
    },
    updatePlaybackFrame: function(current_playback_frame) {
        this.controllers.velocity.updatePlaybackFrame(current_playback_frame);
        this.controllers.intensity.updatePlaybackFrame(current_playback_frame);
    },
    KalmanAJAXDataUpdate: function(velocity_data, intensity_data) {
        this.removeMouseoverProfileMarks();
        var valid_output = this.controllers.velocity.KalmanAJAXDataUpdate(velocity_data);
        this.controllers.intensity.KalmanAJAXDataUpdate(intensity_data, valid_output);

        // Probability Vis
        // -----------------------------------------------------
        try {
            this.profile_view.visualizeProbabilities(this.track_id);
        }
        catch (e) {
            console.log(e);
        }
        // -----------------------------------------------------
    }
};






// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          INTERACTION PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var InteractionPrototype = {
    markerMouseClick: function(click_event, click_model, click_view) {

        // TODO: FIX THIS - PROBLEM: Going back messes up local context objects. Not sure where problem is exactly.
        // *************** DEBUGGING - JUST TURN OFF FOR NOW *****************
        // --------------------------------------------------------------------
        return;
        // --------------------------------------------------------------------
        // --------------------------------------------------------------------

        var current_track = click_model.track_id;
        var scales = click_model.all_scales[current_track];

        // Ensure click isn't beyond stream progress
        // --------------------------------------------------------------------
        var prospective_index = Math.round(scales.x_inverse(d3.mouse(click_event)[0]));
        var stream_frame = click_model.current_stream_frame;

        if (prospective_index > stream_frame) {
            return;
        }
        // --------------------------------------------------------------------

        // Remove previous mouseover mark
        this.removeMouseoverProfileMarks();

        // Update current playback frame
        this.external_controllers.playback.setCurrentPlaybackFrame(prospective_index);

        // Update profile
        this.update();
    },
    markerMouseout: function() {
        d3.select("#intensity_plot_mouseover_x_axis_mark").transition()
            .style("opacity", 0.0);

        d3.select("#velocity_plot_mouseover_x_axis_mark").transition()
            .style("opacity", 0.0);

        this.removeMouseoverProfileMarks();
    },
    markerMousemove: function(move_event, model, view) {

        var profile = model.profile_type;

        // Remove previous mouseover mark
        d3.selectAll("."+profile+"_plot_mouseover_profile_mark").remove();

        // Get prospective index
        var current_track = model.track_id;
        var scales = model.all_scales[current_track];

        var prospective_index = Math.round(scales.x_inverse(d3.mouse(move_event)[0]));

        // Update line on x-axis
        d3.select("#"+profile+"_plot_mouseover_x_axis_mark").style("opacity", 1.0)
            .attr("x1", scales.x(prospective_index))
            .attr("x2", scales.x(prospective_index));


        // Don't plot circles if mouseover area where there is no profile yet
        if (prospective_index >= model.current_stream_frame) {
            return;
        }

        // Circle on current vx profile
        var profiles = (profile === "intensity") ? {intensity: model.intensity_data} : {vx: model.vx, vy: model.vy};

        for (var v_key in profiles) {
            var display_active = (profile === "intensity") ? view.active_display : view.active_display[v_key];

            if (display_active) {
                var data = profiles[v_key];

                d3.select("#" + profile + "_plot_g").append("circle")
                    .attr("class", "plot_mouseover_profile_mark")
                    .attr("cx", scales.x(prospective_index))
                    .attr("cy", function () {
                        return scales.y(data[prospective_index]);
                    })
                    .attr("r", 5);
            }
        }
    },
    removeMouseoverProfileMarks: function() {
        d3.selectAll(".plot_mouseover_profile_mark")
            .transition().duration(100).style("opacity", 0.0);

        setTimeout(function() {
            d3.selectAll(".plot_mouseover_profile_mark").remove();
        }, 150);
    },
    resetHumanObservations: function() {
        // this.profile_view.resetHumanObservations();
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------





// COMBINE PROTOTYPES
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

// Add Point Target Centroids Objects from prototype to local context prototype
for (var interactionObject in InteractionPrototype) {
    ProfileControllerConstructor.prototype[interactionObject] = InteractionPrototype[interactionObject];
}
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

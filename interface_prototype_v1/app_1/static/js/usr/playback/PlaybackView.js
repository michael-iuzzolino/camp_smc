var PlaybackViewConstructor = function(model) {
    this.divs = {};
    this.model = model;
    this.buttons = {
        play    : null,
        reset   : null
    };

    this.initDivs();
};


PlaybackViewConstructor.prototype = {
    initDivs: function() {

        // Remove Previous divs
        d3.select("#playback_controls_div").remove();

        // Add new divs section for playback
        this.divs.parent = d3.select("#controls_div");
        // this.divs.playback_controls = this.divs.parent.append("div")
        //     .attr("id", "playback_controls_div")
        //     .style("opacity", 1.0);

        this.divs.playback_controls = d3.select("#global_context_main_div").append("div")
            .attr("id", "playback_controls_div")
            .style("opacity", 0.0);

        // Add header
        this.divs.playback_controls.append("h1")
            .html("Playback")
            .style("position", "relative")
            .style("font-size", "24px");
    },
    initControls: function() {
        this.initPlaybackSliders();
        this.initPlaybackButtons();
    },
    initPlaybackSliders: function() {
        // Create sliders div
        this.divs.sliders = this.divs.playback_controls.append("div").attr("id", "playback_slider_div");

        // Create the slider for Frame
        createSlider(this.divs.sliders, this.model.frame_params, "playback_frame", "Frame");

        // Create the slider for Playback Rate
        // createSlider(this.divs.sliders, this.model.rate_params, "playback_rate", "Rate");

        this.updateSlider();
    },
    initPlaybackButtons: function() {


        // Declare new animation control div
        this.divs.buttons = this.divs.playback_controls.append("div").attr("id", "playback_buttons_div");

        // PLAY BUTTON
        // -------------------------------------------------------
        this.divs.buttons.append("input")
            .attr("id", "play_button")
            .attr("type", "button")
            .attr("value", "Play")
            .on("click", function() {
                // PAUSE: if playback is ACTIVATED
                if (AppController.CURRENT_REGION.playback.isActive()) {
                    AppController.CURRENT_REGION.playback.pause();
                }

                // START: if Playback NOT activated
                else {
                    AppController.CURRENT_REGION.playback.startPlayback();
                }
            });

        this.buttons.play = d3.select("#play_button");
        // -------------------------------------------------------


        // Init flag for reset button
        this.reset_button_added = false;

    },
    updateSlider: function() {
        var playback_view = this;

        var playback_frame_val = playback_view.model.current_playback_frame + 1;

        // Update slider Text
        d3.select("#playback_frame_slider_span").html(function() {
            return playback_frame_val;
        });

        // Update slider value
        d3.select("#playback_frame_slider").property("value", playback_frame_val);

        // Update slider max
        d3.select("#playback_frame_slider").property("max", this.model.current_stream_frame);

    },
    updatePlayButtonClick: function() {

        if (!this.model.active) {
            // Set PLAY button to RESUME
            this.buttons.play
                .style("border-color", "#66ff66")
                .style("background-opacity", 0.55)
                .style("background-color", "#ccffcc")
                .property("value", "Resume");
        }
        else {
            // Set PLAY Button to PAUSE
            this.buttons.play
                .style("border-color", "#ff0000")
                .style("background-opacity", 1.0)
                .style("background-color", "#ffcccc")
                .property("value", "Pause");
        }
    },
    playbackON: function() {

        // Change PLAY to Pause
        d3.select("#play_button")
            .property("value", "Pause")
            .style("border-color", "#ff0000")
            .style("background-opacity", 1.0)
            .style("background-color", "#ffcccc");

        // Determine if RESET button needs to be added
        // TODO: Hide reset button for demo
        // if (!this.reset_button_added) {
        //     // Add Reset Button
        //     this.divs.buttons.append("input")
        //         .attr("id", "reset_button")
        //         .attr("type", "button")
        //         .attr("value", "Reset")
        //         .on("click", function () {
        //             AppController.CURRENT_REGION.playback.reset();
        //         });
        //
        //     // Store reset button
        //     this.buttons.reset = d3.select("#reset_button");
        //     this.reset_button_added = true;
        // }
    },
    reset: function() {
        console.log("RESET VIEW!");
        // Try to remove reset button - but play might have never been pushed, so no reset button exists
        try {
            this.buttons.reset.remove();
        }
        catch(e) {}

        this.reset_button_added = false;

        this.updateSlider();

        // Reset play button to normal color
        this.buttons.play.style("border-color", "#bbb")
            .style("background-opacity", 1.0)
            .style("background-color", "#fff")
            .property("value", "Play");
    }
};

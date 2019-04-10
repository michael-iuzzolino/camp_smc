var PipelineControllerConstructor = function(model, view) {
    this.model = model;
    this.view = view;
    this.activateStages = [this.activateStage1, this.activateStage2, this.activateStage3, this.activateStage4, this.activateStage5];

    this.init();
};


PipelineControllerConstructor.prototype = {
    init: function() {
        this.view.init();

    },
    stageOnClick: function(clicked_stage_num) {
        var controller = AppController.pipeline;
        var model = controller.model;

        // Disallow if no image initialized
        try {
            if (!AppController.CURRENT_REGION.stream.model.initialized) {
                alert("Please initialize an image file before adjusting pipeline stages.");
                return;
            }
        }
        catch(e) {
            return;
        }

        if (model.current_stage === clicked_stage_num) {
            return;
        }

        // Update the view
        controller.updateView(clicked_stage_num);

        // Advance to new stage
        controller.activateStages[clicked_stage_num](model.prev_stage_index);

        // Set Current Model as Previous Stage for future clicks
        model.prev_stage_index = clicked_stage_num;

    },
    updateView: function(clicked_stage_num) {
        this.model.changeStage(clicked_stage_num);
        this.view.updateDisplay(clicked_stage_num);
        this.view.updateFilterDisplay(clicked_stage_num);
    },
    getCurrentFilterState: function() {
        return this.model.current_filter_state;
    },
    activateStage1: function() {

        // Recenter local context view
        AppController.local_context.loadRegionView();


        // Show SATELLITE VIS
        AppController.CURRENT_REGION.satellite_vis.show();

        // Hide KALMAN TRACKS
        AppController.local_context.hideKalmanTracks();


        // Hide LOCAL CONTEXT Auto- and Manual-Release Controls
        AppController.local_context.hideAutoReleaseControls();

        // TEMP TODO
        AppController.local_context.view.hideTrackList();
    },
    activateStage2: function() {


        // Recenter local context view
        AppController.local_context.loadRegionView();


        // Show SATELLITE VIS
        AppController.CURRENT_REGION.satellite_vis.show();

        // Hide KALMAN TRACKS
        AppController.local_context.hideKalmanTracks();


        // Hide LOCAL CONTEXT Auto- and Manual-Release Controls
        AppController.local_context.hideAutoReleaseControls();

        // TEMP TODO
        AppController.local_context.view.hideTrackList();
    },
    activateStage3: function(prev_stage_index) {
        // Hide SATELLITE VIS
        AppController.CURRENT_REGION.satellite_vis.hide();

        if (prev_stage_index === 0 || prev_stage_index === 1 || prev_stage_index === 2) {
            AppController.local_context.loadRegionView();
        }


        // Hide KALMAN TRACKS
        AppController.local_context.hideKalmanTracks();

        // Hide LOCAL CONTEXT Auto- and Manual-Release Controls
        AppController.local_context.hideAutoReleaseControls();

        // TEMP TODO
        AppController.local_context.view.hideTrackList();

    },
    activateStage4: function(prev_stage_index) {
        if (prev_stage_index === 0 || prev_stage_index === 1 || prev_stage_index === 2) {
            AppController.local_context.loadRegionView();
        }

        // Hide SATELLITE VIS
        AppController.CURRENT_REGION.satellite_vis.hide();


        // Show KALMAN TRACKS
        AppController.local_context.showKalmanTracks();

        // Hide LOCAL CONTEXT Auto-Release Controls
        AppController.local_context.hideAutoReleaseControls();

        // Hide track list
        AppController.local_context.view.hideTrackList();

    },
    activateStage5: function(prev_stage_index) {

        // Hide SATELLITE VIS
        AppController.CURRENT_REGION.satellite_vis.hide();

        if (prev_stage_index === 0 || prev_stage_index === 1) {
            AppController.local_context.loadRegionView();
        }

        // Show KALMAN TRACKS
        AppController.local_context.showKalmanTracks();


        // Show LOCAL CONTEXT Auto-Release Controls
        AppController.local_context.showAutoReleaseControls();

        // Show track list!
        AppController.local_context.view.showTrackList();
    },
    setToDefault: function() {
        this.updateView(this.model.default_stage);
    }
};
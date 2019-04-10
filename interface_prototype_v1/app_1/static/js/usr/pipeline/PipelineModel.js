var PipelineModelConstructor = function() {
    this.stages = {names : {"Stage 1" : "Flat Field",
                            "Stage 2" : "Background Suppression",
                            "Stage 3" : "Measurement Gen",
                            "Stage 4" : "Tracking",
                            "Stage 5" : "Discrimination"},
                    filter_states : {}};


    this.stages = {"Stage 1" : {name : "Flat Field",
                                filter_states : {}},

                    "Stage 2" : {name : "Background Suppression",
                        filter_states : {}},

                    "Stage 3" : {name : "Measurement Gen",
                        filter_states : {}},

                    "Stage 4" : {name : "Tracking",
                        filter_states : {}},

                    "Stage 5" : {name : "Discrimination",
                        filter_states : {}}
    };

    this.filter_ids = {};
    this.default_stage = 2;
    this.current_stage = null;
    this.prev_stage_index = null;
    this.current_filter_state = null;

    this.init();
};


PipelineModelConstructor.prototype = {
    init: function() {
        this.current_stage = this.default_stage;
        this.prev_stage_index = null;
        this.initFilters();
        this.initFilterStates();
    },
    initFilters: function() {

        this.filter_ids = {
            "Noise": "noise",
            "Pixel Bleed": "pixel_bleed",
            "Structured Noise": "structured_noise",
            "Shotgun Noise": "shotgun_noise",
            "Detections": "detections",
            "Tracking": "tracking"
        };
    },
    initFilterStates: function() {
        var stage_1_states = {
            "Noise": true,
            "Pixel Bleed": true,
            "Structured Noise": true,
            "Shotgun Noise": true,
            "Detections": false,
            "Tracking": false
        };

        var stage_2_states = {
            "Noise": true,
            "Pixel Bleed": true,
            "Structured Noise": false,
            "Shotgun Noise": true,
            "Detections": false,
            "Tracking": false
        };

        var stage_3_states = {
            "Noise": false,
            "Pixel Bleed": false,
            "Structured Noise": false,
            "Shotgun Noise": false,
            "Detections": true,
            "Tracking": false
        };

        var stage_4_states = {
            "Noise": false,
            "Pixel Bleed": false,
            "Structured Noise": false,
            "Shotgun Noise": false,
            "Detections": true,
            "Tracking": true
        };

        var stage_5_states = {
            "Noise": false,
            "Pixel Bleed": false,
            "Structured Noise": false,
            "Shotgun Noise": false,
            "Detections": true,
            "Tracking": true
        };

        this.stages["Stage 1"].filter_states = stage_1_states;
        this.stages["Stage 2"].filter_states = stage_2_states;
        this.stages["Stage 3"].filter_states = stage_3_states;
        this.stages["Stage 4"].filter_states = stage_4_states;
        this.stages["Stage 5"].filter_states = stage_5_states;

        // Set current filter states
        this.current_filter_state = stage_3_states;
    },
    changeStage: function(clicked_stage_num) {

        // Set Current Stage
        this.current_stage = clicked_stage_num;

        // Update stage name
        this.current_stage_name = Object.keys(this.stages)[clicked_stage_num];

        // Set current filter state
        this.current_filter_state = this.stages[this.current_stage_name].filter_states;
    }
};
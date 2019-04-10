var UncertaintyVisModelConstructor = function() {

    this.ellipse_data = null;
    this.velocity_data = null;
    this.current_playback_frame = null;
    this.target_info = null;

    this.scales = {};

    this.ellipse_parameters = {
        div_height : 700,
        div_width : 600,
        svg_height : 700,
        svg_width : 600,
        height  :   250,
        width   :   250,
        margin  :   {
            x : 40,
            y : 40
        }
    };

};


UncertaintyVisModelConstructor.prototype = {
    initView: function(view) {
        this.view = view;
    },
    updateData: function(init_data, init) {

        // Update data
        // --------------------------------------------------
        this.target_info = init_data.target_info;
        this.centroids = init_data.centroids;
        this.ellipse_data = init_data.ellipses;
        this.velocity_data = init_data.velocity;
        this.current_playback_frame = init_data.playback_frame;
        // --------------------------------------------------

        // Check if data has finished.
        // -----------------------------------------------------------------
        var successful = true;
        try {
            var test_access = this.ellipse_data[this.current_playback_frame];
        }
        catch(e) {
            successful = false;
        }
        // -----------------------------------------------------------------

        return successful;
    },
    initTargetOnMap: function(target_map) {

        // Check for previous layers on map - store them and remove
        // ------------------------------------------
        if (this.centroid_layer) {
            this.view.clearLayers();
        }
        // ------------------------------------------

        // Initialize CENTROID Coordaintes
        // ----------------------------------------------------------------------
        this.centroid_geometry = this.target_info.centroid.geometry;
        this.centroid_coordinates = this.centroid_geometry.getCoordinates();
        // ----------------------------------------------------------------------

        // Set initial MAP ZOOM
        // ------------------------------------------------
        this.map_zoom = target_map.getView().getZoom();
        // ------------------------------------------------

        // Initialize LAYERS
        // ----------------------------------------------------------------------
        this.centroid_layer = this.target_info.centroid.layer;
        this.kalman_track_layer = this.target_info.kalman_track.layer;
        // ----------------------------------------------------------------------
    },
    updateCoordinates: function() {
        // Get geometry from centroid
        // --------------------------
        this.centroid_geometry = this.target_info.centroid.geometry;
        // --------------------------

        // Get coords from geometry
        // --------------------------
        this.centroid_coordinates = this.centroid_geometry.getCoordinates();
        // --------------------------
    }
};











// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//              UNCERTAINTY ELLIPSES PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var EllipsesPrototye = {

    initEllipsesData: function() {
        // Initialize centroid lat, lon
        // ------------------------------------------------------------------------
        this.lat = this.centroids.lat[this.current_playback_frame];
        this.lon = this.centroids.lon[this.current_playback_frame];
        // ------------------------------------------------------------------------

        // Initialize Ellipse
        // ----------------------
        this.initEllipseScales();
        // ----------------------
    },
    updateEllipsesData: function() {

        // Initialize centroid lat, lon
        // ------------------------------------------------------------------------
        this.lat = this.centroids.lat[this.current_playback_frame];
        this.lon = this.centroids.lon[this.current_playback_frame];
        // ------------------------------------------------------------------------

        // Update the scales
        // ------------------------
        var success = this.updateEllipseScales();
        // ------------------------

        return success;
    }

};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------









// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//              SCALES PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var ScalesPrototype = {
    initEllipseScales: function() {

        // Init Parameters
        // =======================================================

        this.color_domain_key = [65, 80, 95, 99, 99.5, 99.9];

        this.color_ranges = {
            orange : [
                "#a63603",
                "#e6550d",
                "#fd8d3c",
                "#fdae6b",
                "#fdd0a2",
                "#feedde"
            ],
            purple: [
                "#54278f",
                "#756bb1",
                "#9e9ac8",
                "#bcbddc",
                "#dadaeb",
                "#f2f0f7"
            ],
            blue: [
                "#08519c",
                "#3182bd",
                "#6baed6",
                "#9ecae1",
                "#c6dbef",
                "#eff3ff"
            ],
            green: [
                "#006d2c",
                "#31a354",
                "#74c476",
                "#a1d99b",
                "#c7e9c0",
                "#edf8e9"
            ]
        };


        this.color_range_key = this.color_ranges.purple;


        this.class_id_key = {
            "99.9%" : "ninty_nine_nine",
            "99.5%" : "ninty_nine_five",
            "99%"   : "ninty_nine",
            "95%"   : "ninty_five",
            "80%"   : "eighty",
            "65%"   : "sixty_five"
        };
        // =======================================================

        // Initialize scales container for ellipses
        // -------------------------
        this.scales.ellipses = {};
        // -------------------------

        // Initialize ellipse bounds
        // -----------------------------------------------------
        var ellipse_bounds = this.ellipse_data[0]["99.9%"].bounds;
        // -----------------------------------------------------

        // Obtain bounds
        // ------------------------------
        var x_min = ellipse_bounds.x_min;
        var x_max = ellipse_bounds.x_max;
        var y_min = ellipse_bounds.y_min;
        var y_max = ellipse_bounds.y_max;
        // ------------------------------


        // Set x scale
        // --------------------------------------------------------------------------------
        this.scales.ellipses.lon = d3.scaleLinear()
            .domain([x_min, x_max])
            .range([this.ellipse_parameters.margin.x, this.ellipse_parameters.width - this.ellipse_parameters.margin.x]);
        // --------------------------------------------------------------------------------

        // Set y scale
        // --------------------------------------------------------------------------------
        this.scales.ellipses.lat = d3.scaleLinear()
            .domain([y_min, y_max])
            .range([this.ellipse_parameters.height - this.ellipse_parameters.margin.y, this.ellipse_parameters.margin.y]);
        // --------------------------------------------------------------------------------


        // Set Color scale
        // ---------------------------------
        this.scales.ellipses.color = d3.scaleLinear()
            .domain(this.color_domain_key)
            .range(this.color_range_key);
        // ---------------------------------
    },
    updateEllipseScales: function() {
        // Update ellipse bounds
        // ----------------------------------------------------
        try {
            var ellipse_bounds = this.ellipse_data[this.current_playback_frame]["99.9%"].bounds;
        }
        catch(e) {
            this.view.clearVisualizations();
            return false;
        }
        // ----------------------------------------------------

        // Obtain bounds
        // -------------------------------
        var x_min = ellipse_bounds.x_min;
        var x_max = ellipse_bounds.x_max;
        var y_min = ellipse_bounds.y_min;
        var y_max = ellipse_bounds.y_max;
        // -------------------------------

        // Update domains
        // ------------------------------------
        this.scales.ellipses.lon.domain([x_min, x_max]);
        this.scales.ellipses.lat.domain([y_min, y_max]);
        // ------------------------------------
        return true;
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------






















// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//              VELOCITY VECTOR PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var VelocityPrototye = {
    // REF: https://openlayers.org/en/latest/examples/line-arrows.html
    initVelocityVectorData: function() {

        // Initialize coords of line
        var init_lon = this.centroid_coordinates[0];
        var init_lat = this.centroid_coordinates[1];
        var final_lon = init_lon;
        var final_lat = init_lat;


        // init v_mag and v_angle for scaling and rotating geometry
        this.v_mag = this.velocity_data.v_mag[0];
        this.v_angles = [this.velocity_data.v_angle[0]];
        this.v_angle_delta = 0;

        // Setup anchor for rotation
        this.v_anchor = [init_lon, init_lat];

        // Setup points
        this.velocity_vector_list = [
            [init_lon, init_lat],
            [final_lon, final_lat]
        ];

        this.initVelocityScales();
    },
    updateVelocityVectorData: function() {
        this.v_mag = this.velocity_data.v_mag[this.current_playback_frame];
        this.v_angles.push(this.velocity_data.v_angle[this.current_playback_frame]);

        this.v_angle_delta = -1*Math.abs(this.v_angles[this.current_playback_frame] - this.v_angles[this.current_playback_frame-1]);


        // Setup anchor for rotation
        var current_lon = this.centroid_coordinates[0];
        var current_lat = this.centroid_coordinates[1];
        var final_lon = current_lon - 1000;
        var final_lat = current_lat;

        this.v_anchor = [current_lon, current_lat];


        // Setup points
        this.velocity_vector_list = [
            [current_lon, current_lat],
            [final_lon, final_lat]
        ];
    },
    initVelocityScales: function() {

        var max_radius = 200;
        var v_max = 500;

        var velocityScale = d3.scaleLinear()
            .domain([0, v_max])
            .range([5, max_radius]);

        this.scales.velocity = velocityScale;
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------






// COMBINE PROTOTYPES
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
for (var velocityObject in VelocityPrototye) {
    UncertaintyVisModelConstructor.prototype[velocityObject] = VelocityPrototye[velocityObject];
}

for (var ellipseObject in EllipsesPrototye) {
    UncertaintyVisModelConstructor.prototype[ellipseObject] = EllipsesPrototye[ellipseObject];
}

for (var scaleObject in ScalesPrototype) {
    UncertaintyVisModelConstructor.prototype[scaleObject] = ScalesPrototype[scaleObject];
}
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------





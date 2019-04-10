var LocalContextControllerConstructor = function(model, view) {
    this.model = model;
    this.view = view;

    this.init();

    this.external_controllers = null;
};

LocalContextControllerConstructor.prototype = {
    init: function () {
        // Initialize Map
        this.view.initMap();
    },
    initExternalControllers: function(external_controllers) {
        this.external_controllers = external_controllers;
        this.model.initExternalControllers(external_controllers);
    },
    updateVisualizations: function() {
        // Update models
        this.model.updatePointTargetCentroids();
        this.model.updatePointTargetKalmanTracks();

        // Check for collisions
        this.view.checkCollisions();

        // Update views
        this.view.updatePointTargetCentroids();
        this.view.updatePointTargetKalmanTracks();
    },
    KalmanAJAXDataUpdate: function(tracks_data, centroids_data, ellipse_data, velocity_data) {
        this.model.KalmanAJAXDataUpdate(tracks_data, centroids_data, ellipse_data, velocity_data);
    },
    initNewRegion: function (region_name) {

        // Initialize Object Position on Local Context and set scales
        this.model.updateMapForRegion(region_name);

        // Reinit target
        this.reinstateTarget();

        // Update Map
        this.view.initNewRegionView(this, region_name);

        // Initialize satellite context box
        this.view.initSatelliteContextBox();

        // Initialize onclick, zoom, move listeners
        this.addListeners();

        // Initialize local context visualizations (centroids, uncertainty ellipses, and kalman tracks)
        this.initLocalContextPointTargetVisualizations();

        // Initialize list of tracks
        // this.view.initTrackListOverlay();

        // Update context on global map
        this.updateContextOnGlobal();

        // Init region view
        this.show();
    },
    zoomToRegion: function (region_name) {
        // Initialize Object Position on Local Context and set scales
        this.model.updateMapForRegion(region_name);

        // Update Map
        this.view.loadRegionView(region_name);

        // Init region view
        this.show();
    },
    addListeners: function () {
        // Add zoom/scroll listener
        this.view.map.getView().on('change:resolution', this.updateContextOnGlobal);
        this.enableMapInteractions();
    },
    enableMapInteractions: function () {
        this.view.map.getView().on('change:resolution', this.updateContextOnGlobal);
        this.view.map.on('pointerdrag', this.updateContextOnGlobal);
        this.view.map.on('singleclick', this.eventClick);
    },
    disableMapInteractions: function () {
        this.view.map.getView().on('change:resolution', function () {});
        this.view.map.on('pointerdrag', function () {});
        this.view.map.on('singleclick', function () {});
    },
    updateContextOnGlobal: function () {

        var extent = AppController.local_context.view.map.getView().calculateExtent(AppController.local_context.view.map.getSize());

        AppController.global_context.view.updateLocalContextBox(extent);
    },
    // TODO: Break out into other prototypes below
    eventClick: function (event) {

        var new_fill, new_stroke, new_style;

        var this_view = AppController.local_context.view;

        var feature = this_view.map.forEachFeatureAtPixel(event.pixel, function (feature_n) {
            return feature_n;
        });

        // Check to see if clicked object has an event
        try {
            var feature_name = feature.get("name");
        }
        catch (e) {
            return;
        }

        if (feature_name === "point_target") {

            var selected_fill = this_view.point_target_settings.colors.fill.selected;
            var unselected_fill = this_view.point_target_settings.colors.fill.unselected;


            this_view.POINT_TARGET_SELECTED = !this_view.POINT_TARGET_SELECTED;
            var new_fill_color = (this_view.POINT_TARGET_SELECTED) ? selected_fill : unselected_fill;

            // Add styles
            // ---------------------------------------------------------------
            new_fill = new ol.style.Fill({
                color: new_fill_color
            });

            new_stroke = new ol.style.Stroke({
                color: this_view.point_target_settings.colors.stroke,
                width: 1
            });

            new_style = new ol.style.Style({
                image: new ol.style.Circle({
                    fill: new_fill,
                    stroke: new_stroke,
                    radius: 14
                }),
                fill: new_fill,
                stroke: new_stroke
            });

            // Set Style!
            this_view.map_layers.PointTargets.setStyle(new_style);
            // ---------------------------------------------------------------
        }

        else if (feature_name === "kalman_track_feature") {
            // Turn Kalman track ON/OFF
            this_view.DISPLAY_PROFILES = !this_view.DISPLAY_PROFILES;

            // Show / Hide Profile with kalman track click
            (this_view.DISPLAY_PROFILES) ? AppController.CURRENT_REGION.profile_vis.show() : AppController.CURRENT_REGION.profile_vis.hide();

            // Select / deselect TODO: fix this, probably
            (this_view.DISPLAY_PROFILES) ? this_view.selectKalmanTracks() : this_view.deselectKalmanTracks();
        }
    },
    loadRegionView: function () {
        this.view.loadRegionView();
    },
    show: function (change_stage=false) {
        // Show the display
        this.view.containers.main.transition().duration(1000).delay(750)
            .style("opacity", 1.0).attr("display", "inline");

        this.view.containers.map.transition().duration(1000).attr("display", "inline");

        this.view.containers.tracks.transition().duration(1000).attr("display", "inline");

        if (this.view.DISPLAY_TRACK_LIST && !change_stage) {
            this.view.showTrackList();
        }

        this.enableMapInteractions();
    },
    hide: function () {
        // Hide the display
        this.view.containers.main.transition().duration(1000)
            .style("opacity", 0.0).attr("display", "none");

        this.view.containers.map.transition().duration(1000).attr("display", "none");

        this.view.containers.tracks.transition().duration(1000).attr("display", "none");

        console.log("this.view.DISPLAY_TRACK_LIST: " + this.view.DISPLAY_TRACK_LIST);
        if (this.view.DISPLAY_TRACK_LIST) {
            this.view.hideTrackList();
        }

        this.disableMapInteractions();
    },
    showAutoReleaseControls: function() {
        this.view.showAutoReleaseControls();
    },
    hideAutoReleaseControls: function() {
        this.view.hideAutoReleaseControls();
    },
    showKalmanTracks: function () {
        this.view.showKalmanTracks();
    },
    hideKalmanTracks: function () {
        this.view.hideKalmanTracks();
    },
    resetKalmanTracks: function () {
        this.view.resetKalmanTracks();
        this.initPointTargetKalmanTracks();
        this.showKalmanTracks();
    },
    updateTrackList: function() {
        this.view.updateTrackListOverlay();
    },
    clearContext: function() {
        this.view.initDivs();
        this.view.initMap();
    },
    updateStreamLoadFrame: function(current_load_frame_index) {
        this.model.current_stream_frame = current_load_frame_index;
    },
    updatePlaybackFrame: function(current_playback_frame) {
        this.model.current_playback_frame = current_playback_frame;
    },
    clearTarget: function() {
        // https://github.com/openlayers/openlayers/issues/4817
        this.view.map.setTarget(null);
    },
    reinstateTarget: function() {
        this.view.map.setTarget("local_context_map_div");
    }
};








// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          Point Target Controllers PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var PointTargetControllersPrototype = {

    // INITIALIZATIONS
    // ---------------------------------------------------------------------------
    initLocalContextPointTargetVisualizations: function() {
        // Init point target centroids overlay
        this.initPointTargetCentroids();



        // Init point target kalman tracks
        this.initPointTargetKalmanTracks();
    },
    initPointTargetCentroids: function() {
        this.model.initPointTargetCentroids();
        this.view.initPointTargetCentroids();
    },
    initPointTargetKalmanTracks: function() {
        this.model.initPointTargetKalmanTracks();
        this.view.initPointTargetKalmanTracks();
    },
    // ---------------------------------------------------------------------------


    // RELOADS
    // ---------------------------------------------------------------------------
    reloadLocalContextPointTargetVisualizations: function() {
        // Init point target centroids overlay
        this.reloadPointTargetCentroids();

        // Init point target centroid uncertainty ellipses
        this.reloadPointTargetKalmanTracks();

    },
    reloadPointTargetCentroids: function() {
        this.model.initPointTargetCentroids();
    },
    reloadPointTargetKalmanTracks: function() {
        this.model.initPointTargetKalmanTracks();
    }
    // ---------------------------------------------------------------------------
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------


// COMBINE PROTOTYPES
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
// Add Detection Objects from prototype to local context prototype
for (var pointTargetObject in PointTargetControllersPrototype) {
    LocalContextControllerConstructor.prototype[pointTargetObject] = PointTargetControllersPrototype[pointTargetObject];
}
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
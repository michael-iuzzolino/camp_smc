var GlobalContextControllerConstructor = function(model, view) {
    this.model = model;
    this.view = view;

    this.init();
};

GlobalContextControllerConstructor.prototype = {
    init: function() {
        // Initialize model and views
        this.model.init();
        this.view.init();
    },
    initRegions: function(region_data) {
        // Initialize Object Position on Global Context
        this.model.initRegionGeospatialExtent(region_data);
        this.view.initRegionExtentAndMarkerOverlays();

        // Initialize a list of regions overlayed on the global context map
        this.view.initRegionListMapOverlay(region_data);

        // Initialize alert color key
        // this.view.initAlertKey();

        // Initialize the alerts
        this.view.initAlerts();
    },
    getMap: function() {
        return this.view.map;
    },
    addListener: function(event_type, event_function) {
        this.view.map.on(event_type, event_function);
    },
    changeActivationStateOf: function(region_name) {
        this.view.map_layers.Regions[region_name].active = !this.view.map_layers.Regions[region_name].active;
    },
    getActivationStateOf: function(region_name) {
        return this.view.map_layers.Regions[region_name].active;
    },
    regionMouseover: function(region_name) {
        this.view.mouseoverRegion(region_name);
    },
    regionMouseout: function(previous_region) {
        this.view.mouseoutRegion(previous_region);
    }
};
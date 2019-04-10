var GlobalContextModelConstructor = function() {
    this.regions = {};
};

GlobalContextModelConstructor.prototype = {
    init: function() {
    },
    initRegionGeospatialExtent: function(region_geospatial_extent) {
        for (var region_name in region_geospatial_extent) {
            this.regions[region_name] = region_geospatial_extent[region_name];
        }
    }
};
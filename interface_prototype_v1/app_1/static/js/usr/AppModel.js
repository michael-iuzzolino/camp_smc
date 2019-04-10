"use strict";

var AppModelConstructor = function() {
    // Declare variables
    this.REGION_CACHE = null;

    this.initCache();
};

AppModelConstructor.prototype = {
    initCache: function() {
        this.REGION_CACHE = {};
    },
    updateCache: function(new_region_name, new_region_obj) {
        this.REGION_CACHE[new_region_name] = new_region_obj;
    }
};
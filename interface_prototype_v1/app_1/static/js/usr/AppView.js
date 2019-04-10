"use strict";

var AppViewConstructor = function(model) {
    this.model = model;

    this.initDivs();
};

AppViewConstructor.prototype = {
    initDivs: function() {
        // CREATE: Main div
        var main_div = d3.select("body").append("div").attr("id", "main_div");

        // Init Header
        main_div.append("h1").attr("id", "main_title").html("CAMP-SMC");

        // CREATE: Controls div
        main_div.append("div").attr("id", "controls_div");

        // CREATE: primary div for sat/local context and tracks
        var primary_view = main_div.append("div").attr("id", "primary_view_div");

        // CREATE: div for satellite and local context
        primary_view.append("div").attr("id", "satellite_and_local_context_div");
    }
};


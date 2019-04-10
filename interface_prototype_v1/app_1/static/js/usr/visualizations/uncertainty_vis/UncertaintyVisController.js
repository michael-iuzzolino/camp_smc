var UncertaintyVisControllerConstructor = function(model, view) {
    this.model = model;
    this.view = view;

    this.init();
};


UncertaintyVisControllerConstructor.prototype = {
    init: function() {

        this.endOfData = false;

        this.view.initMap();
        this.model.initView(this.view);


    },
    initTargetOnMap: function(target_map, init_data) {
        // New target; reset flag
        this.endOfData = false;

        this.model.updateData(init_data);
        this.model.initTargetOnMap(target_map);
        this.model.initEllipsesData();


        this.view.initTargetOnMap();
        this.view.initEllipses();
    },
    updateMap: function(update_data) {
        // Check if model completely loaded - return if so
        // -----------------------------------
        if (this.endOfData) {
            return;
        }
        // -----------------------------------

        // Check for end of data
        var successful = this.model.updateData(update_data);

        if (!successful) {
            this.endOfData = true;

            // Shut down visualizations
            d3.select("#main_uncertainty_container").transition().duration(750).style("visibility", "hidden");
            this.view.clearVisualizations();
            return;
        }

        successful = this.model.updateEllipsesData();

        if (!successful) {
            this.endOfData = true;

            // Shut down visualizations
            d3.select("#main_uncertainty_container").transition().duration(750).style("visibility", "hidden");
            this.view.clearVisualizations();

            return;
        }

        this.model.updateCoordinates();


        this.view.updateTargetOnMap();
        this.view.updateEllipses();
    }
};
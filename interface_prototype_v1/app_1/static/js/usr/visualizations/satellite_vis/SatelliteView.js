var SatelliteViewConstructor = function(model) {
    this.model = model;

    this.config = {
        dimensions : {
            canvas : {
                height : 100,
                width  : 100
            },
            div : {
                height : 540,
                width  : 540
            },
            canvas_div : {
                height : 260,
                width  : 260
            }
        },
        hsv : {
            hue_1           : 255,
            hue_2           : 68,
            saturation_1    : 0,
            saturation_2    : 0,
            value_1         : 0.0,
            value_2         : 0.8
        },
        noise_amp : 1.0
    };

    this.div_ids = {
        parent          : "satellite_and_local_context_div",
        main_container  : "satellite_view_container_div",
        main            : "satellite_view_div",
        canvas          : "satellite_canvas_div"
    };

    this.containers = {
        parent          : null,
        main_container  : null,
        main            : null,
        canvas          : null
    };

    this.svg = null;
    this.satellite_canvas = null;

    this.init();

};

SatelliteViewConstructor.prototype = {
    init: function() {
        // Initialize divs
        this.initDivs();



        // Initialze canvas colors and scale
        this.initCanvasColorsAndScales();
    },
    initDivs: function() {

        // Clear previous divs
        d3.select("#"+this.div_ids.main_container).remove();

        // Init divs
        this.containers.parent = d3.select("#"+this.div_ids.parent);
        this.containers.main_container = this.containers.parent.append("div").attr("id", this.div_ids.main_container);
        this.containers.main = this.containers.main_container.append("div").attr("id", this.div_ids.main);
        this.containers.canvas = this.containers.main.append("div").attr("id", this.div_ids.canvas).style("opacity", 1.0);
    },
    initCanvasColorsAndScales: function() {
        var HSVinterpolateScale = d3.interpolateHsvLong(
            d3.hsv(this.config.hsv.hue_1, this.config.hsv.saturation_1, this.config.hsv.value_1),
            d3.hsv(this.config.hsv.hue_2, this.config.hsv.saturation_2, this.config.hsv.value_2)
        );

        var interpolateTerrain = function(t) { return (t <= 5) ? HSVinterpolateScale(t) : (255, 255, 255); };

        this.colorScale = d3.scaleSequential(interpolateTerrain).domain([0, 5]);
    },
    initCanvas: function() {

        // Create Canvas
        this.satellite_canvas = this.containers.canvas.append("canvas")
            .attr("id", this.model.current_region+"_canvas")
            .attr("width", this.config.dimensions.canvas.width)
            .attr("height", this.config.dimensions.canvas.height);


        // Draw first frame
        this.drawFrame();
    },
    drawFrame: function() {
        var current_pixel;
        var base_pixel, noise_pixel, bleed_pixel, struct_noise_pixel, shotgun_noise_pixel;
        var context, image;
        var noise_on, pixel_bleed_on, struct_noise_on, shotgun_noise_on;

        // Create Canvas CONTEXT
        context = this.satellite_canvas.node().getContext("2d");

        // Clear Canvas CONTEXT
        context.clearRect(0, 0, this.satellite_canvas.width, this.satellite_canvas.height);

        // Canvas IMAGE
        image = context.createImageData(this.config.dimensions.canvas.height, this.config.dimensions.canvas.width);


        // Get filter states
        // ----------------------------------------------------------------------------------------
        noise_on = AppController.pipeline.getCurrentFilterState()["Noise"];
        pixel_bleed_on = AppController.pipeline.getCurrentFilterState()["Pixel Bleed"];
        struct_noise_on = AppController.pipeline.getCurrentFilterState()["Structured Noise"];
        shotgun_noise_on = AppController.pipeline.getCurrentFilterState()["Shotgun Noise"];
        // ----------------------------------------------------------------------------------------


        // DRAW CANVAS
        for(var row_i = this.config.dimensions.canvas.height-1, layer_i = 0; row_i >= 0; row_i--) {
            for(var col_i = 0; col_i < this.config.dimensions.canvas.width ; col_i++, layer_i += 4) {
                // Get pixel values
                base_pixel = this.model.frame_data.shake_base[row_i][col_i];
                noise_pixel = (noise_on) ? this.model.frame_data.noise[row_i][col_i] * this.config.noise_amp : 0;
                bleed_pixel = (pixel_bleed_on) ? this.model.frame_data.pixel_bleed[row_i][col_i] : 0;
                struct_noise_pixel = (struct_noise_on) ? this.model.frame_data.structured_noise[row_i][col_i] : 0;
                shotgun_noise_pixel = (shotgun_noise_on) ? this.model.frame_data.shotgun_noise[row_i][col_i] : 0;

                // Generate current pixel
                current_pixel = base_pixel + noise_pixel + bleed_pixel + struct_noise_pixel + shotgun_noise_pixel;

                var c = d3.rgb(this.colorScale(current_pixel));
                image.data[layer_i] = c.r;
                image.data[layer_i + 1] = c.g;
                image.data[layer_i + 2] = c.b;
                image.data[layer_i + 3] = 255;
            }
        }

        // Place image data onto context
        context.putImageData(image, 0, 0);

        // IMPORANT: Resize the canvas!
        this.resizeCanvas();

    },
    resizeCanvas: function() {
        // Apply styles
        var current_region = AppController.CURRENT_REGION.region_name;
        if (current_region === "boulder") {
            d3.select("#"+this.div_ids.main).attr("class", "satellite_view_div_BOULDER");
            this.satellite_canvas.attr("class", "sat_canvas_div_BOULDER");
        }
        else if (current_region === "israel") {
            d3.select("#"+this.div_ids.main).attr("class", "satellite_view_div_ISRAEL");
            this.satellite_canvas.attr("class", "sat_canvas_div_ISRAEL");
        }
        else if (current_region === "north_korea") {
            d3.select("#"+this.div_ids.main).attr("class", "satellite_view_div_NK");
            this.satellite_canvas.attr("class", "sat_canvas_div_NK");
        }
    }
};

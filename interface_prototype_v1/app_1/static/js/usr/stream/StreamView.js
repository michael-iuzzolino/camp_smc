

var StreamViewConstructor = function(model) {
    this.model = model;
    this.controller = null;

    this.dimensions = {height : 20, width : 150, radius : 20 / 2};
    this.scale = null;
    this.colors = {default : "#00ff00", complete : "#e6fff7"};
    this.scenario_properties = null;

    this.initDivs();
};

StreamViewConstructor.prototype = {
    initDivs: function() {
        // Declare this model
        var this_model = this.model;

        // Remove previous control div
        d3.select("#"+this_model.region_name+"_stream_control_div").remove();

        // ADD: Stream Control Div
        // ---------------------
        // var stream_control_div = d3.select("#main_div").append("div")
        //     .attr("class", "stream_control_div")
        //     .attr("id", this_model.region_name+"_stream_control_div");

        var stream_control_div = d3.select("#global_context_main_div").append("div")
            .attr("class", "stream_control_div")
            .attr("id", this_model.region_name+"_stream_control_div");

        // Add header to div
        stream_control_div.append("h1")
            .attr("id", "stream_control_header")
            .html("Region Stream");


        // ADD: Progress Bar Div
        // ---------------------
        stream_control_div.append("div")
            .attr("class", "stream_progress_div")
            .attr("id", this_model.region_name+"_stream_progress_div");
    },
    initControls: function(controller) {
        this.controller = controller;

        // Add Progress Bar
        this.initStreamProgressBar();

        // Add stream buttons
        this.initStreamButtons();
    },
    hide: function() {
        d3.select("#"+this.model.region_name+"_stream_control_div").style("display", "none");
    },
    show: function() {
        d3.select("#"+this.model.region_name+"_stream_control_div").style("display", "inline");
    }
};




// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//              STREAM PROGRESS BAR PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var StreamButtonsPrototype = {
    initStreamButtons: function() {
        this.initStreamButton();
        // this.initPauseButton();
    },
    initStreamButton: function() {
        var this_controller = this.controller;
        var this_model = this.model;
        var this_view = this;

        d3.select("#"+this_model.region_name+"_stream_control_div").append("input")
            .attr("id", this_model.region_name+"_stream_button")
            .attr("class", "stream_button")
            .attr("type", "button")
            .attr("value", "Stream")
            .on("click", function() {

                // Prevents starting a 2nd stream
                if (this_controller.STREAM_ON) {
                    alert("Already Streaming!");
                    return;
                }

                // Stream button STYLE
                this_view.styleStreamButton("ON");

                // Start stream
                this_controller.startStream();
            });
    },
    initPauseButton: function() {
        var this_controller = this.controller;
        var this_view = this;
        var this_model = this.model;

        // ADD: Reset Scenario Button
        // -------------------
        d3.select("#"+this_model.region_name+"_stream_control_div").append("input")
            .attr("class", "clear_image_button")
            .attr("id", this_model.region_name+"_clear_image_button")
            .attr("type", "button")
            .attr("value", "Pause Stream")
            .on("click", function() {
                // Ensure tooltip is removed
                this_view.mouseoutTooltip();

                // Pause the stream
                this_controller.pauseStream();
            })
            .on("contextmenu", function() {

                // Ensure tooltip is removed
                this_view.mouseoutTooltip();


                // Reset the stream
                this_controller.resetStream();
            })
            .on("mouseover", function() {

                var reset_stream_tooltip = d3.select("body").append("div").attr("id", "reset_stream_tooltip");

                // Create svg for tooltop
                var mouseover_svg = reset_stream_tooltip.append("svg")
                    .attr("class", "mouseover_svg")
                    .attr("height", 50)
                    .attr("width", 200)
                    .style("opacity", 0.0)
                    .attr("transform", "translate(0,500)");

                // Add background for tooltip
                mouseover_svg.append('rect')
                    .attr("height", 50)
                    .attr("width", 200)
                    .attr("rx", 5)
                    .attr("ry", 5)
                    .style("fill", "#ccff99")
                    .style("stroke", 'black');

                // Add text to tooltip
                mouseover_svg.append("text")
                    .attr("x", 10)
                    .attr("y", 25)
                    .text("Right click to reset stream.");

                mouseover_svg.transition().duration(500)
                    .attr("transform", "translate(100,500)")
                    .style("opacity", 1.0);
            })
            .on("mouseout", this_view.mouseoutTooltip);
    },
    mouseoutTooltip: function() {

        d3.selectAll(".mouseover_svg").transition().duration(500)
            .attr("transform", "translate(0,500)")
            .style("opacity", 0.0);

        setTimeout(function() {
            d3.select("#reset_stream_tooltip").remove();
        }, 750);
    },
    styleStreamButton: function(status) {

        var this_view = this;
        var this_model = this.model;
        var this_controller = this.controller;

        var stream_button = d3.select("#"+this_model.region_name+"_stream_button");

        if (status === "ENDED") {
            stream_button.attr("value", "Stream Ended")
                .style("border-color", "#00ff00")
                .style("background-opacity", 1)
                .style("background-color", this_controller.view.colors.complete)
                .on("click", function () {
                    alert("Stream Ended");
                });

            // Clear Animate
            clearTimeout(this_controller.model.animate_interval);
        }
        else if (status === "PAUSED") {
            stream_button.attr("value", "Resume")
                .style("border-color", "#6666ff")
                .style("background-opacity", 1)
                .style("background-color", "#e6e6ff")
                .on("click", function() {

                    // Prevents starting a 2nd stream
                    if (this_controller.STREAM_ON) {
                        alert("Already Streaming!");
                        return;
                    }

                    // Stream button
                    this_view.styleStreamButton("ON");

                    // Start stream
                    this_controller.startStream();
                });

            // Clear Animate
            clearTimeout(this_model.animate_interval);
        }
        else if (status === "ON") {
            stream_button.transition()
                .style("border-color", "#00ccff")
                .style("background-opacity", 0.55)
                .style("background-color", "#e6f7ff");

            // Animate
            var num_dots = 0;
            this_model.animate_interval = setInterval(function() {
                var new_text = "Streaming" + ".".repeat(num_dots%4);
                stream_button.attr("value", new_text);
                num_dots++;
            }, 250);
        }
    }
};





// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//              STREAM PROGRESS BAR PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var StreamProgressBarPrototype = {
    initStreamBarScale: function() {
        // Set Scale
        this.scale = d3.scaleLinear()
            .domain([0, this.scenario_properties.nFrames])
            .range([this.dimensions.radius, this.dimensions.width-(this.dimensions.radius*2)]);
    },
    initStreamProgressBar: function() {

        var this_view = this;
        var this_model_region_name = this.model.region_name;
        var total_frames = this.scenario_properties.nFrames;

        // Init scales
        this.initStreamBarScale();

        // PROGRESS BAR
        var stream_progress_svg = d3.select("#"+this_model_region_name+"_stream_progress_div").append("svg")
            .attr("class", "stream_progress_svg")
            .attr("id", this_model_region_name+"_stream_progress_svg")
            .attr("height", this_view.dimensions.height * 3)
            .attr("width", this_view.dimensions.width)
            .style("padding-bottom", "50px");

        // Add stream progress bar TEXT
        var stream_progress_text_g = stream_progress_svg.append("g")
            .attr("class", "stream_progress_text_g")
            .attr("id", this_model_region_name+"_stream_progress_text_g")
            .attr("transform", "translate("+(this_view.dimensions.width / 2 - 5)+", 10)");

        // frames title
        stream_progress_text_g.append("text")
            .attr("class", "stream_progress_frames_label")
            .attr("id", this_model_region_name+"_stream_progress_frames_label")
            .attr("x", -60)
            .text("Frames: ")
            .style("fill", "black")
            .style("font-size", "12px");


        // currently streamed
        stream_progress_text_g.append("text")
            .attr("class", "stream_progress_frames_loaded")
            .attr("id", this_model_region_name+"_stream_progress_frames_loaded")
            .attr("x", 0)
            .text("0")
            .style("fill", "black")
            .style("font-size", "12px");

        // Divider
        stream_progress_text_g.append("text")
            .attr("class", "stream_progress_divider")
            .attr("id", this_model_region_name+"_stream_progress_divider")
            .attr("x", 30)
            .text("/")
            .style("fill", "black")
            .style("font-size", "12px");

        // Out of total
        stream_progress_text_g.append("text")
            .attr("class", "stream_progress_total_frames")
            .attr("id", this_model_region_name+"_stream_progress_total_frames")
            .attr("x", 45)
            .text(total_frames)
            .style("fill", "black")
            .style("font-size", "12px");


        // Add stream progress bar
        var stream_progress_g = stream_progress_svg.append("g")
            .attr("class", "stream_progress_g")
            .attr("id", this_model_region_name+"_stream_progress_g")
            .attr("transform", "translate("+(this_view.dimensions.width * 0.05)+","+(this_view.dimensions.height * 0.85)+")");

        stream_progress_g.append("rect")
            .attr("class", "stream_progress_wrapper")
            .attr("id", this_model_region_name+"_stream_progress_wrapper")
            .attr("height", this_view.dimensions.height * 0.9)
            .attr("width", this_view.dimensions.width * 0.9)
            .attr("rx", 10)
            .attr("ry", 10)
            .style("fill", "transparent")
            .style("stroke", "#d1d1e0")
            .style("stroke-width", "3px");
    },
    updateProgressBar: function() {
        var stream_view = this;

        // Update progress bar text
        d3.select("#"+this.model.region_name+"_stream_progress_frames_loaded").text(this.model.load_frame);

        // Update progress bar
        d3.select("#"+this.model.region_name+"_stream_progress_g").append("circle")
            .attr("cx", function() {
                return stream_view.scale(stream_view.model.load_frame);
            })
            .attr("cy", stream_view.dimensions.height/2 - 1)
            .attr("r", stream_view.dimensions.radius*0.9)
            .style("fill", stream_view.colors.default);

        // Move progress bar container to front (gives fill effect of streaming marks
        d3.select("#"+this.model.region_name+"stream_progress_wrapper").moveToFront();
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------




// COMBINE PROTOTYPES
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

// Add Stream Progress bar prototype to stream prototype
for (var streamBarObject in StreamProgressBarPrototype) {
    StreamViewConstructor.prototype[streamBarObject] = StreamProgressBarPrototype[streamBarObject];
}

// Add Stream Buttons prototype to stream prototype
for (var streamButtonsObject in StreamButtonsPrototype) {
    StreamViewConstructor.prototype[streamButtonsObject] = StreamButtonsPrototype[streamButtonsObject];
}


// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

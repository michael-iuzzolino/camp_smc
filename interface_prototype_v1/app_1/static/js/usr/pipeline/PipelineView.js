var PipelineViewConstructor = function(model) {
    this.model = model;
    this.divs = {pipeline: null, filters: null};

    this.config = {
        dimensions : {
            pipeline : {
                height : 300,
                width : 900
            },
            stage : {
                height : 150,
                width : 150
            }
        },
        colors : {
            select : "#33ff33",
            unselect : "#e6ffe6",
            hover : "#f2e6ff",
            active_hover : "#6666ff"
        }
    };

    this.initDivs();
};


PipelineViewConstructor.prototype = {
    init: function() {
        this.initFilterDisplay();
        this.initDisplay();
    },
    initDivs: function() {
        // Remove Previous divs
        d3.select("#pipeline_controls_div").remove();
        d3.select("#pipeline_filter_display_div").remove();

        this.divs.pipeline = d3.select("#controls_div").append("div").attr("id", "pipeline_controls_div");
        this.divs.filters = d3.select("#controls_div").append("div").attr("id", "pipeline_filter_display_div");
    },
    initFilterDisplay: function() {

        // Remove Previous divs
        d3.select("#filter_controls_div").remove();

        var this_model = this.model;

        // Grab image frame filter controls div
        var pipeline_filter_display_div = d3.select("#pipeline_filter_display_div");

        // Declare filter controls div
        var filter_controls_div = pipeline_filter_display_div.append("div").attr("id", "filter_controls_div");

        // Set title of filter controls div
        filter_controls_div.append("h1").html("Filters");

        // Create form
        filter_controls_div.selectAll("input")
            .data(Object.keys(this.model.filter_ids)).enter()
            .append("div")
                .attr("id", function(d) {
                    return this_model.filter_ids[d]+"_control_div";
                })
            .append("label")
                .attr("class", "filter_label")
                .attr("for", function(d, i) {
                    return this_model.filter_ids[d]+"_checkbox_label";
                })
                .text(function(d) { return d; })
            .append("input")
                .attr("id", function(d,i) {
                    return this_model.filter_ids[d]+"_checkbox";
                })
                .attr("class", "filter_checkbox")
                .attr("type", "checkbox")
                .property("checked", function(d) {
                    return this_model.current_filter_state[d];
                })
                .property("disabled", true);
    },
    initDisplay: function() {
        var this_view = this;
        var this_model = this.model;

        // Select div
        var pipeline_controls_div = d3.select("#pipeline_controls_div");

        // Pipeline header
        pipeline_controls_div.append("h1")
            .attr("id", "pipeline_controls_header")
            .html("Pipeline");


        // Create Stages
        var pipeline_controls_svg = pipeline_controls_div.append("svg")
            .attr("id", "pipeline_controls_svg")
            .attr("height", this.config.dimensions.pipeline.height)
            .attr("width", this.config.dimensions.pipeline.width)
            .style("fill", "white")
            .style("stroke", "black")
            .style("position", "relative")
            .style("top", "-50px");


        // Define pipeline stages group
        var pipeline_stages_g = pipeline_controls_svg.append("g")
            .attr("id", "pipeline_stages_g")
            .attr("transform", "translate(-130, 0)");

        // Add STAGE BUTTONS
        var stages = pipeline_stages_g.selectAll("g.stages")
            .data(Object.keys(this_model.stages)).enter()
            .append("g")
            .attr("class", "stages")
            .attr("id", function(d,i) {
                return "stage_"+i+"_button";
            })
            .attr("transform", function(d, i) {
                var num_stages = Object.keys(this_model.stages).length;
                var new_x = (this_view.config.dimensions.pipeline.width - (100*num_stages) - (10*(num_stages-1)))/2. + i*160;
                var new_y = (this_view.config.dimensions.pipeline.height - 100) * 0.2 + 20;
                return "translate("+new_x+","+new_y+")";
            })
            .on("click", function(d, i) {
                AppController.pipeline.stageOnClick(i);
            })
            .on("mouseover", function(d, i) {
                var current_color = (this_model.current_stage === i) ? this_view.config.colors.active_hover : this_view.config.colors.hover;
                d3.select("#stage_"+i+"_button").select("rect")
                    .transition()
                    .style("fill", current_color)

                    .attr("height", this_view.config.dimensions.stage.height + 10)
                    .attr("width", this_view.config.dimensions.stage.width + 10)
                    .attr("transform", "translate(-5, -5)")
                    .style("opacity", 0.3)
                    .style("fill", this_view.config.colors.select)
                    .style("stroke", "#6666ff")
                    .style("stroke-width", "4px")
                    .style("stroke-opacity", 1.0);

            })
            .on("mouseout", function(d, i) {
                var current_color = (this_model.current_stage === i) ? this_view.config.colors.select : this_view.config.colors.unselect;
                var stroke_color = (this_model.current_stage === i) ? "#ff0000" : "black";
                var stroke_width = (this_model.current_stage === i) ? "6px" : "2px";
                var opacity = (this_model.current_stage === i) ? 0.3 : 0.0;
                var translation = (this_model.current_stage === i) ? "translate(-5, -5)" : "translate(5, 5)";
                var height = (this_model.current_stage === i) ? this_view.config.dimensions.stage.height + 10 : this_view.config.dimensions.stage.height;
                var width = (this_model.current_stage === i) ? this_view.config.dimensions.stage.width + 10 : this_view.config.dimensions.stage.width;


                d3.select("#stage_"+i+"_button").select("rect")
                    .transition()
                    .style("fill", current_color)
                    .attr("height", height)
                    .attr("width", width)
                    .attr("transform", translation)
                    .style("opacity", opacity)
                    .style("stroke", stroke_color)
                    .style("stroke-width", stroke_width);
            });


        // THUMBNAILS
        // --------------------------------------------------------------------------------
        var y = $('g.stages');

        var thumb_i = 1;
        Array.prototype.forEach.call(y, stage_g => {
            var thumb_link = "/static/imgs/stages/stage"+thumb_i+".png";
            var svgimg = document.createElementNS('http://www.w3.org/2000/svg','image');
            svgimg.setAttributeNS(null,'height', this.config.dimensions.stage.height);
            svgimg.setAttributeNS(null,'width', this.config.dimensions.stage.width);
            svgimg.setAttributeNS('http://www.w3.org/1999/xlink','href', thumb_link);
            svgimg.setAttributeNS(null,'x','0');
            svgimg.setAttributeNS(null,'y','0');
            svgimg.setAttributeNS(null, 'visibility', 'visible');

            stage_g.append(svgimg);
            thumb_i++;
        });
        // --------------------------------------------------------------------------------

        // Rectangles
        stages.append("rect")
            .attr("height", this.config.dimensions.stage.height)
            .attr("width", this.config.dimensions.stage.width)
            .style("fill", function(d, i) {
                return (this_model.current_stage === i) ? this_view.config.colors.select : this_view.config.colors.unselect;
            })
            .style("stroke", "black")
            .style("stroke-width", "2px")
            .style("stroke-opacity", 1.0)
            .style("opacity", 0.0);


        // Text
        stages.append("text")
            .attr("x", 55)
            .attr("y", -10)
            .style("fill", "black")
            .text(function(d) { return d; });

        stages.append("text")
            .attr("x", function(d, i) {
                var stage_width = this_view.config.dimensions.stage.width;
                var text = this_model.stages[d].name;
                var text_dimensions = HELPER_getSVGTextDimensions(text, "14px");
                var text_width = text_dimensions.width;
                var offset = (stage_width - text_width) / 2.0;
                return offset;
            })
            .attr("y", function() {
                return 170;
            })
            .style("fill", "black")
            .style("font-size", "14px")
            .text(function(d) {
                return this_model.stages[d].name;
            });
    },
    updateDisplay: function(clicked_stage_num) {
        // Remove all highlights
        for (var i=0; i < Object.keys(this.model.stages).length; i++) {
            d3.select("#stage_" + i + "_button").select("rect")
                .transition()
                .attr("height", this.config.dimensions.stage.height)
                .attr("width", this.config.dimensions.stage.width)
                .attr("transform", "translate(5, 5)")
                .style("fill", this.config.colors.unselect)
                .style("opacity", 0.0)
                .style("stroke", "black")
                .style("stroke-width", "2px");
        }

        // Current Active Stage: Add Highlight
        d3.select("#stage_"+clicked_stage_num+"_button").select("rect")
            .transition()
            .attr("height", this.config.dimensions.stage.height + 10)
            .attr("width", this.config.dimensions.stage.width + 10)
            .attr("transform", "translate(-5, -5)")
            .style("opacity", 0.3)
            .style("fill", this.config.colors.select)
            .style("stroke", "#ff0000")
            .style("stroke-width", "6px")
            .style("stroke-opacity", 1.0);

    },
    updateFilterDisplay: function(clicked_stage_num) {
        for (var filter_name in this.model.current_filter_state) {
            var filter_id = this.model.filter_ids[filter_name];
            var filter_val = this.model.current_filter_state[filter_name];
            d3.select("#"+filter_id+"_checkbox").property("checked", function() { return filter_val; });
        }
    }
};
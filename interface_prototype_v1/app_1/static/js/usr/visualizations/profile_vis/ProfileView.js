var ProfileViewConstructor = function() {
    this.dimensions = {};
    this.svg = null;
    this.init();
};

ProfileViewConstructor.prototype = {

    init: function() {

        this.genus_keys = undefined;
        this.active_genus_checkbox_positive = [];
        this.active_genus_checkbox_negative = [];
        this.human_observations = {};

        // Initialize Parameters
        // ---------------------------
        var main_height = 540;
        var main_width = 540;
        this.dimensions = {
            main_svg : {
                height : main_height,
                width : main_width}
        };
        // ---------------------------


        // Initialize DIVS
        // ------------------------------------------
        d3.select("#track_profiles_div").remove();
        d3.select("#main_div").append("div").attr("id", "track_profiles_div").style("opacity", 0.0);
        // ------------------------------------------


        // Initialize SVG
        // -------------------------------------------------------
        this.svg = d3.select("#track_profiles_div").append("svg")
            .attr("id", "main_profile_svg")
            .attr("height", this.dimensions.main_svg.height)
            .attr("width", this.dimensions.main_svg.width);
        // -------------------------------------------------------


        // Background
        // -------------------------------------------------------
        this.svg.append("rect")
            .attr("id", "track_profiles_background")
            .attr("height", this.dimensions.main_svg.height)
            .attr("width", this.dimensions.main_svg.width)
            .style("fill", "white");
        // -------------------------------------------------------


        // Fade in
        // this.show();
    },
    getSimilarities: function(target_id) {

        var this_view = this;

        var target_velocities = AppController.CURRENT_REGION.kalman_filter.model.velocity_data[target_id];
        var target_intensity = AppController.CURRENT_REGION.kalman_filter.model.intensity_data[target_id];

        var target_info = {
            "id"        : target_id,
            "velocity"  : target_velocities,
            "intensity" : target_intensity
        };

        $.ajax({
            url             :       '/retrieve_similar_targets',
            method          :       'POST',
            contentType     :       'application/json',
            dataType        :       'json',
            data            :       JSON.stringify({"top_k": 3, "target_info" : target_info}),
            success: function (response) {

                d3.select("#similiarty_list_div").remove();

                var similarity_div = d3.select("body").append("div")
                    .attr("id", "similiarty_list_div")
                    .style("position", "absolute")
                    .style("left", "1250px")
                    .style("top", "1450px");

                var similarity_objects_div = similarity_div.append("div")
                    .attr("id", "similarity_objects_div")
                    .style("float", "left");

                similarity_objects_div.append("h4").html("Object")
                    .style("margin-bottom", "-5px");

                var similarity_scores_div = similarity_div.append("div")
                    .attr("id", "similarity_scores_div")
                    .style("float", "right")
                    .style("margin-left", "40px");

                similarity_scores_div.append("h4").html("Similarity Score")
                    .style("margin-bottom", "-5px");

                similarity_objects_div.selectAll("p")
                    .data(response.top_k_objects).enter()
                    .append("p")
                    .html(function(d) {
                        return d[0];
                    })
                    .style("margin-bottom", "-3px");

                similarity_scores_div.selectAll("p")
                    .data(response.top_k_objects).enter()
                    .append("p")
                    .html(function(d) {
                        return d[1].toFixed(5);
                    })
                    .style("margin-bottom", "-3px");

                this_view.visualizeProbabilities(response);

            }
        });
    },

    initShowMoreButton: function(target_id) {

        d3.select("#show_more_button").remove();

        var this_view = this;
        // Show Me More Button
        // ------------------------------------------------------------
        d3.select("#track_profiles_div").append("input")
            .attr("id", "show_more_button")
            .attr("type", "button")
            .attr("value", "Show More")
            .on("click", function() {
                this_view.getSimilarities(target_id);
            });
    },
    initTrackTitle: function(track_id) {

        d3.select("#track_title").remove();

        var svg_width = this.dimensions.main_svg.width;

        this.svg.append("g")
            .attr("id", "track_title")
            .attr("transform", function() {
                var text_dimensions = HELPER_getSVGTextDimensions(track_id);

                var new_x = (svg_width - text_dimensions.width) / 2.0;
                return "translate("+new_x+", 20)";
            })
            .append("text")
            .attr("x", 5)
            .attr("y", 5)
            .text(function() {
                var track_split = track_id.split("_");
                var track_name = track_split[0];
                var track_num = track_split[1];
                track_name = track_name[0].toUpperCase() + track_name.slice(1, track_name.length);
                return track_name + " " + track_num;
            });
    },
    show: function() {
        d3.select("#track_profiles_div").transition().duration(1000).style("opacity", 1.0);
        d3.select("#probability_vis_div").transition().duration(1000).style("opacity", 1.0);
    },
    hide: function() {
        d3.select("#track_profiles_div").transition().duration(1000).style("opacity", 0.0);
        d3.select("#probability_vis_div").transition().duration(1000).style("opacity", 0.0);
    }
};







// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          PROBABILITY VIS INTERACTIONS PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var ProbabilityVisInteractionsPrototype = {
    leftClickBox: function (d, i) {
        var removal_index;
        var this_view = this;

        // Check if already selected in positive. If so, remove it
        for (var pos_key in this_view.active_genus_checkbox_positive) {
            if (this_view.active_genus_checkbox_positive[pos_key] === this.genus_keys[i]) {
                d3.select("#"+this.genus_keys[i]+"_checkbox")
                    .transition().duration(250)
                    .style("fill", "#fff");

                // remove index
                removal_index = this_view.active_genus_checkbox_positive.indexOf(this.genus_keys[i]);

                if (removal_index > -1) {
                    this_view.active_genus_checkbox_positive.splice(removal_index, 1);
                }
                return;
            }
        }

        // Check if match with negative
        if (this_view.active_genus_checkbox_negative.indexOf(this.genus_keys[i]) > -1) {

            removal_index = this_view.active_genus_checkbox_negative.indexOf(this.genus_keys[i]);

            if (removal_index > -1) {
                this_view.active_genus_checkbox_negative.splice(removal_index, 1);
            }
        }

        var activated_checkbox = this.genus_keys[i] + "_checkbox";
        this_view.active_genus_checkbox_positive.push(this.genus_keys[i]);

        d3.select("#"+activated_checkbox)
            .style("fill", "#00ff00")
            .style("opacity", 1.0);

        this.returnLabelsToNormal();
    },
    rightClickBox: function(d, i) {
        var this_view = this;
        var removal_index;

        // Check if already selected in negative. If so, remove it
        for (var neg_key in this_view.active_genus_checkbox_negative) {
            if (this_view.active_genus_checkbox_negative[neg_key] === this.genus_keys[i]) {
                d3.select("#"+this.genus_keys[i]+"_checkbox")
                    .transition().duration(250)
                    .style("fill", "#fff");

                // remove index
                removal_index = this_view.active_genus_checkbox_negative.indexOf(this.genus_keys[i]);

                if (removal_index > -1) {
                    this_view.active_genus_checkbox_negative.splice(removal_index, 1);
                }
                return;
            }
        }

        // Check if match with positive
        if (this_view.active_genus_checkbox_positive.indexOf(this.genus_keys[i]) > -1) {

            removal_index = this_view.active_genus_checkbox_positive.indexOf(this.genus_keys[i]);

            if (removal_index > -1) {
                this_view.active_genus_checkbox_positive.splice(removal_index, 1);
            }
        }

        var activated_checkbox = this.genus_keys[i] + "_checkbox";
        this_view.active_genus_checkbox_negative.push(this.genus_keys[i]);

        d3.select("#"+activated_checkbox)
            .style("fill", "#ff0000")
            .style("opacity", 1.0);

        this.returnLabelsToNormal();
    },
    checkboxMouseover: function(i) {
        d3.select("#"+this.genus_keys[i]+"_checkbox")
            .transition().duration(50)
            .style("fill", "#000")
            .style("opacity", 0.4);

        var axis_label = d3.select("#x_axis").transition().selectAll("text").nodes()[i].setAttribute("style", "font-size: 36px");
    },
    returnLabelsToNormal: function() {
        var axis_label = d3.select("#x_axis").transition().selectAll("text").nodes();
        axis_label.forEach(function(d) {
            d.setAttribute("style", "font-size: 24px");
        });
    },
    resetCheckBoxes: function() {
        for (var i in this.genus_keys) {
            d3.select("#"+this.genus_keys[i]+"_checkbox")
                .style("fill", "#ffffff")
                .style("opacity", 1.0);
        }
    },
    checkboxMouseout: function(i) {
        var color;

        if (this.active_genus_checkbox_positive.indexOf(this.genus_keys[i]) > -1) {
            d3.select("#"+this.genus_keys[i]+"_checkbox")
                .transition().duration(50)
                .style("fill", "#00ff00")
                .style("opacity", 1.0);
            return;
        }

        // Check negative checkboxes
        if (this.active_genus_checkbox_negative.indexOf(this.genus_keys[i]) > -1) {
            color = "#ff0000";
        }
        else {
            color = "#fff";
        }
        d3.select("#"+this.genus_keys[i]+"_checkbox")
            .transition().duration(50)
            .style("fill", color)
            .style("opacity", 1.0);

        this.returnLabelsToNormal();

    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------





// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          PROBABILITY VIS PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var current_vis_track_id = null;
var ProbabilityVisPrototype = {
    visualizeProbabilities: function(target_id, init) {

        // console.log("TARGET ID: " + target_id);
        current_vis_track_id = target_id;

        var this_view = this;

        var target_velocities = AppController.CURRENT_REGION.kalman_filter.model.velocity_data[target_id];
        var target_intensity = AppController.CURRENT_REGION.kalman_filter.model.intensity_data[target_id];

        var target_info = {
            "id"        : target_id,
            "velocity"  : target_velocities,
            "intensity" : target_intensity
        };

        var ajax_packet = {
            "target_info"           : target_info,
            "human_observations"    : this_view.human_observations
        };

        $.ajax({
            url             :       '/retrieve_probabilities',
            method          :       'POST',
            contentType     :       'application/json',
            dataType        :       'json',
            data            :       JSON.stringify(ajax_packet),
            success: function (response) {

                if (response["response"] === "error") {
                    return;
                }
                if (init) {
                    this_view.initializeProbabilitiesVis(response);
                }
                else {
                    this_view.updateProbabilitiesVis(response);
                }
            }
        });
    },
    updateHumanObservations: function() {

        for (var genus_key in this.genus_keys) {
            this.human_observations[this.genus_keys[genus_key]] = 1; // 1 is null
        }
        // Update positive checkbox
        for (var pos_genus in this.active_genus_checkbox_positive) {
            this.human_observations[this.active_genus_checkbox_positive[pos_genus]] = 0; // 0 is yes
        }

        // Update negative human_observations
        for (var neg_genus in this.active_genus_checkbox_negative) {
            this.human_observations[this.active_genus_checkbox_negative[neg_genus]] = 2; // 2 is no
        }
    },
    resetHumanObservations: function() {

        this.active_genus_checkbox_positive = [];
        this.active_genus_checkbox_negative = [];
        this.human_observations = {};

        this.resetCheckBoxes();
    },
    processProbData: function(data) {
        var hmm_probabilities_dict = data.hmm.probabilities;
        var rnn_probabilities_dict = data.rnn.probabilities;

        var hmm_probabilities = [];
        var rnn_probabilities = [];
        for (var genus_key in hmm_probabilities_dict){
            hmm_probabilities.push(hmm_probabilities_dict[genus_key]);
            rnn_probabilities.push(rnn_probabilities_dict[genus_key]);
        }

        this.genus_keys = Object.keys(hmm_probabilities_dict);

        return [hmm_probabilities, rnn_probabilities];
    },
    combineProbabilities: function(hmm_probabilities, rnn_probabilities) {
        var probablities = [];
        for (i=0; i < hmm_probabilities.length; i++) {
            var hmm_i = hmm_probabilities[i];
            var rnn_i = rnn_probabilities[i];
            var ave = (hmm_i + rnn_i) / 2.0;
            probablities.push(ave);
        }

        return probablities;
    },
    initializeProbabilitiesVis: function(response) {
        var this_view = this;
        this.combine_probabilities = true;
        var hmm_probabilities, rnn_probabilities, probablities;

        d3.select("#probability_vis_div").remove();

        // Process data
        // ---------------------------------------------------------------------
        [hmm_probabilities, rnn_probabilities] = this.processProbData(response);
        // ---------------------------------------------------------------------

        // Combine Probabilities
        // --------------------------------------------------------------------------------------
        if (this.combine_probabilities) {
            probablities = this.combineProbabilities(hmm_probabilities, rnn_probabilities);
        }
        else {
            probablities = hmm_probabilities;
        }
        // --------------------------------------------------------------------------------------

        // UPDATE HUMAN OBSERVATIONS
        // ----------------------------
        this.updateHumanObservations();
        // ----------------------------

        // VIS Object parameters
        // --------------------------------------------------------
        var margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = 700 - (margin.left + margin.right)*2,
            height = 700 - (margin.top + margin.bottom)*2;

        this.barchart_height = height * 0.75;
        var barchart_width = width * 0.75;
        // --------------------------------------------------------

        // Create DIV, SVG, and Group
        // ----------------------------------------------------------------------------------------
        var probability_vis_div = d3.select("body").append("div").attr("id", "probability_vis_div");

        var svg = probability_vis_div.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        var barchart_g = svg.append("g")
            .attr("id", "barchart_g")
            .attr("transform", "translate(" + margin.left*3 + "," + margin.top*0.5 + ")");
        // ----------------------------------------------------------------------------------------

        // Scales
        // ----------------------------------------
        this.xScaleProb = d3.scaleBand()
            .range([0, barchart_width])
            .padding(0.1);
        this.yScaleProb = d3.scaleLinear()
            .range([this.barchart_height, 0]);

        this.colorScaleProb = d3.scaleLinear()
            .domain([0, 1])
            .range(["#e6f2ff", "#0080ff"]);

        // Scale the range of the data in the domains
        this.xScaleProb.domain(this_view.genus_keys.map(function(d) { return d }));
        this.yScaleProb.domain([0, 1]);
        // ----------------------------------------

        // Barplot BARS
        // --------------------------------------------------------------------
        barchart_g.selectAll(".probability_bar")
            .data(probablities)
            .enter().append("rect")
            .attr("class", "probability_bar")
            .attr("x", function(d, i) { return this_view.xScaleProb(this_view.genus_keys[i]); })
            .attr("width", this_view.xScaleProb.bandwidth())
            .attr("y", function(d) { return this_view.yScaleProb(d); })
            .attr("height", function(d) { return this_view.barchart_height - this_view.yScaleProb(d); })
            .style("fill", function(d) {
                return this_view.colorScaleProb(d);
            })
            .style("stroke", "#000000");
        // --------------------------------------------------------------------


        // CheckBoxes for user input
        // --------------------------------------------------------------------------------
        svg.selectAll(".family_checkboxes")
            .data(probablities)
            .enter().append("rect")
            .attr("class", "family_checkboxes")
            .attr('id', function(d, i) {
                return this_view.genus_keys[i] + "_checkbox";
            })
            .attr("x", function(d, i) { return this_view.xScaleProb(this_view.genus_keys[i]); })
            .attr("width", 30)
            .attr("y", this.barchart_height)
            .attr("height", 30)
            .style("fill", function(d, i) {
                var genus_name = this_view.genus_keys[i];
                return (this_view.active_genus_checkbox_positive.indexOf(genus_name) > -1) ? "#00ff00" : (this_view.active_genus_checkbox_negative.indexOf(genus_name) > -1) ? "#ff0000" : "#fff";
            })
            .style("stroke", "#000000")
            .attr("transform", "translate("+ this.xScaleProb.bandwidth() * 1.88 +", "+ (+27) +")")
            .on("mouseover", function(d, i) {
                this_view.checkboxMouseover(i);
            })
            .on("mouseout", function(d, i) {
                this_view.checkboxMouseout(i);
            })
            .on("click", function(d, i) {
                this_view.leftClickBox(d, i);
                this_view.visualizeProbabilities(current_vis_track_id);
            })
            .on("contextmenu", function(d, i) {
                this_view.rightClickBox(d, i);
                this_view.visualizeProbabilities(current_vis_track_id);
            })
            .moveToFront();
        // --------------------------------------------------------------------------------

        // AXES
        // --------------------------------------------------------------------------------
        // X Axis
        // --------------
        barchart_g.append("g")
            .attr("id", "x_axis")
            .attr("transform", "translate(0," + this.barchart_height + ")")
            .call(d3.axisBottom(this.xScaleProb));

        // Y Axis
        // --------------
        barchart_g.append("g")
            .attr("id", "y_axis")
            .call(d3.axisLeft(this.yScaleProb));

        // Y Axis LABEL
        // --------------
        barchart_g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left*2.1)
            .attr("x", 0 - (this.barchart_height / 2))
            .attr("dy", "0.71em")
            .style("text-anchor", "middle")
            .text("Probability")
            .style("font-size","24px");

        d3.select("#x_axis").selectAll("text")
            .html(function(d, i) {
                return "ICBM " + (i+1);
            })
            .attr("transform"," translate(-50,100) rotate(-45)") // To rotate the texts on x axis. Translate y position a little bit to prevent overlapping on axis line.
            .style("font-size","24px"); //To change the font size of texts

        d3.select("#y_axis").selectAll("text")
            .style("font-size","24px"); //To change the font size of texts
        // --------------------------------------------------------------------------------
    },
    updateProbabilitiesVis: function(response) {
        var this_view = this;
        var hmm_probabilities, rnn_probabilities, probablities;
        var i;

        // UPDATE HUMAN OBSERVATIONS
        // ----------------------------
        this.updateHumanObservations();
        // ----------------------------

        // Process data
        // ---------------------------------------------------------------------
        [hmm_probabilities, rnn_probabilities] = this.processProbData(response);
        // ---------------------------------------------------------------------

        // Combine Probabilities
        // --------------------------------------------------------------------------------------
        if (this.combine_probabilities) {
            probablities = this.combineProbabilities(hmm_probabilities, rnn_probabilities);
        }
        else {
            probablities = hmm_probabilities;
        }
        // --------------------------------------------------------------------------------------


        var max_val = d3.max(probablities);

        var bars = d3.select("#barchart_g").selectAll(".probability_bar")
            .data(probablities);

        bars.enter().append("rect")
            .attr("class", "bar");

        bars.exit()
            .transition()
            .duration(300)
            .ease(d3.easeExp)
            .attr("height", 0)
            .remove();

        bars.transition()
            .duration(1000)
            .ease(d3.easeQuad)
            .attr("x", function(d, i) { return this_view.xScaleProb(this_view.genus_keys[i]); })
            .attr("width", this_view.xScaleProb.bandwidth())
            .attr("y", function(d) { return this_view.yScaleProb(d); })
            .attr("height", function(d) { return this_view.barchart_height - this_view.yScaleProb(d); })
            .style("fill", function(d) {
                if (d === max_val) {
                    return "rgba(0, 255, 0, 0.4)";
                }
                else {
                    return this_view.colorScaleProb(d);
                }
            });
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------





// COMBINE PROTOTYPES
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------

// Add Point Target Centroids Objects from prototype to local context prototype
for (var probVisObject in ProbabilityVisPrototype) {
    ProfileViewConstructor.prototype[probVisObject] = ProbabilityVisPrototype[probVisObject];
}

for (var probVisObject in ProbabilityVisInteractionsPrototype) {
    ProfileViewConstructor.prototype[probVisObject] = ProbabilityVisInteractionsPrototype[probVisObject];
}


// ----------------------------------------------------------------------------------------------------
// ----------------

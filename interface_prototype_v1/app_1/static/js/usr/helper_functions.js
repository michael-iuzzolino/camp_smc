
"use strict";

/**---------------------------------------------------------------------------------------------------------
 * Create Slider Function
 *----------------------------------------------------------------------------------------------------------*/
function createSlider(parent_div, parameters, param_name, label_text) {

    d3.select("#"+param_name+"_slider_div_main").remove();

    var new_param_slider_div = parent_div.append("div")
        .attr("id", param_name+"_slider_div_main");


    // Label and text div
    var label_slider_text_div = new_param_slider_div.append("div")
        .attr("id", param_name+"_label_slider_text_div")
        .attr("class", "label_slider_text_container");

    // Add parameter label to slider
    label_slider_text_div.append("label").text(label_text).attr("class", "slider_label");

    // Add span to hold and represent value of slider
    var slider_span = label_slider_text_div.append("span")
        .attr("id", param_name+"_slider_span")
        .attr("class", "slider_span");


    // Add new slider
    var new_slider = new_param_slider_div.append("input")
        .attr("type", "range")
        .attr("id", param_name+"_slider")
        .attr("class", "slider")
        .attr("value", parameters.default)
        .attr("min", parameters.min)
        .attr("max", parameters.max)
        .attr("step", parameters.stepsize)
        .on("input", function() {

            if (param_name === "playback_frame") {
                AppController.CURRENT_REGION.playback.setCurrentPlaybackFrame(+this.value);

                slider_span.html(AppController.CURRENT_REGION.playback.getCurrentFrame());
                if (AppController.CURRENT_REGION.playback.isActive()) {
                    AppController.CURRENT_REGION.satellite_vis.drawFrame();
                    // Update google map detection marker

                }
                // AppController.local_context.view.updatePointTargetsOverlay();
            }

            else if (param_name === "playback_rate") {
                AppController.CURRENT_REGION.playback.setRate(+this.value);

                var playback_rate_text = AppController.CURRENT_REGION.playback.getRate() + " (f/min)";
                slider_span.html(playback_rate_text);
                var new_playback_rate = AppController.CURRENT_REGION.playback.getRate();
                if (AppController.CURRENT_REGION.playback.isActive()) {
                    AppController.CURRENT_REGION.playback.updatePlaybackRate(new_playback_rate);
                }
            }
        });

    var span_text = (param_name === "playback_rate") ? AppController.CURRENT_REGION.playback.getRate() + " (f/min)" : parameters.default_value;

    slider_span.html(span_text);

    new_slider.property("value", parameters.default_value);


    if (label_text === "Noise Amplification") {
        new_param_slider_div.style("display", "none");
    }
}







// -------------------------------------------------------------------------------------
// Gets the height, width of an svg text element
// -------------------------------------------------------------------------------------
function HELPER_getSVGTextDimensions(text_of_interest, font_size) {
    var temp_container = d3.select("body")
        .append("svg")
        .attr("id", "TEMP_TEXT")
        .style("opacity", 0.0);

    var temp_text = temp_container.append("text")
        .attr("id", "temp_text")
        .text(text_of_interest);

    if (font_size) {
        temp_text.style("font-size", font_size);
    }


    var text_width = temp_text.node().getBBox().width;
    var text_height = temp_text.node().getBBox().height;

    d3.select("#TEMP_TEXT").remove();

    return {width : text_width, height : text_height};
}
// -------------------------------------------------------------------------------------






// -------------------------------------------------------------------------------------
// PRINT REGION NAME
// remove _ and add capitalization
// -------------------------------------------------------------------------------------
function printName(init_name) {
    var name_arr,
        name;

    // Check if _ in name
    name_arr = init_name.split("_");

    // Capitalize each name
    for (var i=0; i < name_arr.length; i++) {
        name = name_arr[i];
        name_arr[i] = name.charAt(0).toUpperCase() + name.slice(1);
    }

    return name_arr.join(" ");
}
// -------------------------------------------------------------------------------------



// -------------------------------------------------------------------------------------
// Remove all classes from object
// -------------------------------------------------------------------------------------
function removeAllClasses(d3_object, exempt_classes, show_classes_removed) {
    var current_classes = d3_object.attr("class").split(" ");

    for (var class_i=0; class_i < current_classes.length; class_i++) {
        var current_class = current_classes[class_i];

        if (show_classes_removed !== undefined) {
            console.log("Removing class " + current_class + "...");
        }

        // Check if current class is in exempt list
        var ignore_current_class = false;
        if (exempt_classes !== undefined) {
            for (var j=0; j < exempt_classes.length; j++) {
                var exempt_class = exempt_classes[j];

                if (current_class === exempt_class) {
                    ignore_current_class = true;
                    break;
                }
            }
        }

        if (ignore_current_class) { continue; }

        d3_object.classed(current_class, false);
    }
}
// -------------------------------------------------------------------------------------



// * SPINNER * //
// -------------------------------------------------------------------------------------
function initSpinner() {
    window.SPINNER_DIV = "spinner_div";
    d3.select("body").append("div").attr("id", SPINNER_DIV).attr("class", SPINNER_DIV);

    spinnerSetup();
}

function spinnerSetup() {
    // Define spinner options
    var spinner_options = {
        lines: 13 // The number of lines to draw
        , length: 28 // The length of each line
        , width: 14 // The line thickness
        , radius: 0 // The radius of the inner circle
        , scale: 1.5 // Scales overall size of the spinner
        , corners: 0.5 // Corner roundness (0..1)
        , color: '#ff9933' // #rgb or #rrggbb or array of colors
        , opacity: 0.25 // Opacity of the lines
        , rotate: 0 // The rotation offset
        , direction: 1 // 1: clockwise, -1: counterclockwise
        , speed: 1 // Rounds per second
        , trail: 60 // Afterglow percentage
        , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
        , zIndex: 2e9 // The z-index (defaults to 2000000000)
        , className: 'spinner' // The CSS class to assign to the spinner
        , top: '50%' // Top position relative to parent
        , left: '50%' // Left position relative to parent
        , shadow: false // Whether to render a shadow
        , hwaccel: false // Whether to use hardware acceleration
        , position: 'absolute' // Element positioning
    };

    // Define spinner
    window.spinner_1 = new Spinner(spinner_options);
}

function spinnerDeconstruct() {
    d3.select("#spinner_div").remove();
}
// -------------------------------------------------------------------------------------



/**---------------------------------------------------------------------------------------------------------
 * SVG - MOVE TO FRONT AND BACK
 *----------------------------------------------------------------------------------------------------------*/
// MOVE TO BACK
d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};

// MOVE TO FRONT
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};
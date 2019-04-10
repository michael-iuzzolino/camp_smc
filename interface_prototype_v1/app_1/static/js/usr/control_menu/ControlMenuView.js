
var ControlMenuViewConstructor = function(model) {

    this.model = model;


    this.parameters = {color : {"hover" : "#e6f2ff", "click" : "#ccccff", "default" : "#ffffff"},
        menu_dimensions : {"height" : 20, "width" : 400},
        button_width : 50,
        text_width_factor : 3,
        text_height: null,
        svg : {"height" : 150, "width" : 600}};

    this.menu_svg = null;
    this.menu_div = null;
    this.init();
};


ControlMenuViewConstructor.prototype = {
    init: function() {
        this.initDivs();
        this.initSVG();
        this.initMenuButtons();
    },
    initDivs: function() {
        var controls_div = d3.select("#controls_div");

        this.menu_div = controls_div.append("div")
            .attr("id", "controls_menu_div");
    },
    initSVG: function() {
        this.menu_svg = this.menu_div.append("svg")
            .attr("id", "controls_menu_svg")
            .attr("height", this.parameters.svg.height)
            .attr("width", this.parameters.svg.width);

        // background
        this.menu_svg.append("rect")
            .attr("height", this.parameters.menu_dimensions.height*1.2)
            .attr("width", this.parameters.menu_dimensions.width*1.2)
            .style("fill", "white")
            .style("stroke", "black");
    },
    initMenuButtons: function() {

        var text_width, text_height;
        var new_x, current_x_position;

        var this_view = this;

        // Add menu button group
        var menu_buttons_g = this.menu_svg.selectAll("g")
            .data(Object.keys(this.model.menus)).enter()
            .append("g")
            .attr("id", function(option_name) {
                return option_name+"_menu_button";
            })
            .attr("transform", function(d, i) {
                new_x = i*(10 + this_view.parameters.button_width) + 10;
                return "translate("+new_x+",2)"
            })
            .style("cursor", "pointer")
            .on("mouseover", function(option_name) {
                if (option_name === this_view.parameters.dropdown_active) {
                    return;
                }
                d3.select(this).select("rect").transition()
                    .style("fill", this_view.parameters.color.click);
            })
            .on("mouseout", function(option_name) {
                if (option_name === this_view.parameters.dropdown_active) {
                    return;
                }

                d3.select(this).select("rect").transition()
                    .style("fill", this_view.parameters.color.default);
            })
            .on("click", function(option_name, i) {

                d3.select(this).select("rect").transition()
                    .style("fill", this_view.parameters.color.click);

                current_x_position = i*(10 + this_view.parameters.button_width) + 10;
                this_view.createDropDownMenu(option_name, this_view.menu_svg, current_x_position);
            });

        // Add background to buttons
        menu_buttons_g.append("rect")
            .attr("height", this_view.parameters.menu_dimensions.height)
            .attr("width", this_view.parameters.button_width)
            .style("fill", this_view.parameters.color.default);

        // Add Text to menu buttons
        menu_buttons_g.append("text")
            .attr("x", function(option_name) {
                [text_width, text_height] = this_view.getTextWidthHeight(option_name);

                return (this_view.parameters.button_width - text_width) / 2;
            })
            .attr("y", function(option_name) {
                [text_width, text_height] = this_view.getTextWidthHeight(option_name);
                this_view.parameters.text_height = text_height;

                return (this_view.parameters.button_width - text_height) / 2;
            })
            .style("fill", "black")
            .text(function(option_name) {
                return option_name;
            });
    },
    createDropDownMenu: function(option_name, controls_menu_svg, x_position) {
        var text_width, text_height;
        var menu_data;
        var largest_text_option;
        var this_view = this;

        // Close dropdown if already open
        if (option_name === this.parameters.dropdown_active) {
            // Deactivate other dropdown menus
            d3.select("#"+this.parameters.dropdown_active+"_dropdown_menu").remove();
            this.parameters.dropdown_active = null;

            // Reset color
            d3.select("#"+this.parameters.dropdown_active+"_menu_button").select("rect").transition()
                .style("fill", this.parameters.color.default);

            return;
        }

        // Deactivate other dropdown menus
        d3.select("#"+this.parameters.dropdown_active+"_dropdown_menu").remove();

        // Reset color
        d3.select("#"+this.parameters.dropdown_active+"_menu_button").select("rect").transition()
            .style("fill", this.parameters.color.default);

        // Set current dropdown as the active dropdown menu (for removal later
        this.parameters.dropdown_active = option_name;

        // Set menu data
        menu_data = this.model.menus[option_name].options;

        // Determine largest text option in dropdown menu options to set dropdown menu width
        largest_text_option = d3.max(menu_data, function(option_text) {
            return option_text.option;
        });


        // DROPDOWN GROUP
        // ----------------------------------------------------
        var dropdown_g = controls_menu_svg.append("g")
            .attr("id", option_name+"_dropdown_menu")
            .attr("transform", function() {
                var new_x = x_position;
                var new_y =  this_view.parameters.menu_dimensions.height+4;
                return "translate("+new_x+","+new_y+")"
            })
            .style("cursor", "pointer");
        // ----------------------------------------------------


        // DROPDOWN RECTANGLE
        // ----------------------------------------------------
        var dropdown_rect = dropdown_g.append("rect")
            .attr("width", function() {

                [text_width, text_height] = this_view.getTextWidthHeight(largest_text_option);

                return text_width * this_view.parameters.text_width_factor;
            })
            .style("fill", "white")
            .style("stroke", "black");

        dropdown_rect.transition()
            .attr("height", function() {
                return menu_data.length * this_view.parameters.text_height + 20;
            });
        // ----------------------------------------------------


        // DROPDOWN TEXT
        // ----------------------------------------------------
        var dropdown_text_g = dropdown_g.append("g")
            .attr("id", "dropdown_text_g");

        var dropdown_text = dropdown_text_g.selectAll("tspan")
            .data(menu_data).enter()
            .append("text")
            .attr("class", "dropdown_text")
            .attr("x", function() {
                return 10;
            })
            .attr("y", 20)
            .style("fill", "black")
            .style("opacity", 0.0)
            .text(function(menu_datum) {
                return menu_datum.option;
            })
            .on("mouseover", function() {
                d3.select(this).style("fill", "blue");
            })
            .on("mouseout", function() {
                d3.select(this).style("fill", "black");
            })
            .on("click", function(menu_datum, i) {

                // Remove dropdown menu
                d3.select("#"+this_view.parameters.dropdown_active+"_dropdown_menu").remove();


                // Reset color
                d3.select("#"+this_view.parameters.dropdown_active+"_menu_button").select("rect").transition()
                    .style("fill", this_view.parameters.color.default);

                this_view.parameters.dropdown_active = null;

                // Trigger function
                menu_datum.function();
            });

        dropdown_text.transition().delay(200)
            .attr("y", function(menu_datum, i) {
                return i*20+20;
            }).delay(20)
            .style("opacity", 1.0);


        // ----------------------------------------------------
    },
    getTextWidthHeight: function(the_text) {
        // Create test text
        var test_text = d3.select("body").append("svg")
            .attr("class", "test_text")
            .append("text")
            .text(the_text);

        // Get the bounding box
        var bbox = test_text.node().getBBox();

        // Get text width and height from bounding box
        var text_width = bbox.width;
        var text_height = bbox.height;

        // Remove the text from the DOM
        d3.selectAll(".test_text").remove();

        return [text_width, text_height];
    }
};


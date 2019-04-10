"use strict";
var socket;

/**---------------------------------------------------------------------------------------------------------
 * MAIN
 *----------------------------------------------------------------------------------------------------------*/
function main(response) {
    // PREVENTS RIGHT CLICKING MENU FROM COMMING UP
    // --------------------------------------------------------------------------------
    document.addEventListener('contextmenu', event => event.preventDefault());
    // --------------------------------------------------------------------------------

    // Initialize Loading Spinner
    // --------------------------------------------------------------------------------
    initSpinner();
    // --------------------------------------------------------------------------------

    // Create Application
    // --------------------------------------------------------------------------------
    var AppModel = new AppModelConstructor();
    var AppView = new AppViewConstructor(AppModel);
    window.AppController = new AppControllerConstructor(AppModel, AppView);
    // --------------------------------------------------------------------------------


    // ** TODO: Hardcoded - change later. This puts animation on Israel
    // ******************************
    window.REGION_OF_INTEREST = response.region_of_interest;
    // ******************************

    // SET EMPTY DATA KEY
    window.EMPTY_KEY = response.empty_key;

    // SET SIMULATION TIME
    window.SIM_TIME = response.sim_time; // GOOD TIME: 8000

    // Initialize local context
    // --------------------------------------------------------------------------------
    AppController.initLocalContext();
    // --------------------------------------------------------------------------------

    // Initialize scenario
    // --------------------------------------------------------------------------------
    AppController.initScenario();
    // --------------------------------------------------------------------------------

    // Initialize Voice Server
    // --------------------------------------------------------------------------------
    // AppController.initVoiceServer();
    // --------------------------------------------------------------------------------
}

$(function() {

    var namespace = '/test';

    socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);

    socket.on('connect', function() {
        socket.emit('my_event', {data: 'I\'m connected!'});
    });

    // Event handler for new connections.
    // The callback function is invoked when a connection with the
    // server is established.
    socket.on('my_response', function(msg) {
        console.log(msg.count);
        d3.select("#test_tag").html("Received #" + msg.count + ": " + msg.data);
        // $('#test_tag').append('<br>' + $('<div/>').text('Received #' + msg.count + ': ' + msg.data).html());
    });

    $.ajax({
        url: "/init_config_variables",
        success: function (response) {
            main(response);
        },
        fail: function (result) {
            alert("Fail to initialize configuration variables!");
        }
    });

});

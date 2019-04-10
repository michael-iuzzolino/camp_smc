var LocalContextModelConstructor = function() {

    this.point_targets = {};
    this.current_region_name = null;

    // Stream and Playback Frames
    // -----------------------------------
    this.current_stream_frame = null;
    this.current_playback_frame = null;
    // -----------------------------------

    // Container for the view centers of each region (used for setting the view of the OSM maps)
    this.region_view_centers = {};

    // Data from Kalman Filter Updates
    // -----------------------------
    this.kalman_tracks_data = null;
    this.centroids_data = null;
    // -----------------------------

    // External controllers (uncertainty_vis)
    // -----------------------------------
    this.external_controllers = null;
    // -----------------------------------
};

LocalContextModelConstructor.prototype = {
    initExternalControllers: function(external_controllers) {
        this.external_controllers = external_controllers;
    },



    // UNCERTAINTY VIS
    initUncertaintyVis: function(point_target_info, this_map, track_id) {
        // Initialize data
        // ------------------------------------------------------
        var init_data = {
            target_info     :   point_target_info,
            centroids       :   this.centroids_data[track_id],
            ellipses        :   this.ellipse_data[track_id],
            velocity        :   this.velocity_data[track_id],
            playback_frame  :   this.current_playback_frame
        };
        // ------------------------------------------------------

        // INITIALIZE uncertainty vis
        // ------------------------------------------------------
        this.external_controllers.uncertainty_vis.initTargetOnMap(this_map, init_data);
        // ------------------------------------------------------

        // Set current track id
        // ----------------------------------------
        this.uncertainty_vis_track_id = track_id;
        // ----------------------------------------
    },
    updateUncertaintyVis: function(point_target_info, track_id) {
        // Update data
        // ------------------------------------------------------
        var update_data = {
            target_info     :   point_target_info,
            centroids       :   this.centroids_data[track_id],
            ellipses        :   this.ellipse_data[track_id],
            velocity        :   this.velocity_data[track_id],
            playback_frame  :   this.current_playback_frame
        };
        // ------------------------------------------------------

        // UPDATE uncertainty vis
        // ---------------------------------------------------------------
        this.external_controllers.uncertainty_vis.updateMap(update_data);
        // ---------------------------------------------------------------
    },



    updateMapForRegion: function(region_name) {
        // Set current region name
        this.current_region_name = region_name;

        // Initialize Point Target Container
        this.point_targets[this.current_region_name] = {
            centroids               : null,
            uncertainty_ellipses    : null,
            kalman_tracks           : null
        };

        // Set geospatial extent
        this.geospatial_extent = AppController.global_context.model.regions[this.current_region_name];
    },
    KalmanAJAXDataUpdate: function(tracks_data, centroids_data, ellipse_data, velocity_data) {
        this.kalman_tracks_data = tracks_data;
        this.centroids_data = centroids_data;
        this.ellipse_data = ellipse_data;
        this.velocity_data = velocity_data;

        // Backend logging of classifications
        // Let one or two frames pass before trying to log
        if (this.current_stream_frame > 2) {
            this.preLogTracksCheck();
        }
    }
};







// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          DATA LOGGER PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var DataLoggerPrototype = {

    preLogTracksCheck: function() {
        // Data struct
        // this.point_targets[this.current_region_name].kalman_tracks_list[track_id] = {
        //     active                  :      active,
        //     selected                :      false,
        //     classification          :       "Not Classified",
        //     classification_type     :       null,
        //     moved_to_inactive       :       false,
        //      logged                  : false,
        // };
        //

        // Data for file
        var region_name = this.current_region_name;
        var current_stream_frame = this.current_stream_frame;
        var date = new Date();
        var system_time = date.getTime();

        // Find tracks marked as 'track' and send to backend
        var list = this.point_targets[region_name].kalman_tracks_list;
        var save_list = {};
        for (var track_id in list) {
            var current_track = list[track_id];

            // Check if already logged
            // TODO: What about updates if track still active?
            if (current_track.logged) {
                continue;
            }

            // Check if track is classed as track or ignore (ignore could be useful as well)
            var log_this_track = (current_track.classification === "Track" || current_track.classification === "Ignore") ;

            if (log_this_track) {
                // Get track history
                var track_history = AppController.CURRENT_REGION.kalman_filter.getHistoryForTrack(track_id);
                console.log(track_history);
                save_list[track_id] = {
                    classification      :   current_track.classification,
                    classification_type :   current_track.classification_type,
                    region              :   region_name,
                    stream_logtimestep  :   current_stream_frame,
                    system_time         :   system_time,
                    all_track_data      :   track_history   // From kalman filter

                    // TODO: If auto-released, get specific extent of corresponding auto-track region and log
                };

                // Mark as logged as to not log again
                this.updateTrackListObject(track_id, "logged", true);
            }
        }

        if (Object.keys(save_list).length > 0) {
            this.logTracks_AJAX(save_list);
        }
    },
    logTracks_AJAX: function(save_list) {
        $.ajax({
            url: '/log_tracks',
            method: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(save_list),
            success: function (response) {
                console.log("RESPONSE");
                console.log(response);
            }
        });
    }

};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------









// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          CENTROIDS PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var PointTargetCentroidsModelPrototype = {
    initPointTargetCentroids: function() {

        // Initialize point target centroid container
        this.point_targets[this.current_region_name].centroids = [];

        // Get lat lon from stream (it will be in OUR pixel space - NOT OL projection pixel space)
        var init_frame = 0;

        // Initialize the centroids
        var init_centroids = this.centroids_data;

        // Setup container for the initial frame centroids
        var current_frame_centroids = [];

        // Loop through point targets and convert all centroids' coords, and store them to current frame
        for (var track_id in init_centroids) {

            // Get latitude and longitude
            // ------------------------------------------------------
            var latitude = init_centroids[track_id].lat[init_frame];
            var longitude = init_centroids[track_id].lon[init_frame];
            // ------------------------------------------------------

            // Transform to OL Projection
            // --------------------------------------------------------------------------------------------
            var lat_lon_OL_projection = ol.proj.transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857');
            // --------------------------------------------------------------------------------------------

            // Create coords container
            // --------------------------------------------------------------------------------------------
            var coordinates = {lon : lat_lon_OL_projection[0], lat : lat_lon_OL_projection[1], track_id : track_id};
            // --------------------------------------------------------------------------------------------

            // Push coords to current frame centroid container
            // --------------------------------------------------------------------------------------------
            current_frame_centroids.push(coordinates);
            // --------------------------------------------------------------------------------------------
        }

        // Store all centroids from current region to this.point_targets.centroids
        this.point_targets[this.current_region_name].centroids.push(current_frame_centroids);
    },
    updatePointTargetCentroids: function() {

        var coordinates, lat_lon_OL_projection;

        var current_centroids = this.centroids_data;

        // Setup container for the current frame centroids
        var current_frame_centroids = [];

        // Loop through point targets and convert all centroids' coords, and store them to current frame
        for (var track_id in current_centroids) {

            // Get latitude and longitude
            // -----------------------------------------------------------------
            var latitude = current_centroids[track_id].lat[this.current_playback_frame];
            var longitude = current_centroids[track_id].lon[this.current_playback_frame];
            // -----------------------------------------------------------------

            // Check if track active
            // ------------------------------------
            if (longitude === null) {
                // Create null coords container
                coordinates = {
                    lon: null,
                    lat: null,
                    track_id: track_id
                };
            }
            else {
                // Transform to OL Projection
                lat_lon_OL_projection = ol.proj.transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857');

                // Create coords container
                coordinates = {
                    lon: lat_lon_OL_projection[0],
                    lat: lat_lon_OL_projection[1],
                    track_id: track_id
                };
            }
            // ------------------------------------

            // Push coords to current frame centroid container
            current_frame_centroids.push(coordinates);
        }
        // Store all centroids from current region to this.point_targets[current_region].centroids
        this.point_targets[this.current_region_name].centroids.push(current_frame_centroids);

    },
    getCurrentPointTargetCentroids: function(frame_index) {
        return this.point_targets[this.current_region_name].centroids[frame_index];
    }
};
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------










// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
//                          KALMAN TRACKS PROTOTYPE
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
var PointTargetKalmanTracksModelPrototype = {

    initPointTargetKalmanTracks: function() {

        // Initialize
        this.point_targets[this.current_region_name].kalman_tracks = {data : [], list : []};

        // Initialize point target kalman tracks container for LIST
        this.point_targets[this.current_region_name].kalman_tracks_list = {};

        // Initialize container to store track data for plotting
        this.point_targets[this.current_region_name].kalman_tracks_data = {};

        // Initialize track data
        var init_track_data = this.kalman_tracks_data;

        // Get lat lon from stream (it will be in OUR pixel space - NOT OL projection pixel space)
        var init_frame = 0;

        for (var track_id in init_track_data) {

            // Get activity of track
            var active = init_track_data[track_id].active;

            // Get track lat, lon
            var latitude = init_track_data[track_id].lat[init_frame];
            var longitude = init_track_data[track_id].lon[init_frame];

            // Transform to OL Projection
            var lat_lon_OL_projection = ol.proj.transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857');


            // Init data list -- Note Format: (lon, lat)
            this.point_targets[this.current_region_name].kalman_tracks_data[track_id] = [[lat_lon_OL_projection[0], lat_lon_OL_projection[1]]];

            // Initialize list
            this.point_targets[this.current_region_name].kalman_tracks_list[track_id] = {
                active                  :      active,
                selected                :      false,
                classification          :       "Not Classified",
                classification_type     :       null,
                moved_to_inactive       :       false,
                logged                  :       false
            };
        }
    },
    updatePointTargetKalmanTracks: function() {
        var latitude, longitude, lat_lon_OL_projection;

        // Get current kalman tracks from kalman filter
        var current_kalman_tracks = this.kalman_tracks_data;

        // Loop through point targets and convert all centroids' coords, and store them to current frame
        for (var track_id in current_kalman_tracks) {

            // Declare object
            var current_kalman_track = current_kalman_tracks[track_id];

            // Get activity of track
            var active = current_kalman_track.active;


            // Check if active
            if (active) {

                // Get lat lon (pixel space)
                latitude = current_kalman_track.lat[this.current_playback_frame];
                longitude = current_kalman_track.lon[this.current_playback_frame];


                // Transform to OL Projection
                lat_lon_OL_projection = ol.proj.transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857');
            }
            else {
                lat_lon_OL_projection = [null, null];
            }

            // Update track list and data
            // ----------------------------------------------------------------------------------------------
            var current_kalman_tracks_list = this.point_targets[this.current_region_name].kalman_tracks_list;
            var current_kalman_tracks_data = this.point_targets[this.current_region_name].kalman_tracks_data;


            // Check if track already exists in list
            // --------------------------------------------------------------------
            var current_point_target_ids = Object.keys(current_kalman_tracks_list);
            var found_id = false;
            for (var j=0; j < current_point_target_ids.length; j++) {
                var current_id = current_point_target_ids[j];
                if (current_id === track_id) {
                    found_id = true;
                    break;
                }
            }
            // --------------------------------------------------------------------


            // Add new track if not found previously
            if (!found_id) {
                current_kalman_tracks_list[track_id] = {
                    active                  :       active,
                    selected                :       false,
                    classification          :       "Not Classified",
                    classification_type     :       null,
                    moved_to_inactive       :       false,
                    logged                  :       false
                };

                current_kalman_tracks_data[track_id] = [[lat_lon_OL_projection[0], lat_lon_OL_projection[1]]];
            }
            // Track already exists - update it
            else {
                // Update data list -- Note Format: (lon, lat)
                current_kalman_tracks_data[track_id].push([lat_lon_OL_projection[0], lat_lon_OL_projection[1]]);

                // Update tracks list!
                current_kalman_tracks_list[track_id].active = active;
            }
            // ----------------------------------------------------------------------------------------------
        }
    },
    getKalmanFilterData: function(point_target_id, current_playback_frame) {
        var track_data = [];
        for (var i=0; i <= current_playback_frame; i++) {
            var frame_i_coordinates = this.point_targets[this.current_region_name].kalman_tracks_data[point_target_id][i];
            track_data.push(frame_i_coordinates);
        }
        return track_data;
    },
    getTrackList: function(region_name) {
        var tracks = this.point_targets[region_name].kalman_tracks_list;
        var track_list = [];
        for (var track in tracks) {
            var new_track = {track_id : track};
            for (var info in tracks[track]) {
                new_track[info] = tracks[track][info];
            }
            track_list.push(new_track);
        }

        return track_list;
    },
    checkTrackInfo: function(track_id, attr) {
        return this.point_targets[this.current_region_name].kalman_tracks_list[track_id][attr];
    },
    updateTrackListObject: function(track_id, attr, new_selected_value) {
        this.point_targets[this.current_region_name].kalman_tracks_list[track_id][attr] = new_selected_value;
    },
    deactivateTrack: function(point_target_id, current_playback_frame) {
        this.point_targets[this.current_region_name].kalman_tracks_data[point_target_id][current_playback_frame].active = false;
    },
    storeTrackHistory: function(inactive_track) {

        var track_id = inactive_track.track_id;
        var region_name = AppController.CURRENT_REGION.region_name;
        var track_velocities = AppController.CURRENT_REGION.kalman_filter.model.velocity_data[track_id];
        var track_intensity = AppController.CURRENT_REGION.kalman_filter.model.intensity_data[track_id];
        var track_centroids = AppController.CURRENT_REGION.kalman_filter.model.centroids[track_id];

        var region_geospatial_extent = AppController.CURRENT_REGION.local_context.model.geospatial_extent;

        var data_index = AppController.CURRENT_REGION.satellite_vis.model.data.length - 1;
        var track_structured_noise = AppController.CURRENT_REGION.satellite_vis.model.data[data_index].structured_noise;
        var track_everything_else = {
            "shotgun_noise"   : AppController.CURRENT_REGION.satellite_vis.model.data[data_index].shotgun_noise,
            "shake_base"      : AppController.CURRENT_REGION.satellite_vis.model.data[data_index].shake_base,
            "pixel_bleed"     : AppController.CURRENT_REGION.satellite_vis.model.data[data_index].pixel_bleed,
            "noise"           : AppController.CURRENT_REGION.satellite_vis.model.data[data_index].noise,
            "ground_truth"    : AppController.CURRENT_REGION.satellite_vis.model.data[data_index].ground_truth
        };

        var track_info = {
            "id"                    : track_id,
            "region_name"           : region_name,
            "data"                  : {
                "velocity"              : track_velocities,
                "intensity"             : track_intensity,
                "centroids"             : track_centroids,
                "region_spatial_extent" : region_geospatial_extent,
                "structured_noise"      : track_structured_noise,
                "track_everything_else" : track_everything_else
            }
        };
        console.log(track_info);


        $.ajax({
            url             :       '/store_track_history',
            method          :       'POST',
            contentType     :       'application/json',
            dataType        :       'json',
            data            :       JSON.stringify(track_info),
            success: function (response) {
                console.log("SUCCESS");
            }
        });

    }
};


// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------




// COMBINE PROTOTYPES
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------



// Add data logger objects from prototype to local context prototype
for (var loggerObject in DataLoggerPrototype) {
    LocalContextModelConstructor.prototype[loggerObject] = DataLoggerPrototype[loggerObject];
}

// Add point target objects from prototype to local context prototype
for (var pointTargetObject in PointTargetCentroidsModelPrototype) {
    LocalContextModelConstructor.prototype[pointTargetObject] = PointTargetCentroidsModelPrototype[pointTargetObject];
}


// Add Kalman Objects from prototype to local context prototype
for (var kalmanObject in PointTargetKalmanTracksModelPrototype) {
    LocalContextModelConstructor.prototype[kalmanObject] = PointTargetKalmanTracksModelPrototype[kalmanObject];
}
// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
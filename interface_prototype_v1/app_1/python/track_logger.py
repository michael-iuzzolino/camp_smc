import numpy as np
import h5py
import json


class TrackLogger(object):
    def __init__(self, track_data, base_dir):
        self.track_data = track_data
        self.base_dir = base_dir

        self.JSON_filepath = "{}/static/data/track_logger.txt".format(base_dir)
        self.H5_filepath = "{}/static/data/track_logger.h5".format(base_dir)


    def updateTrackData(self, track_data):
        self.track_data = track_data


    def log_JSON(self):
        # Write JSON
        with open(self.JSON_filepath, 'a+') as outfile:
            json.dump(self.track_data, outfile)


    def log_H5(self):
        # Try to open with r+
        # ------------------------------------------------------------
        file_open_type = "r+"
        try:
            with h5py.File(self.H5_filepath, file_open_type) as outfile:
                pass
        except IOError:
            file_open_type = "w"
        # ------------------------------------------------------------


        # Try to open with w
        # ------------------------------------------------------------
        try:
            with h5py.File(self.H5_filepath, file_open_type) as outfile:


                for track_id, track_id_data in self.track_data.iteritems():
                    if track_id in outfile.keys():
                        del outfile[track_id]

                    track_id_g = outfile.create_group(track_id)


                    for data_id, data in track_id_data.iteritems():
                        if data_id in track_id_data.keys():
                            del track_id_g[data_id]

                        data_g = track_id_g.create_group(data_id)


                        try:
                            data_g.create_dataset(data_id, data=data)
                        except TypeError:
                            print("Could not write {}".format(data_id))

        except IOError:
            pass



def log_tracks_JSON(track_data, basedir):

    # Set filepath
    json_file_path = "{}/static/data/track_logger.txt".format(basedir)

    # Write JSON
    with open(json_file_path, 'a+') as outfile:
        json.dump(track_data, outfile)


def log_tracks_H5(track_data, basedir):
    """
        TRACK DATA FORMAT
        ------------------------------------------------------------------------------------

        track_data.keys()  # =>   track_0

        track_data[track_0]
            # =>  {
                classification          :       <string>,
                classification_type     :       <string>
                region                  :       <string>
                stream_logtimestep      :       <int>
                system_time             :       <int>
                all_track_data          :       [ ]
            }

        track_data[track_0]["all_track_data"]  #  =>   [frame_0, ..., frame_n]

        track_data[track_0]["all_track_data"][frame_i]
            #  =>   {

                // Shallow
                intensity_data  :   <int>,


                // Medium
                centroids : {
                    lat : <float>,
                    lon : <float>
                },
                tracks_data : {
                    lat : <floats>,
                    lon : <floats>
                },
                velocity_data : {
                    vx : <float>,
                    vy : <float>
                },


                // Deep
                ellipse_data : {
                    95% : {
                        bounds : {
                            x_min : <float>,
                            x_max : <float>,
                            y_min : <float>,
                            y_max : <float>,
                        },
                        ellipse_data : {
                            X : [ [<float>], [<float>], ... [<float>] ],
                            Y : [ [<float>], [<float>], ... [<float>] ]
                        }
                    }
                }
            }
    """

    # All_data shallow list
    shallow_list = ["intensity_data"]

    # Set filepath
    h5_file_path = "{}/static/data/track_logger.h5".format(basedir)

    # Try to open with r+
    # ------------------------------------------------------------
    file_open_type = "r+"
    try:
        with h5py.File(h5_file_path, file_open_type) as outfile:
            pass
    except IOError:
        file_open_type = "w"
    # ------------------------------------------------------------

    # Try to open with w
    # ------------------------------------------------------------
    try:
        test_outfile = h5py.File(h5_file_path, file_open_type)
    except IOError:
        pass
    else:
        with h5py.File(h5_file_path, file_open_type) as outfile:

            for track_id, track_id_data in track_data.iteritems():
                if track_id in outfile.keys():
                    del outfile[track_id]

                track_id_g = outfile.create_group(track_id)

                for data_id, data in track_id_data.iteritems():
                    if data_id in track_id_data.keys():
                        del track_id_data[data_id]

                    data_g = track_id_g.create_group(data_id)

                    try:
                        data_g.create_dataset(data_id, data=data)
                    except TypeError:
                        print("Could not write {}".format(data_id))


    finally:
        test_outfile.close()
    # ------------------------------------------------------------

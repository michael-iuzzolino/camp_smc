import h5py
import numpy as np
import time

from modules.filter_handler import KalmanFilterHandler
from modules.plotter import Plot
from modules.file_processor import h5FileProcessor

"""
    NOTES:

    1. Prebuilt Munkres implementation (reference: http://software.clapper.org/munkres/) produces same result's as Luke's custom Munkres.
      --> Problem likely exists in a) Distance Matrix, b) Kalman Filter parameters, or c) Both

"""

def displayCostMatrix(handler):
    try:
        matrix_size = len(handler.cost_matrix)
    except TypeError:
        return

    # DEBUGGING: Print cost matrix
    # ---------------------------------------------------------------
    print("\tCost Matrix")
    print("\t-----------\n")
    print("\t{:15s}".format("")),
    for i in range(len(handler.track_list)):
        print("{:15s}{:5s}".format("Detection {}".format(i+1), "")),
    print("\n")

    for i in range(matrix_size):
        print("\t{:15s}".format("Track {}".format(i+1))),
        for j in range(matrix_size):
            print("{:15.2f}{:5s}".format(handler.cost_matrix[i][j], "")),
        print("\n")
    print("\n\n")
    # ---------------------------------------------------------------

def debugFilter(handler, plotter, centroid_data, nFrames=100, playback_rate=2):
    all_tracks = []
    for frame_i in xrange(nFrames):
        print("Frame {}".format(frame_i))
        print("------{}".format("-"*len(str(frame_i))))

        # Get the current frame's centroids
        frame_i_centroids = centroid_data[frame_i]

        # Generate the tracks from the filter handler
        #tracks, assignments = handler.update(frame_i_centroids)
        history = handler.update(frame_i_centroids)


        frame_i_tracks = {}
        for track_id, track_data in history.items():
            state = np.array(track_data['mu'])
            state = state.reshape(state.shape[0], 4)

            x = state[:frame_i+1, 0]
            y = state[:frame_i+1, 1]

            frame_i_tracks[track_id] = {"x" : x, "y" : y}


        plotter.updatePlot(frame_i, frame_i_tracks, None, None)

        #
        # # Update tracks for plotting if tracks not empty
        # # ----------------------------------------------
        # frame_i_tracks = []
        # if len(history) > 0:
        #     for i in range(0,len(history)):
        #         if(history['track_{}'.format(i)]['active'][-1] == False):
        #             continue;
        #         x = float(history['track_{}'.format(i)]['mu'][-1].T.tolist()[0][0]);
        #         y = float(history['track_{}'.format(i)]['mu'][-1].T.tolist()[0][1]);
        #         frame_i_tracks.append([y, x])
        # all_tracks.append(frame_i_tracks)
        # # ----------------------------------------------
        #
        # # DEBUGGING INFO
        # # ----------------------------------------------
        # print("\tDetections: {} --- Tracks: {}".format(frame_i_centroids.shape[0], len(history)))
        # print("\tCentroids")
        # print("\t---------")
        # for i, centroid in enumerate(frame_i_centroids, 1):
        #     print("\t{}. ({}, {})".format(i, centroid[0], centroid[1]))
        # print("\n")
        # print("\tTrack Means")
        # print("\t---------")
        # for i, track in enumerate(frame_i_tracks, 1):
        #     print("\t{}. ({}, {})".format(i, track[1], track[0]))
        #
        # '''
        # print("\tTracks")
        # print("\t------")
        # for i, track in enumerate(tracks, 1):
        #     print("\t{}. ({}, {})".format(i, float(track[0][0]), float(track[0][1])))
        # print("\n")
        # # ----------------------------------------------
        # '''
        #
        # # DEBUGGING VISUALIZATION - Plots tracks from filter over local context
        # # ----------------------------------------------
        # #plotter.updatePlot(frame_i, all_tracks, handler.cost_matrix, assignments)
        # plotter.updatePlot(frame_i, all_tracks, handler.cost_matrix, [])
        # # ----------------------------------------------
        #
        # # Print Cost Matrix
        # # displayCostMatrix(handler)
        #
        # # Set delay between frames
        # time.sleep(playback_rate)
        # print("** End of Frame {}".format(frame_i))
        # print("\n\n\n")

def main():
    # Set h5 file location and select region of interest (Israel has 3/4 tracks in this h5, so it's a good one to work with)
    h5_file = "data/scenario_test.hdf5"
    region_of_interest = "israel"
    playback_rate = 1
    gate_dist = 18

    # Initialize the h5 file and process it
    file_processor = h5FileProcessor(h5_file, region_of_interest)
    file_processor.run()

    # Extract centroid data from processed file for use in debugging filter
    centroid_data = file_processor.getData("Centroids")

    # Initialize filter handler
    handler = KalmanFilterHandler(gate_dist=gate_dist)

    # Initialize plotter for visual debugging
    plotter = Plot(h5_file, region_of_interest)

    # Initialize the dubugging
    debugFilter(handler, plotter, centroid_data, playback_rate=playback_rate)

if __name__ == '__main__':
    main()

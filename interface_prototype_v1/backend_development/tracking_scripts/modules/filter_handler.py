from kalman_filters import NonLinearKalmanFilter as NLKF
import numpy as np
from copy import deepcopy
from munkres import Munkres
import matplotlib.pyplot as plt

"""
    Munkres application to tracking reference: https://www.mathworks.com/help/vision/ref/assigndetectionstotracks.html
"""


class KalmanFilterHandler(object):

    def __init__(self, gate_dist=56/111.321):
        self.track_list = []
        self.filterSeed = NLKF()
        self.Munkres = Munkres()
        self.gate_dist = gate_dist

        #Set up for histories
        self.histCounter = 0
        self.histories = {}
        self.timestep = 0

        
        # DEBUGGING
        self.USE_CUSTOM_MUNKRES = False
        self.cost_matrix = None



    def defineCostMatrix(self, centroids):
        """
            Cost of assigning a detection to a track, specified as an M-by-N matrix, where
                - M represents the number of tracks, and
                - N is the number of detections.

            The lower the cost, the more likely that a detection gets assigned to a track.

            Each value represents the cost of assigning the Nth detection to the Mth track.
        """

        # Determine the size of the matrix
        matrix_size = max(len(self.track_list), len(centroids))

        # Initialize the cost matrix
        # ---------------------------------------------------------------
        self.cost_matrix = np.ones(shape=(matrix_size, matrix_size)) * 999999
        # for i in range(len(self.track_list)):
        for i, track in enumerate(self.track_list):
            track_i_sig = np.array(track[0]).flatten()
            track_i_x = track_i_sig[0]
            track_i_y = track_i_sig[1]

            # for j in range(len(centroids)):
            for j, centroid in enumerate(centroids):
                detection_j = np.array(centroid[0]).flatten()
                detection_j_x = detection_j[0]
                detection_j_y = detection_j[1]

                # Calculate the distance between the detection's centroid and the kalman track x, y predictions
                distance_between = np.sqrt((track_i_x - detection_j_x) ** 2 + (track_i_y - detection_j_y) ** 2)

                # Check for threshold and assign distance to cost matrix
                self.cost_matrix[i][j] = distance_between if (distance_between < self.gate_dist and self.histories['track_{}'.format(i)]['active'][-1] == True) else 999999

        # ---------------------------------------------------------------

        return deepcopy(self.cost_matrix)


    def prebuilt_munkres(self, centroids):
        """
            Pre-built Munkres Implemention
            Reference: http://software.clapper.org/munkres/
            Note: Same results as Luke's filter. Problem likely exists in the distance matrix, kalman filter parameters, or both.
        """

        # List of filters is not empty
        # Check if list is empty. If so, return
        if len(self.track_list) == 0:
            return

        # Calculate cost matrix and receive a deep copy
        try:
            cost_matrix = self.defineCostMatrix(centroids)
        except IndexError:
            return None



        if np.amin(cost_matrix) < self.gate_dist:
            # List of tracks not empty!
            track_detector_paired_indexes = self.Munkres.compute(cost_matrix)
        else:
            track_detector_paired_indexes = None


        return track_detector_paired_indexes


    def newTrackIncubator(self, assignments, centroids, intensities):
        """
            Incubates tracks
        """

        # Check if assignments is none
        # ----------------------------
        # track list is empty
        if assignments is None:

            # Update the track list with the initial centroids fed to the UKF
            for centroid, intensity in zip(centroids, intensities):

                # Create track
                mean = np.matrix([centroid.tolist()[0][0], centroid.tolist()[0][1], 0, 0]).T
                var = np.matrix((np.identity(4) * 100))

                self.track_list.append([mean, var, self.histCounter])

                # Add to history
                self.histories['track_{}'.format(self.histCounter)] = {'mu':[], 'sig':[], 'centroids':[], 'intensity':[], 'active':[]}

                for _ in range(self.timestep):
                    self.histories['track_{}'.format(self.histCounter)]['mu'].append(None)
                    self.histories['track_{}'.format(self.histCounter)]['sig'].append(None)
                    self.histories['track_{}'.format(self.histCounter)]['centroids'].append(None)
                    self.histories['track_{}'.format(self.histCounter)]['intensity'].append(None)
                    self.histories['track_{}'.format(self.histCounter)]['active'].append(False)

                self.histories['track_{}'.format(self.histCounter)]['mu'].append(mean)
                self.histories['track_{}'.format(self.histCounter)]['sig'].append(var)
                self.histories['track_{}'.format(self.histCounter)]['centroids'].append(centroid)
                self.histories['track_{}'.format(self.histCounter)]['intensity'].append(intensity)
                self.histories['track_{}'.format(self.histCounter)]['active'].append(True)

                # Increment histCounter
                self.histCounter += 1

        # track list was not empty and munkres produced assignments
        else:
            associatedTracks = [assignment[0] for assignment in assignments]
            unAssociatedTracks = [track[2] for i, track in enumerate(self.track_list) if i not in associatedTracks]
            track_difference=len(associatedTracks)-len(self.track_list)
            associatedCentroids = [assignment[1] for assignment in assignments]
            unAssociatedCentroids = [centroids[i] for i in range(len(centroids)) if i not in associatedCentroids]
            unAssociatedIntensities = [intensities[i] for i in range(len(centroids)) if i not in associatedCentroids]


            # Update each track with its best measurement
            for assignment in assignments:

                # Track and detection association IDs
                track_num = assignment[0]
                centroid_num = assignment[1]

                if centroid_num >= len(centroids):
                    continue

                # Track data
                try:
                    track = self.track_list[track_num]
                except IndexError:
                    print("Index Error")
                else:
                    track_state = track[0]
                    track_cov = track[1]

                    # Centroid and intensity data
                    centroid = centroids[centroid_num]
                    intensity = intensities[centroid_num]

                    # Update track list with UKF update
                    [mean, var] = self.filterSeed.UKF(track_state, track_cov, centroid)

                    self.histories['track_{}'.format(track_num)]['mu'].append(mean)
                    self.histories['track_{}'.format(track_num)]['sig'].append(var)
                    self.histories['track_{}'.format(track_num)]['centroids'].append(centroid)
                    self.histories['track_{}'.format(track_num)]['intensity'].append(intensity)
                    self.histories['track_{}'.format(track_num)]['active'].append(True)

                    self.track_list[track_num] = [mean, var, track_num]

            # Make new tracks for meas without tracks
            #  for unAssociatedCentroid, unAssociatedIntensity in zip(unAssociatedCentroids, unAssociatedIntensities):
            for track_ind in assignments:
                if track_ind[0]>len(self.track_list)-1:

                    print("HERE FOR NEW TRACKS!")
                    # Create track
                    centroids_list=centroids[track_ind[1]].tolist()[0]
                    mean = np.matrix([centroids_list[0], centroids_list[1], 0, 0]).T
                    var = np.matrix((np.identity(4) * 100))

                    self.track_list.append([mean, var, self.histCounter])

                    # Add to history
                    self.histories['track_{}'.format(self.histCounter)] = {'mu':[], 'sig':[], 'centroids':[], 'intensity':[], 'active':[]}

                    for _ in range(self.timestep):
                        self.histories['track_{}'.format(self.histCounter)]['mu'].append(np.array([[None],[None],[None],[None]]))
                        self.histories['track_{}'.format(self.histCounter)]['sig'].append(None)
                        self.histories['track_{}'.format(self.histCounter)]['centroids'].append(None)
                        self.histories['track_{}'.format(self.histCounter)]['intensity'].append(None)
                        self.histories['track_{}'.format(self.histCounter)]['active'].append(False)

                    self.histories['track_{}'.format(self.histCounter)]['mu'].append(mean)
                    self.histories['track_{}'.format(self.histCounter)]['sig'].append(var)
                    self.histories['track_{}'.format(self.histCounter)]['centroids'].append(centroids[track_ind[1]])
                    self.histories['track_{}'.format(self.histCounter)]['intensity'].append(intensities[track_ind[1]])
                    self.histories['track_{}'.format(self.histCounter)]['active'].append(True)


                    #increment histCounter
                    self.histCounter += 1

            # Deactivate unassociated tracks
            for unAssociatedTrack in unAssociatedTracks:
                self.histories['track_{}'.format(unAssociatedTrack)]['active'].append(False)
                self.histories['track_{}'.format(unAssociatedTrack)]['centroids'].append(None)
                self.histories['track_{}'.format(unAssociatedTrack)]['intensity'].append(None)
                self.histories['track_{}'.format(unAssociatedTrack)]['mu'].append(None)
                self.histories['track_{}'.format(unAssociatedTrack)]['sig'].append(None)

    def update(self, update_feed):
        """
            Update
        """
        # Catches NO centroids on current frame
        if len(update_feed) == 0:
            centroids = []
            intensities = []
        else:
            centroids = update_feed["centroids"]
            intensities = update_feed["intensity"]



        # Catches if np.array or list was sent instead of matrix - converts to matrix
        if isinstance(centroids, np.ndarray) or isinstance(centroids, list):
            centroids = np.matrix(centroids)

        # Call munkres
        assignments = self.prebuilt_munkres(centroids)


        # Set track incubator
        self.newTrackIncubator(assignments, centroids, intensities)

        self.timestep += 1


        # Convert all velocities to km/h
        processed_history = deepcopy(self.histories)


        # Convert all velocities to km/h
        KM_PER_DEG_LON = 111.321        # WIDEST POINT @ Equator  (km / deg latitude)  (dependent on latitude)
        KM_PER_DEG_LAT = 110.567        # EQUATOR   (km / deg longitude)  (more or less constant)
        SECS_PER_HOUR = 3600            # (s/hr)
        RAD_PER_DEG = np.pi / 180.0     # (rad / deg)

        for track_i, track_i_histroy in processed_history.iteritems():

            for frame_i, frame_i_data in enumerate(track_i_histroy['mu']):

                if np.array(frame_i_data).flatten()[0] is None:
                    v_lon=0
                    v_lat=0
                else:
                    v_lon = np.array(frame_i_data).flatten()[2]  # [2] = vx => velocity lon: deg / sec
                    v_lat = np.array(frame_i_data).flatten()[3]  # [3] = vy => velocity lat: deg / sec

                # 1 longitude = cosine (latitude) * length of degree (miles) at equator.
                # Calculate Degrees Longitude from Lat
                longitude_factor = np.cos(v_lat * RAD_PER_DEG) * KM_PER_DEG_LON  # (km / deg)

                # Convert vlon (deg/s) from DEG to KM
                v_lon *= longitude_factor

                # Convert vlat from DEG to KM
                v_lat *= KM_PER_DEG_LAT

                # Convert from hours to seconds
                v_lat_km_s = v_lat * SECS_PER_HOUR
                v_lon_km_s = v_lon * SECS_PER_HOUR


                processed_history[track_i]['mu'][frame_i][2][0] = v_lon_km_s  # [2] = vx => longitude
                processed_history[track_i]['mu'][frame_i][3][0] = v_lat_km_s  # [3] = vx => latitude



        return processed_history



    def distance(self, x1, y1, x2, y2):
        """
            Calculates distance
        """
        return np.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

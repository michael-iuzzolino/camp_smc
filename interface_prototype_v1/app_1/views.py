from threading import Lock

import sys
import os
import numpy as np
import json

from flask import render_template, jsonify, request
from app_1 import app, socketio
import flask_socketio
from flask_socketio import SocketIO, emit, join_room, leave_room, \
    close_room, rooms, disconnect

from app_1.python.h5_file_processor import initialize_HDF5_files
from app_1.python.uncertainty import get_ellipse_data
from app_1.python.track_logger import log_tracks_JSON

import app_1.python.config as config

sys.path.append('backend_development/scenario_simulator/modules')
from DynamicsProfiles import *

sys.path.append('backend_development/tracking_scripts/modules')
from filter_handler import KalmanFilterHandler

sys.path.append("backend_development/classifier")
sys.path.append("backend_development/classifier/HMM/modules")
sys.path.append("backend_development/classifier/RNN/modules")
from classification import HumanTester as HMMClassifier
from RNN_Classifiers import RNN
from BayesHandler import BayesHandler


thread = None
thread_lock = Lock()

@socketio.on('connect', namespace='/test')
def test_connect():
    print("HERE")
    global thread
    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(target=background_thread)
    emit('my_response', {'data': 'Connected', 'count': 0})

def background_thread():
    """Example of how to send server generated events to clients."""
    count = 0
    while True:
        socketio.sleep(10)
        count += 1
        socketio.emit('my_response',
            {
                'data'  : 'Server generated event',
                'count' : count
            },
            namespace='/test'
        )

# import speech_recognition
#
# def init_voice_server():
#     global voice_recognizer
#     voice_recognizer = speech_recognition.Recognizer()
#
# @app.route("/get_voice_command", methods=["GET", "POST"])
# def get_voice_command():
#
#     with speech_recognition.Microphone() as source:
#         print("State Command: ")
#         audio = voice_recognizer.listen(source)
#
#     try:
#         if "heart" in voice_recognizer.recognize_google(audio):
#             print("Heart Rate: 120 bpm")
#             return jsonify({"command" : "heart"})
#         elif "bio" in voice_recognizer.recognize_google(audio):
#             print("Opening biometrics menu...")
#             return jsonify({"command" : "bio"})
#         elif "suit status" in voice_recognizer.recognize_google(audio):
#             print("Suit Status: OK")
#             return jsonify({"command" : "status"})
#
#     except Exception:
#         print("I can't understand you.")
#
#     return jsonify({"command" : "FAIL"})

def load_classifiers():

    print("Loading Classifiers...")

    # HMM
    # -------------------------------------------------
    global Bayes_handler_hmm
    Bayes_handler_hmm = BayesHandler(HMMClassifier('backend_development/classifier/HMM/data/histModels_fams.npy'))

    print("HMM Loaded.")
    # -------------------------------------------------

    # RNN
    # -------------------------------------------------
    with open("backend_development/classifier/RNN/models/architecture_build/rnn_params.json", "r") as infile:
        rnn_params = json.load(infile)

    rnn_params["model_filepath"] = "backend_development/classifier/RNN/models/final_model.ckpt"

    RNN_clf = RNN(**rnn_params)

    global Bayes_handler_rnn
    Bayes_handler_rnn = BayesHandler(RNN_clf)

    print("RNN Loaded.")
    # -------------------------------------------------

@app.route('/')
def index():

    # LOAD CLASSIFIERS
    load_classifiers()

    # Init voice listener
    # init_voice_server()

    return render_template('index.html')


@app.route('/init_config_variables')
def init_config_variables():
    config_vars = {
        "region_of_interest"    : config.REGION_OF_INTEREST,
        "sim_time"              : config.SIM_TIME,
        "empty_key"             : config.EMPTY_KEY
    }
    return jsonify(config_vars)

@app.route('/initialize_scenario')
def initialize_scenario():
    # Find data file
    raw_file_list = os.listdir("backend_development/scenario_simulator/data/")

    # Create list of filenames
    filenames = [file for file in raw_file_list if file.split(".")[-1] in ["h5", "hdf5"]]


    # Initialize all hdf5 files and all regions
    global HDF5_FILES
    HDF5_FILES = initialize_HDF5_files(filenames, config.TESTING, config.TESTING_REGION)

    # Set Current Filename
    global current_filename
    current_filename = filenames[0]

    # Get region spatial extents
    init_results = {"filename" : current_filename, "regions" : {}}
    for region_name in HDF5_FILES[current_filename].keys():
        init_results["regions"][region_name] = HDF5_FILES[current_filename][region_name]["geospatial_extent"]

    # Get properties of satellite images (e.g., nFrames, nRows, nCols)
    test_region_name = HDF5_FILES[current_filename].keys()[0]

    init_results["properties"] = HDF5_FILES[current_filename][test_region_name]["properties"]

    return jsonify(init_results)

@app.route('/initialize_region', methods=['GET', 'POST'])
def initialize_region():

    # Initializing scenario, so frame_load_index = 0
    frame_load_index = 0

    # Get region name
    global current_region_name
    current_region_name = request.json['region_name']

    # Initialize first frame
    current_result = HDF5_FILES[current_filename][current_region_name]["data"]


    # Get Centroids
    # -----------------------------------------------------------------------------
    initial_centroids = current_result["Centroids"][frame_load_index]
    HDF5_FILES[current_filename][current_region_name]["data"]["centroids"] = [initial_centroids]
    # -----------------------------------------------------------------------------

    # Calculate intensity
    # -----------------------------------------------------------------------------
    initial_intensity = current_result["Intensities"][frame_load_index]
    HDF5_FILES[current_filename][current_region_name]["data"]["intensity"] = [initial_intensity]
    # -----------------------------------------------------------------------------

    # Initial frame
    init_frame = {
        "filename"      : current_filename,
        "properties"    : HDF5_FILES[current_filename][current_region_name]["properties"],
        "data"          : {
            "ground_truth"      : current_result["GroundTruth"][frame_load_index],
            "shake_base"        : current_result["ShakeBase"][frame_load_index],
            "pixel_bleed"       : current_result["PixelBleed"][frame_load_index],
            "noise"             : current_result["Noise"][frame_load_index],
            "structured_noise"  : current_result["StructuredNoise"][frame_load_index],
            "shotgun_noise"     : current_result["ShotgunNoise"][frame_load_index],
            "detections"        : current_result["Detections"][frame_load_index],
            "centroids"         : initial_centroids,
            "intensity"         : initial_intensity
        }
    }

    return jsonify(init_frame)

@app.route('/get_next_frame', methods=['GET', 'POST'])
def get_next_frame():

    # Data from ajax post
    try:
        frame_load_index = int(request.json['load_frame_index'])

        # Initialize next frame
        current_result = HDF5_FILES[current_filename][current_region_name]["data"]

        # Get Centroids
        # -----------------------------------------------------------------------------
        current_centroids = current_result["Centroids"][frame_load_index]
        HDF5_FILES[current_filename][current_region_name]["data"]["centroids"].append(current_centroids)
        # -----------------------------------------------------------------------------

        # Calculate intensities
        # -----------------------------------------------------------------------------
        current_intensity = current_result["Intensities"][frame_load_index]
        HDF5_FILES[current_filename][current_region_name]["data"]["intensity"].append(current_intensity)
        # -----------------------------------------------------------------------------

        frame_data = {
            "data" : {
                "ground_truth"      : current_result["GroundTruth"][frame_load_index],
                "shake_base"        : current_result["ShakeBase"][frame_load_index],
                "pixel_bleed"       : current_result["PixelBleed"][frame_load_index],
                "noise"             : current_result["Noise"][frame_load_index],
                "structured_noise"  : current_result["StructuredNoise"][frame_load_index],
                "shotgun_noise"     : current_result["ShotgunNoise"][frame_load_index],
                "detections"        : current_result["Detections"][frame_load_index],
                "centroids"         : current_centroids,
                "intensity"         : current_intensity
            }
        }


    except Exception as e:
        template = "An exception of type {0} occurred. Arguments:\n{1!r}"
        message = template.format(type(e).__name__, e.args)
        print(message)

        return jsonify({"data" : "EoF"})

    return jsonify(frame_data)

@app.route("/init_UKF", methods=["GET", "POST"])
def init_UKF():

    # Initialize the Kalman filter handler
    # ---------------------------------------------------------------------------------------------------
    global Kalman_handler
    Kalman_handler = KalmanFilterHandler()
    # ---------------------------------------------------------------------------------------------------


    # Get Detections data
    # ---------------------------------------------------------------------------------------------------
    initial_centroids = HDF5_FILES[current_filename][current_region_name]["data"]["centroids"][0]
    initial_intensities = HDF5_FILES[current_filename][current_region_name]["data"]["intensity"][0]

    # Convert to matrix
    initial_centroids = np.matrix(initial_centroids)

    # Create update feed
    update_feed = {"centroids" : initial_centroids, "intensity" : initial_intensities}
    # ---------------------------------------------------------------------------------------------------


    # Initialize the Kalman Handler and obtain result
    # ---------------------------------------------------------------------------------------------------
    tracks = Kalman_handler.update(update_feed)
    # ---------------------------------------------------------------------------------------------------

    results = {}
    for track_id, track_data in tracks.items():
        initial_index = 0

        # Extract mu and sig
        mu = np.array(track_data["mu"])[initial_index].flatten().tolist()
        sig = np.array(track_data["sig"])[initial_index]


        # Extract lat, long, and velocity results from MU
        longitude = mu[1]
        latitude = mu[0]
        vx = mu[2]
        vy = mu[3]

        # Calculate velocity magnitude and angle
        v_magnitude = np.sqrt(vx**2 + vy**2)

        try:
            v_angle_deg = np.arctan(vy / vx)
        except ZeroDivisionError:
            v_angle_deg = 0

        # Covariance Matrix (position)
        covariance_matrix_POSITION = sig[:2,:2].tolist()
        covariance_matrix_VELOCITY = sig[2:, 2:].tolist()


        # Calculate the data for the cov ellipse
        ellipse_data = get_ellipse_data(covariance_matrix_POSITION, latitude, longitude, initial_index)


        # Get centroids from history
        centroids = np.array(track_data["centroids"])[initial_index].flatten().tolist()

        # Get intensities from history
        intensities = np.array(track_data["intensity"])[initial_index].flatten().tolist()


        # Get activity
        track_active = track_data['active'][initial_index]

        # Store results for return
        kalman_result = {
            "track_id"      : track_id,
             "lat"          : latitude,
             "lon"          : longitude,
             "vx"           : vx,
             "vy"           : vy,
             "v_magnitude"  : v_magnitude,
             "v_angle_deg"  : v_angle_deg,
             "active"       : track_active,
             "centroids"    : centroids,
             "intensity"    : intensities,
             "ellipse_data" : ellipse_data
         }

        results[track_id] = kalman_result


    return jsonify(results)

@app.route("/update_UKF", methods=["GET", "POST"])
def update_UKF():

    # Get current load frame
    frame_load_index = int(request.json['load_frame_index'])


    # Get Detections data
    # ---------------------------------------------------------------------------------------------------
    detections_data = HDF5_FILES[current_filename][current_region_name]["data"]["centroids"][frame_load_index]
    intensity_data = HDF5_FILES[current_filename][current_region_name]["data"]["intensity"][frame_load_index]

    # Convert to matrix
    detections_data = np.matrix(detections_data)

    # Create update feed
    update_feed = {"centroids" : detections_data, "intensity" : intensity_data}
    # ---------------------------------------------------------------------------------------------------

    # Update the Kalman Handler and obtain result
    # ---------------------------------------------------------------------------------------------------
    tracks = Kalman_handler.update(update_feed)
    # ---------------------------------------------------------------------------------------------------

    # Parse data
    # ---------------------------------------------------------------------------------------------------
    results = {}
    for track_id, track_data in tracks.items():

        # Get activity
        try:
            track_active = track_data['active'][frame_load_index]
        except IndexError:
            kalman_result = {
                "track_id"      : track_id,
                 "lat"          : None,
                 "lon"          : None,
                 "vx"           : None,
                 "vy"           : None,
                 "v_magnitude"  : None,
                 "v_angle_deg"  : None,
                 "active"       : False,
                 "centroids"    : None,
                 "intensity"    : None,
                 "ellipse_data" : None
             }
        else:
            # Extract mu and sig
            mu = np.array(track_data["mu"])[frame_load_index].flatten().tolist()
            sig = np.array(track_data["sig"])[frame_load_index]

            # Extract lat, long, and velocity results from MU
            longitude = mu[1]
            latitude = mu[0]
            vx = mu[2]
            vy = mu[3]

            # Calculate velocity magnitude and angle
            v_magnitude = np.sqrt(vx**2 + vy**2)
            try:
                v_angle_deg = np.arctan(vy / vx)
            except ZeroDivisionError:
                v_angle_deg = np.pi

            # Covariance Matrix (position)
            covariance_matrix_POSITION = sig[:2,:2].tolist()
            covariance_matrix_VELOCITY = sig[2:, 2:].tolist()

            # Calculate the data for the cov ellipse
            ellipse_data = get_ellipse_data(covariance_matrix_POSITION, latitude, longitude, frame_load_index)

            # Get centroids from history
            centroids = np.array(track_data["centroids"])[frame_load_index].flatten().tolist()

            # Get intensities from history
            print("\nHERE")
            print("*"*20)
            print(track_data["intensity"])
            print("*"*20)
            print("\n"*3)
            try:
                intensities = track_data["intensity"][frame_load_index]
            except Exception as e:
                print(e)
                print("FAIL")


            # Store results for return
            kalman_result = {
                "track_id"      : track_id,
                 "lat"          : latitude,
                 "lon"          : longitude,
                 "vx"           : vx,
                 "vy"           : vy,
                 "v_magnitude"  : v_magnitude,
                 "v_angle_deg"  : v_angle_deg,
                 "active"       : track_active,
                 "centroids"    : centroids,
                 "intensity"    : intensities,
                 "ellipse_data" : ellipse_data
             }

        results[track_id] = kalman_result
    # ---------------------------------------------------------------------------------------------------

    return jsonify(results)

@app.route("/log_uncertainty", methods=["GET", "POST"])
def log_uncertainty():
    import json
    import h5py

    base_dir = os.path.abspath(os.path.dirname(__file__))
    json_filepath = "{}/static/data/TEST.txt".format(base_dir)
    h5_filepath = "{}/static/data/TEST.h5".format(base_dir)

    frame_i = request.json['frame']
    data = request.json['track_data']

    data_x = data['x']
    data_y = data['y']

    #
    # with open(json_filepath, 'a+') as outfile:
    #     json.dump(data, outfile)

    try:
        with h5py.File(h5_filepath, 'r+') as outfile:
            frame_g = outfile.create_group("frame_{}".format(frame_i))
            frame_g.create_dataset('x', data=data_x)
            frame_g.create_dataset('y', data=data_y)
    except:
        with h5py.File(h5_filepath, 'w') as outfile:
            frame_g = outfile.create_group("frame_{}".format(frame_i))
            frame_g.create_dataset('x', data=data_x)
            frame_g.create_dataset('y', data=data_y)

    return jsonify({"result" : "SUCCESS!"})

def classifyTimeSeries(dataIn, numRet=3):
    import matplotlib.pyplot as plt
    allProf = []

    #This part needs to be replaced with a database search
    allProf.append(Cirrus(startPose=[40,40]))
    allProf.append(Stratus(startPose=[40,40]))
    allProf.append(Cumulus(startPose=[40,40]))
    allProf.append(Nimbostratus(startPose=[40,40]))
    allProf.append(Cumulonimbus(startPose=[40,40]))
    allProf.append(Altostratus(startPose=[40,40]))

    allInts = []
    for i in range(len(allProf)):
        allInts.append(allProf[i].intensityModel)

    allCor = np.zeros(shape=(len(allInts)))
    for i in range(len(allInts)):
        x = dataIn['intensity']
        y = allInts[i][0:len(dataIn['intensity'])]
        print("x")
        print(x)
        print("y")
        print(y)
        corrCoef = np.correlate(x, y, 'same')

        print("corrCoef: {}".format(corrCoef))
        # lags, c, line,b = plt.xcorr(x, y, normed=True)
        # print("C: {}".format(c))
        allCor[i] = max(abs(corrCoef))
    plt.close()

    toSort = []
    for i in range(len(allProf)):
        toSort.append([allProf[i], allCor[i]])

    sortedList = sorted(toSort, key=lambda x:max(x))[::-1]
    toRet = []
    for i in range(min(numRet, len(sortedList))):
        toRet.append([sortedList[i][0].__class__.__name__, sortedList[i][1]])

    return toRet



@app.route("/retrieve_probabilities", methods=["GET", "POST"])
def retrieve_probabilities():

    results = {}

    # Update Classifiers
    # --------------------------------------------------------------------------------
    target_info = request.json["target_info"]
    human_observations = request.json["human_observations"]

    print("target info")
    print(target_info["id"])
    print("human_observations")
    print(human_observations)

    current_region = current_region_name

    try:
        intensity_data = target_info["intensity"]
    except KeyError:
        print("Error!")
        return jsonify({"response" : "error"})

    human_observation_vals = []
    for genus_i, observation in enumerate(human_observations.values()):
        index = genus_i*3 + observation
        human_observation_vals.append(index)

    hmm_probs = []
    hmm_best = []

    rnn_probs = []
    rnn_best = []
    for data_i in intensity_data:

        hmm_probabilities, hmm_best_genus = Bayes_handler_hmm.update(data_i, human_observation_vals, target_info['id'], current_region)
        hmm_probs.append(hmm_probabilities)
        hmm_best.append(hmm_best_genus)

        rnn_probabilities, rnn_best_genus = Bayes_handler_rnn.update(data_i, human_observation_vals, target_info['id'], current_region)
        rnn_probs.append(rnn_probabilities)
        rnn_best.append(rnn_best_genus)

    # Reset
    Bayes_handler_hmm.reset()
    Bayes_handler_rnn.reset()

    # Convert all np to lists for jsonify
    for hmm_key, hmm_vals in hmm_probabilities.items():
        hmm_probabilities[hmm_key] = hmm_vals.tolist()

    for rnn_key, rnn_vals in rnn_probabilities.items():
        rnn_probabilities[rnn_key] = rnn_vals.tolist()

    # Update results
    results["hmm"] = {"probabilities" : hmm_probabilities, "prediction" : hmm_best[-1]}
    results["rnn"] = {"probabilities" : rnn_probabilities, "prediction" : rnn_best[-1]}
    # --------------------------------------------------------------------------------

    return jsonify(results)

@app.route("/retrieve_similar_targets", methods=["GET", "POST"])
def retrieve_similar_targets():

    results = {}

    # Original Similarity:
    # --------------------------------------------------------------------------------
    top_k = request.json["top_k"]
    target_info = request.json["target_info"]

    similar_items = classifyTimeSeries(target_info, top_k)

    sim_objects = [("{}".format(item[0]), item[1]) for item in similar_items]
    top_k_objects = sorted(sim_objects, key=lambda x: x[1])[::-1]

    print(top_k_objects)

    # Update results
    results["top_k_objects"] = top_k_objects
    # --------------------------------------------------------------------------------

    return jsonify(results)

@app.route("/store_track_history", methods=["GET", "POST"])
def store_track_history():
    """
    RECEIVES the following from LocalContextModel.js:
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

    """
    # Get basedir
    basedir = os.path.abspath(os.path.dirname(__file__))

    # Find data file
    h5_file_path = "{}/static/data/track_histories/track_history_test.h5".format(basedir)
    region_name = request.json["region_name"]
    track_id = request.json["id"]
    track_data = request.json["data"]

    return jsonify({"response" : "NONE"})

@app.route("/log_tracks", methods=["GET", "POST"])
def log_tracks():
    # Get track data
    track_data = request.json

    # Set basedir
    basedir = os.path.abspath(os.path.dirname(__file__))

    # Log JSON
    log_tracks_JSON(track_data, basedir)

    # Log H5
    # log_tracks_H5(track_data, basedir)

    return jsonify({"result" : "SUCCESS!"})

# CAMP-SMC Visualization
## Prototype - Version 1

# A. Intro
This interactive machine learning application was developed for use in a web browser. Python's Flask web framework forms the basis for the application; we use Python for the backend scripts and Javascript (primarily, D3.js) for frontend interaction and visualization.

# B. Running The Application

## Step 0: Create Data Files
First, you need to create the hdf5 files necessary for running the application. These will be located in `interface_prototype_v1 > backend_development`.

### Generating Scenario Data
1. In terminal, navigate to `interface_prototype_v1 > backend_development > scenario_simulator`
2. Run `python main.py`
3. The script will run and generate dynamical objects in the three regions. You can review the visualization or not at the end of the script.
4. This process creates the file `scenario_simulator > data > scenario_test.hdf5`

### Generating RNN Data
1. In terminal, navigate to `interface_prototype_v1 > backend_development > classifier > RNN`
2. Run `python run.py`
3. When prompted (y/n) to train, press `y` for yes
4. This will train an RNN on 300 datapoints (found in `data > model_db_300.h5`) producing the RNN model (saved at `RNN > models`) that can be uploaded later for evaluation of new data.

## Step 1: Launch the Application
After creating all the necessary files, we are ready to launch the app.

1. Navigate into the `interface_prototype_v1` directory
2. Run `python run.py`
3. In browser, navigate to `127.0.0.1:5000` or `http://localhost:5000/`

# C. Application Configurations
There are a number of configuration parameters that you may wish to change, such as the simulation rate of the application (how quick the transition is from frame to frame). These can be found in `interface_prototype_v1 > app_1 > python > config.py`

There are three options here:
1. Change the simulation time by altering the value of `SIM_TIME`. This value is in milliseconds (e.g., 7000 = 7 seconds) and sets the time delay between frames.

2. Testing mode. Sometimes it can take 1-2 minutes to load all the data from the 3 regions. To expedite this for development purposes, you can set `TESTING = True` and set the region of interest for testing. For example, `TESTING_REGION = "boulder"` sets the region of interest as boulder if testing mode is enabled, and only the Boulder region will load from the hdf5 file, decreasing the amount of time waiting for the regions to load.

3. Region of interest. This is the region that the 'ping' is set onto. If in testing mode, it defaults to the testing region; otherwise, the current default is Israel. The options are "israel", "boulder", or "north_korea".

## Notes about editing
The application is setup for debugging mode. There are 2 things you can change: 1) python scripts, 2) javascript/html/css files.

When you change python scripts, the server will **automatically** reset, meaning that the application will fully reload. When you change javascript/html files, the server will not automatically reset, but given the current setup of the application you will need to reload the page to see changes - effectively, you're reseting the server. **Note**: If you change .css files, or if you make a change to a javascript/html file and you do not see the changes reflected when you reload the page, you will likely need to do a `Empty Cache and Hard Reload` by right clicking the reload button (you must be in developer tools mode - in Google Chrome on a Mac, the hotkey is `option+command+i`).

This is why `TESTING = True` can be useful: when you make a change to the application and it reloads, you don't have to wait for it to reload all 3 regions each python script change. Note, the restart occurs at any point you save and editing python script.

# D. Application Structure

## D.1. Backend (server-side)

There are three 'backend' locations.

- Location 1 - `interface_prototype_v1 > backend_development`: All development of scenarios, detection, tracking, classification (HMMs, RNNs) are found in this directory. Some of these files (the classifiers) and data in this directory (scenario_test.hdf5) are located here and referenced from one of the two following locations.
- Location 2 - `interface_prototype_v1 > app_1 > python`: The server-side files that are run directly from Flask and interface with the `backend_development` files in location 1.
- Location 3 - `interface_prototype_v1 > app_1 > views.py`: The primary interfacing between front-end and back-end. All AJAX calls are mediated here.

## D.2. Frontend (client-side)

### HTML
The `index.html` file is found at `interface_prototype_v1 > app_1 > static > templates > index.html`. Nearly everything in this app is generated dynamically via D3.js or JQUERY. The `index.html` primarily acts to link the javascript and css files, and only consists of a `<body>` tag that acts as an anchoring point for all dynamic generation using javascript.

### CSS
All the css files are located in the following directory: `interface_prototype_v1 > app_1 > static > css`
These css files map (for the most part) to the MVCs of the javascript files. The css files in `css > lib` should be not altereted.

### Javascript
All frontend files are found in the directory `interface_prototype_v1 > app_1 > static > js`
The structure is arranged in a pseudo-MVC design pattern. The javascript files in `js > lib` should be not altereted. You will primarily be working with the files found in `js > usr`.

### Audio
Audio files are located in `app_1 > static > audio`. Voice interaction was briefly explored, and these audio files are the system responses. All of this functionality is currently disabled.

### Data
The data directoy at `app_1 > static > data` contains the hdf5 and txt files that store the track histories. This functionality was implemented very briefly and has not been thoroughly vetted.

### Icons
Any icons used in the application are found here: `app_1 > static > icons`

### imgs
The thumbnails used for the HEMI pipeline stages are found here: `app_1 > static > imgs`

## D.3. Javascript File Structure
As mentioned above, the javascript files found in `js > usr>` are designed as psuedo-MVC (model-view-controller).

### Initialize.js
The primary driver file is `js > usr > initialize.js`. This file sets up the websocket, initializes the config variables (found in `python > config.py`), sets these configuration variables to the window, and instantiates the Application Controller.

### App Controller
The app controller initializes:
- **control menu** (the file menu at the top of the app - mostly has no functionality yet)
- **pipeline** (the HEMI pipeline with 5 stages and all its associated functionality)
- **global context** (e.g., the global map with the 3 selectable regions)
- **global context listeners** (e.g., pointer clicking, moving, etc.)

### Local Context
The regions loaded in the global context are the entry points to the primary application functionality. That is, clicking a region (mediated by the **region controller**) will load the **local context** MVC, which populates the map on the left (the local context map) with all the targets, tracks, etc. (what is viewed here is controlled with the pipeline), and also spawns the **stream** and **playback** MVCs.


### Stream and Playback
The app was originally designed with playback in mind. However, we have decided to remove this functionality, but the playback is intergrated deeply into the flow of the app. Rather than removing the playback MVC entirely, allowing only the stream to drive the appliction, we have simulated this by making the playback rate a very high value, so that it is always at the leading edge of the stream.

The **stream** is what is driving all the AJAX calls to the backend for receiving the new frames of data for the detections, kalman filter, etc. The **playback** just sets what frame is currently being visualized.

## D.4. Recap of `js > usr`
There are 5 subdirectories and 6 files (most of these discussed above; the remainder are self-explanatory - i.e., `helper_functions.js`) located here.

The subdirectories are as follows:

### control_menu
Discussed above. This contains the MVC for the file menu at the top, which is mostly unfunctional at this point and can safely be ignored.

### pipeline
This contains the MVC for the HEMI 5-stage pipeline.

### playback
Discussed above, this contains the MVC for the playback, which can be safely ignored. However, a goal should be to remove this entirely and relegate the functionality to the stream only (section below).

### stream
The stream is the main driver of the program once the button "stream" is clicked. This loads the data frame-by-frame via AJAX calls to the backend. Eventually, the architecture will be replaced with the websocket to stream frames in an online fashion from HEMI. In this folder is the MVC for the current functionality, and until updates for websockets are made, can mostly be ignored.

### visualizations
This is the primary location of all the visualizations and itself contains 6 subdirectories:
#### global_context
This contains the MVC for the global context (right-hand map containing the regions)

#### local_context
This contains the MVC for the local context (left-hand map detections, tracks, sattelite image overlay, etc.) This folder also contains
 - auto_release
     - This is the MVC for handling the auto-release that happens with the free-hand drawing of stage 5 of the HEMI pipeline, where an analyst can draw regions on the map that automatically label targets that originate in or enter into as 'track' or 'ignore'.
 - track_list
     - This is the MVC for the list of tracks that accompany the local context view when stage 5 is entered via the HEMI pipeline

#### kalman_filter
This contains the MVC for the Kalman filter handling. That is, this is where the tracks are retrieved. The data loaded from the `scenario_test.hdf5` only contains x, y, intensity data. These points are fed to the Kalman filter (via this MVC) at each timestep, and the Kalman filter on the backend processes these detections and produces tracks (as well as covariance matrices that indicate uncertainty, which is visualized via the MVC listed below).

#### profile_vis
The profile vis contains the MVCs for the velocity and intensity plots (each an MVC itself, respectively, and found as sub directories within the profile_vis directory). At each timestep, the data from `scenario_test.hdf5` is streamed in, containing x, y, intensity data, as explained above, and is utilized to create line plots. These line plots are accessed in the interface by selecting a detection / track when in the appropriate HEMI stage.

The classifier output that the analyst can interact with is also mediated through the profile_vis MVC; specifically, this can be found by searching for `probability_vis_div`, which will yield a source in `profile_vis > ProfileView.js`. The RNN and HMM predictions are visualized here, along with the interactivity of the analyst for accepting or ignoring a decision and updating the probabilities of classification.

#### satellite_vis
Stage 1 of the HEMI pipeline overlays a satellite image from the selected region onto the local context map. The MVC for this is located in this directory. This will need to have significant changes once ONLINE streaming from the real HEMI pipeline, or it will need to be deactivated.

#### uncertainty_vis
The uncertainty visualization stems from the Kalman Filter covariance matrices. Along with a track, it procudes an tracking uncertainty at each timestep. This is visualized concurrently with the profiles in a 3rd popup map once a track is selected.

import warnings
with warnings.catch_warnings():
    warnings.filterwarnings("ignore",category=FutureWarning)
    import h5py

import numpy as np


def initialize_HDF5_files(hdf5_filenames, TESTING, TESTING_REGION):

    HDF5_FILES = {hdf5_filename: None for hdf5_filename in hdf5_filenames}

    CORE_LAYERS = ["GroundTruth", "ShakeBase", "PixelBleed"]

    for hdf5_filename in hdf5_filenames:
        # Find data file
        h5_file_path = "backend_development/scenario_simulator/data/{}".format(hdf5_filename)

        with h5py.File(h5_file_path, 'r') as infile:

            # Get params (nFrames, nRows, nCols)
            # -------------------------------------------------------
            nFrames, nRows, nCols = infile.attrs["region_frame_properties"]

            properties = {
                "nFrames"   : nFrames,
                "nRows"     : nRows,
                "nCols"     : nCols
            }
            # -------------------------------------------------------

            # Regions
            regions = {}
            for region_name, region_layers in infile.items():

                # **********************************
                #          FOR TESTING ONLY
                # **********************************
                if TESTING:
                    if region_name != TESTING_REGION:
                        continue
                # **********************************

                print("Loading region {} from {}...".format(region_name, h5_file_path))
                regions[region_name] = {}

                # Set region properties
                regions[region_name]["properties"] = properties

                # Get region geospatial extent
                # -------------------------------------------------------
                geospatial_extent = {}
                for attr_name, attr_val in infile[region_name].attrs.items():
                    geospatial_extent[attr_name] = attr_val

                # Store extent
                regions[region_name]["geospatial_extent"] = geospatial_extent
                # -------------------------------------------------------


                # Get region layers
                # -------------------------------------------------------
                data = {}

                for layer_name, layer_data in region_layers.items():

                    data[layer_name] = []

                    if layer_name in CORE_LAYERS:
                        # Layer data is actually a core subgroup with layer data as its values
                        core_subgroup = layer_data

                        # Get core subgroup data
                        core_subgroup_data = np.array([np.array(val) for val in core_subgroup.values()])

                        # Consolidate the data and reset to layer_data
                        layer_data = np.sum(core_subgroup_data, axis=0)

                    # Special case for handling Centroids
                    # Issue with just using create_dataset: TypeError: Object dtype dtype('O') has no native HDF5 equivalent
                    # Solution Reference: https://stackoverflow.com/questions/37214482/saving-with-h5py-arrays-of-different-sizes

                    if layer_name == "Centroids" or layer_name == "Intensities" :
                        # Decode the data
                        new_layer_data = []
                        new_group = layer_data

                        for frame_i in range(nFrames):
                            current_frame_name = "frame_{}".format(frame_i)
                            layer_frame_data = []

                            for layer_frame_name, layer_data in new_group.items():
                                layer_frame_name = "_".join(layer_frame_name.split("_")[:2])

                                if current_frame_name == layer_frame_name:
                                    layer_frame_data.append(layer_data[:].tolist())

                            new_layer_data.append(layer_frame_data)

                        layer_data = new_layer_data


                    # Process layer data
                    for frame_i in range(nFrames):
                        processed_frame = layer_data[:]
                        processed_frame = processed_frame[frame_i]

                        try:
                            processed_frame = processed_frame.reshape(nRows, nCols).astype("float").tolist()
                        except:
                            pass

                        data[layer_name].append(processed_frame)

                # Store layers
                regions[region_name]["data"] = data
                # -------------------------------------------------------


            HDF5_FILES[hdf5_filename] = regions

    return HDF5_FILES

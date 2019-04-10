import os
import sys
import numpy as np
import h5py
import matplotlib.pyplot as plt

GENUS_TYPES = [0, 1, 2, 3, 4]
START_POSE = [40, 40]

def write_data(data, db_filepath):
    label_names = data.keys()
    with h5py.File(db_filepath, "w") as outfile:

        outfile.attrs['label_names'] = label_names

        for model_name, model_data in data.items():
            model_g = outfile.create_group(model_name)
            for i, intensity in enumerate(model_data):
                model_g.create_dataset("model_{}".format(i), data=intensity)

def preview_data(data, plot_average=False):

    fig, ax = plt.subplots(len(data), 1)
    for i, (model_name, model_data) in enumerate(data.items()):
        ax[i].set_title(model_name)

        if plot_average:
            model_data_arr = np.array(model_data)
            intensity_avg = np.mean(model_data_arr, axis=0)
            ax[i].plot(intensity_avg)
        else:
            for intensity in model_data:
                ax[i].plot(intensity)

    plt.tight_layout()
    plt.show()

def add_noise(data, mean=0.0, std=2.0):
    return np.array([x + np.random.normal(mean, std) for x in data])


def main(data_dir_path, num_models, force_db_rewrite=False, preview=False):

    db_filepath = "{}/model_db_{}.h5".format(data_dir_path, num_models)

    if os.path.isfile(db_filepath) and not force_db_rewrite:
        print("\n** '{}' already exists.".format(db_filepath))
        return

    full_data = {}

    model_i = 0
    while model_i < num_models:
        for family_i in MODELS:
            for genus_i in GENUS_TYPES:

                # Progress Bar
                # ==========================================================================================
                progress_bar_size = 20
                percent_complete = (model_i+1) / float(num_models)
                num_symbols = int(progress_bar_size * percent_complete)
                start = "="*(num_symbols+1)+">" if num_symbols < progress_bar_size else "="*(progress_bar_size+1)
                end = "-"*(progress_bar_size-num_symbols) if num_symbols < progress_bar_size else ""
                progress_bar_symbol = start + end
                sys.stdout.write("\rCreating Model: {}/{} [{:{bar_size}s}]".format(model_i+1, num_models, progress_bar_symbol, bar_size=progress_bar_size))
                sys.stdout.flush()
                # ==========================================================================================

                feed_dict = {
                    "startPose"  : START_POSE,
                    "genus" : genus_i,
                    "weather"  : False
                }

                new_profile = family_i(**feed_dict)

                profile_name = "{}_{}".format(new_profile.name, new_profile.genus)

                # Add random noise to intensity model
                profile_intensity = add_noise(new_profile.intensityModel)

                if profile_name in full_data.keys():
                    full_data[profile_name].append(profile_intensity)
                else:
                    full_data[profile_name] = [profile_intensity]

                model_i += 1

    print("\n***num_models: {}".format(num_models))
    if preview:
        preview_data(full_data)

    write_data(full_data, db_filepath)

if __name__ == "__main__":
    sys.path.append('../../../scenario_simulator/modules')
    from DynamicsProfiles import Stratiform, Cirriform, Stratocumuliform, Cumuliform, Cumulonibiform
    MODELS = [Stratiform, Cirriform, Stratocumuliform, Cumuliform, Cumulonibiform]
    num_models = 300
    main(num_models=num_models, force_db_rewrite=True, data_dir_path="../data")

else:
    sys.path.append('../../scenario_simulator/modules')
    from DynamicsProfiles import Stratiform, Cirriform, Stratocumuliform, Cumuliform, Cumulonibiform
    MODELS = [Stratiform, Cirriform, Stratocumuliform, Cumuliform, Cumulonibiform]

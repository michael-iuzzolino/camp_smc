import os
import sys
import numpy as np
import h5py
import matplotlib.pyplot as plt
import json

import seaborn as sns
import pandas as pd
import matplotlib.colors as mcolors
sns.set_style("whitegrid")

import modules.db_builder as db_builder
from modules.RNN_Classifiers import RNN
from modules.data_handler import DataHandler
from modules.plotter import Plotter

# Plotting
def plot_training():

    fig, axes = plt.subplots(len(clfs), 1, figsize=(20,15))

    for i, rnn_clf in enumerate(clfs):
        arch = archs[i]
        epochs = rnn_clf.metrics["epochs"]
        loss = rnn_clf.metrics["loss"]
        training = rnn_clf.metrics["training"]
        validation = rnn_clf.metrics["validation"]
        test_score = rnn_clf.metrics["test"]
        maximum = float(np.max(loss))
        minimum = float(np.min(loss))
        loss_normed = [(x - minimum) / maximum for x in loss]

        axes[i].plot(epochs, training, "r", label="Training")
        axes[i].plot(epochs, validation, "b--", label="Validation")
        axes[i].plot(epochs, loss_normed, "orange", label="Loss")
        axes[i].set_title("Arch: {} -- Cell: {} \n Test: {:0.2f}".format(arch, "GRU", test_score))
        axes[i].set_ylim([0, 1.0])
        axes[i].set_xlabel("Epochs")
        axes[i].set_ylabel("Accuracy")
        axes[i].legend()

    fig.subplots_adjust(hspace=.75)
    plt.savefig("results.png")
    plt.show()


# Confusion Matrix Plot
def plot_confusion_matrix(clf, test_set_type="validation", animate=False, time_between_frames=2):

    cmap = mcolors.LinearSegmentedColormap.from_list("n",['#ffffff','#ff0000'])

    confusion_matrix = clf._confusion_matrix[test_set_type]
    n_plots = confusion_matrix.shape[0]
    if animate:
        plt.ion()
        ax = plt.axes()
        for epoch_i in range(n_plots):
            show_cbar = True if epoch_i == 0 else False
            df = pd.DataFrame(data=confusion_matrix[epoch_i], index=["Actual: {}".format(i) for i in range(25)], columns=["Predicted: {}".format(i) for i in range(25)])
            sns.heatmap(df, annot=False, fmt="d", cmap=cmap, linewidths=.5, cbar=show_cbar, ax=ax)
            ax.set_title("{} Set Confusion Matrix -- Epoch: {}".format(test_set_type.capitalize(), epoch_i))
            plt.tight_layout()
            plt.pause(time_between_frames)
            ax.cla()
    else:
        df = pd.DataFrame(data=confusion_matrix[-1], index=["Actual: {}".format(i) for i in range(25)], columns=["Predicted: {}".format(i) for i in range(25)])
        sns.heatmap(df, annot=False, fmt="d", cmap=cmap, linewidths=.5, cbar=True)
        plt.title("{} Set Confusion Matrix -- Epoch: {}".format(test_set_type.capitalize(), n_plots-1))
        plt.show()



def run_model(data, arch, n_epochs, model_i, batch_size=32, dropout_prob=0.5):
    print("Running Model {}...".format(model_i))
    print("Architecture: {}".format(arch))

    rnn_arch = {
        "layer_architecture" : arch,
        "n_classes" :  data.num_classes,
        "max_seq_length" : data.seq_length,
        "n_inputs" : 1,
        "eta" : 0.01,
        "cell_type" : "GRU"
    }

    rnn_params = {
        "architecture" : rnn_arch,
        "dropout" : True,
        "dropout_prob" : dropout_prob,
        "model_filepath" : "models/final_model.ckpt"
    }

    with open("models/architecture_build/rnn_params.json", "w") as outfile:
        json.dump(rnn_params, outfile)

    # Build Model
    rnn_clf = RNN(**rnn_params)

    # Train Model
    train_params = {
        "n_epochs" : n_epochs,
        "batch_size" : batch_size
    }
    rnn_clf.train(data, **train_params)

    return rnn_clf

def run_experiment(architecture, n_epochs, batch_size, filename, dropout_prob):
    data = DataHandler(filename)
    data.process_data(wavelets=False, autoencode=False, one_hot=True)

    clf = run_model(data, architecture, n_epochs, model_i=0, batch_size=batch_size, dropout_prob=dropout_prob)

    return clf


def data_size_experiments():
    data_sizes = [100, 250, 500, 1000, 2500, 5000, 10000]
    n_epochs = [100, 100, 100, 100, 100, 100, 100]
    architecture = [128, 32]
    dropout_prob = 0.5


    clfs = []
    test_accuracies = []
    for data_size, n_epoch in zip(data_sizes, n_epochs):

        if data_size < 2500:
            batch_size = data_size // 4
        else:
            batch_size = 1024

        db_filename = "model_db_{}.h5".format(data_size)
        db_builder.main(data_size, db_filename=db_filename, force_db_rewrite=False)
        clf = run_experiment(architecture, n_epoch, batch_size, db_filename, dropout_prob)
        test_acc = clf.metrics["test"]
        clfs.append(clf)
        test_accuracies.append(test_acc)

    plt.scatter(data_sizes, test_accuracies)
    plt.title("Arch: {} -- Cell: {}".format(clfs[0]._architecture["layer_architecture"], clfs[0].cell_type))
    plt.xlabel("Training Data Size")
    plt.ylabel("RNN Accuracy")
    plt.show()


def architecture_explorer(data_size=300):
    db_filename = "model_db_{}.h5".format(data_size)

    # Check if db with desired data size exists. If it doesn't create it.
    if not os.path.isfile("data/{}".format(db_filename)):
        db_builder.main("data", data_size, force_db_rewrite=False)


    data = DataHandler(db_filename)
    data.process_data(wavelets=False, autoencode=False, check_the_profiles=False)

    archs = [[32, 32]]
    n_epochs = [25]
    batch_size = 32
    dropout_prob = 0.5

    clfs = [run_model(data, arch, n_epoch, model_i, batch_size=batch_size, dropout_prob=dropout_prob) for model_i, (arch, n_epoch) in enumerate(zip(archs, n_epochs))]

    # Setup plotter
    plts = Plotter(archs, clfs)

    plts.training()
    plts.confusion_matrix(0, "validation", animate=True, time_between_frames=0.005)


def train_architecture(architecture, data_size=300, n_epochs=10):
    db_filename = "model_db_{}.h5".format(data_size)

    # Check if db with desired data size exists. If it doesn't create it.
    if not os.path.isfile("data/{}".format(db_filename)):
        db_builder.main("data", data_size, force_db_rewrite=False)

    data = DataHandler(db_filename)
    data.process_data(wavelets=False, autoencode=False, check_the_profiles=False)

    batch_size = 32
    dropout_prob = 0.5

    clf = run_model(data, architecture, n_epochs, 0, batch_size=batch_size, dropout_prob=dropout_prob)

def test_arch(architecture):

    with open("models/architecture_build/rnn_params.json", "r") as infile:
        rnn_params = json.load(infile)

    # Build Model
    rnn_clf = RNN(**rnn_params)

    # Get predictions

    # test data
    data_vals = [10, 5, 2, 20, 100]

    for i in range(1, len(data_vals)+1):
        data_feed = data_vals[:i]

        data = np.zeros(100)

        for i, data_val in enumerate(data_feed):
            data[i] = data_val


        predictions = rnn_clf.predict(data)

        print("Predictions")
        print(predictions)

def main():
    # data_size_experiments()
    # architecture_explorer(data_size=1000)

    architecture = [32, 32]

    train_raw = raw_input('Train (y/n)? ')
    if "y" in train_raw:
        train_architecture(architecture, data_size=300, n_epochs=50)
    else:
        test_arch(architecture)


if __name__ == "__main__":
    main()

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import seaborn as sns

sns.set_style("whitegrid")

class Plotter(object):

    def __init__(self, archs, classifiers):
        self._archs = archs
        self._clfs = classifiers
        self._heatmap_cmap = mcolors.LinearSegmentedColormap.from_list("n",['#ffffff','#ff0000'])

    def training(self):

        num_plots = len(self._clfs)
        num_plots += 1 if len(self._clfs) < 2 else 0
        fig, axes = plt.subplots(num_plots, 1, figsize=(20,15))

        for i, rnn_clf in enumerate(self._clfs):
            arch = self._archs[i]
            epochs = rnn_clf.metrics["epochs"]
            loss = rnn_clf.metrics["loss"]
            training = rnn_clf.metrics["training"]
            validation = rnn_clf.metrics["validation"]
            test_score = rnn_clf.metrics["test"]
            maximum = float(np.max(loss))
            minimum = float(np.min(loss))
            loss_normed = [(x - minimum) / maximum for x in loss]

            HMM_baseline = [0.36 for _ in range(len(epochs))]
            random_baseline = [1/25. for _ in range(len(epochs))]
            random_baseline_label = "Random Baseline: {:0.2f}".format(1/25.)

            axes[i].plot(epochs, training, "r", label="Training")
            axes[i].plot(epochs, validation, "b--", label="Validation")
            axes[i].plot(epochs, loss_normed, "orange", label="Loss")
            axes[i].plot(epochs, HMM_baseline, "k--", label="HMM Baseline: 0.36")
            axes[i].plot(epochs, random_baseline, "k", label=random_baseline_label)
            # axes[i].scatter([epochs[-1]], [test_score], 'b', label="Test Accuracy")
            axes[i].set_title("Arch: {} -- Cell: {} -- Train Time: {}m {}s \n Test: {:0.2f}".format(arch, rnn_clf.cell_type, rnn_clf.total_train_mins, rnn_clf.total_train_secs, test_score))
            axes[i].set_ylim([0, 1.0])
            axes[i].set_xlabel("Epochs")
            axes[i].set_ylabel("Accuracy")
            axes[i].legend()

        fig.subplots_adjust(hspace=.75)
        plt.savefig("results.png")
        plt.show()


    # Confusion Matrix Plot
    def confusion_matrix(self, clf_num, test_set_type="validation", animate=False, time_between_frames=0.5):

        clf = self._clfs[clf_num]

        # Get Confusion Matrix from classifier
        confusion_matrix = clf._confusion_matrix[test_set_type]

        n_plots = confusion_matrix.shape[0]

        if animate:
            plt.ion()
            ax = plt.axes()
            try:
                j = 0
                while True:
                    for epoch_i in range(n_plots):
                        valid_acc = clf.metrics["validation"][epoch_i]
                        show_cbar = True if j == 0 else False
                        df = pd.DataFrame(data=confusion_matrix[epoch_i], index=["Actual: {}".format(i) for i in range(25)], columns=["Predicted: {}".format(i) for i in range(25)])
                        sns.heatmap(df, annot=False, fmt="d", cmap=self._heatmap_cmap, linewidths=.5, cbar=show_cbar, ax=ax)
                        ax.set_title("{} Set Confusion Matrix -- Epoch: {} -- Accuracy: {:0.2f}%".format(test_set_type.capitalize(), epoch_i, valid_acc*100))
                        plt.pause(time_between_frames)
                        j += 1

            except KeyboardInterrupt:
                print("Done!")

        else:
            df = pd.DataFrame(data=confusion_matrix[-1], index=["Actual: {}".format(i) for i in range(25)], columns=["Predicted: {}".format(i) for i in range(25)])
            sns.heatmap(df, annot=False, fmt="d", cmap=self._heatmap_cmap, linewidths=.5, cbar=True)
            plt.title("{} Set Confusion Matrix -- Epoch: {}".format(test_set_type.capitalize(), n_plots-1))
            plt.show()

import sys
import numpy as np
import time
import h5py
import matplotlib.pyplot as plt
import pywt

from sklearn.model_selection import train_test_split
from sklearn.utils import shuffle
from sklearn import preprocessing

sys.path.append('../../scenario_simulator/modules')
sys.path.append('../../../scenario_simulator/modules')
from DynamicsProfiles import Stratiform, Cirriform, Stratocumuliform, Cumuliform, Cumulonibiform


class DataSet(dict):
    def __init__(self, X, y):
        self.X = X
        self.y = y
        self.num_examples = X.shape[0]
        self.batch_i = 0

    def __getattr__(self, attr):
        return self.__dict__[attr]

    def next_batch(self, batch_size):

        if self.batch_i > self.num_examples // batch_size:
            self.X, self.y = shuffle(self.X, self.y)
            self.batch_i = 0

        X_batch = self.X[self.batch_i*batch_size:self.batch_i*batch_size+batch_size]
        y_batch = self.y[self.batch_i*batch_size:self.batch_i*batch_size+batch_size]

        self.batch_i += 1

        return X_batch, y_batch

        
class DataHandler(dict):

    def __init__(self, filename):
        self._file_path = "data/{}".format(filename)

        # Read data from file
        self._read_data_from_file()
        self.classes = self._raw_data.keys()
        self.num_classes = len(self.classes)

    def __getattr__(self, attr):
        return self.__dict__[attr]

    def _read_data_from_file(self):
        print("\nRetrieving data from '{}'...".format(self._file_path))
        self._raw_data = {}

        with h5py.File(self._file_path, "r") as infile:
            for model_name, model_members in infile.items():
                self._raw_data[model_name] = [np.array(model_data) for model_data in model_members.values()]

    def process_data(self, wavelets=False, autoencode=True, one_hot=True, check_the_profiles=False):
        print("\nProcessing data...")
        labels = np.identity(self.num_classes)
        label_names = []
        X_data = []
        y_data = []

        for i, (model_name, model_data) in enumerate(self._raw_data.items()):
            label_names.append(model_name)
            intensities = []
            for intensity in model_data:
                X_data.append(intensity)
                if one_hot:
                    y_data.append(labels[i])
                else:
                    y_data.append(np.argmax(labels[i]))

        # Convert to array
        X_data = np.array(X_data)
        y_data = np.array(y_data)

        # Scale Data
        X_data_scaled = preprocessing.scale(X_data, axis=1)

        if autoencode:
            X_data_scaled = self._autoencode_data(X_data_scaled)

        # Check data
        if check_the_profiles:
            while True:
                t0 = time.time()
                user_input = raw_input("See example of data (y)? ")
                if "n" not in user_input:
                    random_i = np.random.randint(X_data_scaled.shape[0])
                    plt.plot(X_data[random_i])
                    plt.title(label_names[np.argmax(y_data[random_i])])
                    plt.show()
                else:
                    break

        # Train, Validation, Test splits
        X_data_expanded = np.expand_dims(X_data_scaled, axis=2)

        # Split data into Training, Validation, Test Sets
        X_train, X_test, y_train, y_test = train_test_split(X_data_expanded, y_data)
        X_train, X_valid, y_train, y_valid = train_test_split(X_train, y_train)

        # Set data
        self.training = DataSet(X_train, y_train)
        self.validation = DataSet(X_valid, y_valid)
        self.test = DataSet(X_test, y_test)

        if wavelets:
            self._create_wavelet_data()

        self.seq_length = X_train.shape[1]

    def _wave_ify(self, Xt, wavelet='db2'):
        Xt = np.squeeze(Xt)
        # Get Shapes
        cA, cD = pywt.dwt(Xt[0], wavelet, 'symmetric')
        size = cA.shape[0] + cD.shape[0]

        X = np.zeros((Xt.shape[0], size))
        for i in range(Xt.shape[0]):
            cA, cD = pywt.dwt(Xt[i], wavelet)
            # joined = np.array(list(cA) + list(cD))
            joined = np.r_[cA, cD]
            X[i] = joined

        return np.expand_dims(X, axis=2)

    def _autoencode_data(self, X_data, encode_layer_neurons=75):
        import tensorflow as tf
        seq_length = X_data.shape[1]
        n_hidden_1 = 90
        n_hidden_2 = encode_layer_neurons
        n_hidden_3 = 90
        n_output = seq_length

        # Input / Outputs
        X = tf.placeholder(tf.float32, [None, seq_length])
        network = X

        # Encoder
        W1 = tf.Variable(tf.random_normal([seq_length, n_hidden_1]))
        b1 = tf.Variable(tf.random_normal([n_hidden_1]))

        network = tf.nn.tanh(tf.matmul(network, W1) + b1)

        W2 = tf.Variable(tf.random_normal([n_hidden_1, n_hidden_2]))
        b2 = tf.Variable(tf.random_normal([n_hidden_2]))

        network = tf.matmul(network, W2) + b2
        encoded_layer = network

        # Decoder
        W3 = tf.Variable(tf.random_normal([n_hidden_2, n_hidden_3]))
        b3 = tf.Variable(tf.random_normal([n_hidden_3]))

        network = tf.nn.tanh(tf.matmul(network, W3) + b3)

        W4 = tf.Variable(tf.random_normal([n_hidden_3, n_output]))
        b4 = tf.Variable(tf.random_normal([n_output]))

        network = tf.matmul(network, W4) + b4

        # Eval
        y_pred = network
        y_true = X

        # Loss
        loss = tf.reduce_mean(tf.square(y_pred - y_true))

        # Optimizers
        optimizer = tf.train.AdamOptimizer()
        train_op = optimizer.minimize(loss)

        # Init Variables
        init = tf.global_variables_initializer()

        n_epochs = 50000
        patience_threshold = 100

        with tf.Session() as sess:
            init.run()
            loss_history = []
            for epoch_i in range(n_epochs):

                _, loss_val = sess.run([train_op, loss], feed_dict={X: X_data})
                loss_history.append(loss_val)

                if epoch_i > 2 and loss_history[-2] - loss_history[-1] < 0.00001:
                    patience_counter +=1
                else:
                    patience_counter = 0

                # Display logs per step
                sys.stdout.write('\rStep: {:5d}/{:5d} -- Minibatch Loss: {:0.3f} -- Patience Counter: {:4d}/{:4d}\t'.format(epoch_i, n_epochs, loss_val, patience_counter, patience_threshold))
                sys.stdout.flush()

                if patience_counter > patience_threshold:
                    print("\nStopping Early!")
                    break

            self.X_test_pred = y_pred.eval(feed_dict={X: X_data})

            encoded_data = encoded_layer.eval(feed_dict={X: X_data})

        index = 100
        plt.plot(X_data[index], label="Original")
        plt.plot(self.X_test_pred[index], label="Reconstruction")
        plt.legend()
        plt.show()

        return encoded_data

    def _create_wavelet_data(self):
        self.X_train = self._wave_ify(self.X_train)
        self.X_valid = self._wave_ify(self.X_valid)
        self.X_test = self._wave_ify(self.X_test)

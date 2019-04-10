import sys
import numpy as np
import time

import tensorflow as tf
import tensorflow.contrib.rnn as rnn


class RNN_Utils(object):
    def __init__(self):
        pass

    def _orthogonal(self, shape):
        flat_shape = (shape[0], np.prod(shape[1:]))
        a = np.random.normal(0.0, 1.0, flat_shape)
        u, _, v = np.linalg.svd(a, full_matrices=False)
        q = u if u.shape == flat_shape else v
        return q.reshape(shape)

    def _orthogonal_initializer(self):
        def _initializer(shape, dtype=tf.float32, partition_info=None):
            return tf.constant(self._orthogonal(shape), dtype)
        return _initializer


class RNN(RNN_Utils):
    def __init__(self, architecture, model_filepath=None, dropout=True, dropout_prob=0.5, early_stopping=False, early_stop_patience=10, early_stop_delta=0.0001, seed=42):

        super(RNN, self).__init__()

        self._model_filepath = model_filepath

        self.cells = {"LSTM" : rnn.BasicLSTMCell, "GRU" : rnn.GRUCell, "vanilla" : rnn.BasicRNNCell}

        self._architecture = architecture

        self._dropout = dropout
        self._dropout_prob = dropout_prob

        self._early_stopping = early_stopping
        self._early_stopping_patience = early_stop_patience
        self._early_stopping_min_delta = early_stop_delta
        self._early_stopping_start_epoch = 4

        self._seed = seed

        self.prediction_data = np.zeros(100)
        self.prediction_i = 0

        self._build_network()
        self._sess = tf.Session()

        self._progress_bar_length = 20

        self.genus_names = ['Cumuliform0', 'Cumuliform1', 'Cumuliform2', 'Cumuliform3', 'Cumuliform4']
        self.genus_probabilities = { genus: 1 for genus in self.genus_names }

    def _build_network(self):
        n_hidden = self._architecture["layer_architecture"]
        n_layers = len(n_hidden)
        n_inputs = self._architecture["n_inputs"]
        n_classes = self._architecture["n_classes"]
        max_seq_length = self._architecture["max_seq_length"]
        eta = self._architecture["eta"]
        self.cell_type = self._architecture["cell_type"]

        # BUILD
        # ***************************************************************
        print("Building Model...")
        # Seed
        tf.set_random_seed(self._seed)

        # Reset default graph
        tf.reset_default_graph()

        # Inputs / Outputs
        # ------------------------------------------------------------
        X = tf.placeholder(tf.float32, [None, max_seq_length, n_inputs])
        y = tf.placeholder(tf.float32, [None, n_classes])
        seq_length = tf.placeholder(tf.int32, [None])
        # ------------------------------------------------------------

        # RNN Cells
        # ---------------------------------------------------------------------------------
        cells = [self.cells[self.cell_type](n_hidden[layer_i]) for layer_i in range(n_layers)]

        if self._dropout:
            """
            Example: https://danijar.com/introduction-to-recurrent-networks-in-tensorflow/
            """
            cells = [tf.contrib.rnn.DropoutWrapper(cell, output_keep_prob=1.0 - self._dropout_prob) for cell in cells]

        multi_cells = rnn.MultiRNNCell(cells, state_is_tuple=True)
        outputs, states = tf.nn.dynamic_rnn(multi_cells, X, dtype=tf.float32, sequence_length=seq_length)
        # ---------------------------------------------------------------------------------

        # Variable Seq Hack
        # https://danijar.com/variable-sequence-lengths-in-tensorflow/
        # ---------------------------------------------------------------------------------
        # max_length = int(outputs.get_shape()[1])
        # one_hot_output_selection = tf.expand_dims(tf.one_hot(seq_length, max_length), -1)
        # factor = tf.multiply(outputs, one_hot_output_selection)
        # final_state = tf.reduce_max(factor, 1)
        final_state = states[-1]
        # ---------------------------------------------------------------------------------

        # Fully Connected Layer
        # --------------------------------
        input_shape = final_state.get_shape().as_list()[-1]
        with tf.variable_scope("fc_layer"):
            initializer = self._orthogonal_initializer() if False else tf.truncated_normal_initializer(stddev=1.0 / np.sqrt(input_shape))
            W = tf.get_variable("W_fc", [input_shape, n_classes], dtype=tf.float32, initializer=initializer)
            b = tf.get_variable("b_fc", [n_classes], initializer=tf.constant_initializer(0.0))

        logits = tf.matmul(final_state, W) + b
        # --------------------------------

        # Xentropy and loss
        # New cost is needed for variable seq length: See https://danijar.com/variable-sequence-lengths-in-tensorflow/
        # --------------------------------
        # xentropy = tf.nn.softmax_cross_entropy_with_logits_v2(logits=logits, labels=y)
        xentropy = tf.nn.softmax_cross_entropy_with_logits(logits=logits, labels=y)
        loss = tf.reduce_mean(xentropy)
        # --------------------------------

        # Optimizer
        # --------------------------------
        optimizer = tf.train.AdamOptimizer(learning_rate=eta)
        gradients = optimizer.compute_gradients(loss)
        clipped_gradients = [(tf.clip_by_value(grad, -5.0, 5.0), var) for grad, var in gradients]
        train_op = optimizer.apply_gradients(clipped_gradients)
        # --------------------------------

        # Evaluation
        # --------------------------------
        prediction = tf.argmax(tf.nn.softmax(logits), 1)
        y_actual = tf.argmax(y, 1)

        correct_predictions = tf.equal(prediction, y_actual)
        accuracy = tf.reduce_mean(tf.cast(correct_predictions, tf.float32))
        # --------------------------------

        # SAVER
        saver = tf.train.Saver()
        # ***************************************************************

        # Global Variables Initializer
        init = tf.global_variables_initializer()

        self._model = {
            "X"                 : X,
            "y"                 : y,
            "seq_length"        : seq_length,
            "loss"              : loss,
            "logits"            : logits,
            "prediction"        : prediction,
            "y_actual"          : y_actual,
            "train_op"          : train_op,
            "accuracy"          : accuracy,
            "init"              : init,
            "saver"             : saver
        }

    def _progress_bar(self, batch_t0, batch_i, n_batches, batch_deltas, epoch_loss=None):
        # Progress bar
        # ------------------------------------------------
        batch_tf = time.time()
        batch_delta = batch_tf - batch_t0
        batch_deltas.append(batch_delta)
        batch_ave = np.mean(batch_deltas)
        eta = batch_ave * (n_batches - batch_i+1)
        eta_min = int(eta // 60)
        eta_sec = int(eta % 60)

        progress = int((batch_i+1) / float(n_batches) * self._progress_bar_length)
        percent_complete = (batch_i+1) / float(n_batches) * 100

        if percent_complete < 100:
            bar_symbol = "="*progress+">"+"-"*(self._progress_bar_length-progress)
        else:
            bar_symbol = "="*(progress+1)

        sys.stdout.write("\r{}/{} [{:{progress_bar_i}s}] {:5.2f}% - ETA {:2d}m {:2d}s - Loss: {:0.3f}".format(batch_i+1, n_batches, bar_symbol, percent_complete, eta_min, eta_sec, epoch_loss if epoch_loss else 0, progress_bar_i=self._progress_bar_length+1))
        sys.stdout.flush()
        # ------------------------------------------------

    def _update_confusion_matrix(self, test_set_id, data_dict, epoch_i=0):
        y_pred, y_actual = self._sess.run([self._model["prediction"], self._model["y_actual"]], feed_dict=data_dict)

        num_classes = n_classes = self._architecture["n_classes"]

        for predict_i in [x for x in range(num_classes)]:
            for actual_i in [x for x in range(num_classes)]:
                self._confusion_matrix[test_set_id][epoch_i][predict_i][actual_i] += len(np.where(y_pred[np.where(y_actual == predict_i)] == actual_i)[0])

    def train(self, data, n_epochs=10, batch_size=32):

        # Init train time
        train_time_t0 = time.time()
        patience_cnt = 0

        # Save Metrics
        self.metrics = {
            "epochs" : [],
            "training" : [],
            "validation" : [],
            "loss" : [],
            "test" : None
        }

        # Num batches
        num_train_batches = data.training.num_examples // batch_size
        num_validation_batches = data.validation.num_examples // batch_size
        num_test_batches = data.test.num_examples // batch_size

        # Build Confusion Matrix
        num_classes = self._architecture["n_classes"]
        self._confusion_matrix = {
            "validation" : np.zeros((n_epochs, num_classes, num_classes), dtype="int32"),
            "test" : np.zeros((1, num_classes, num_classes), dtype="int32")
        }

        # TRAIN
        # ***************************************************************
        print("Training...")

        self._sess.run(self._model["init"])
        batch_ave = 0

        try:
            for epoch_i in range(n_epochs):
                epoch_loss = 0
                train_acc = 0
                train_batch_deltas = []
                print("\nEpoch {}/{}".format(epoch_i+1, n_epochs))

                for train_batch_i in range(num_train_batches):
                    batch_t0 = time.time()
                    X_batch, y_batch = data.training.next_batch(batch_size)

                    batch_seq_length = np.array([[sequence.shape[0] for sequence in X_batch]]).reshape(X_batch.shape[0])

                    ops = [self._model["train_op"], self._model["loss"], self._model["accuracy"]]
                    train_dict = {
                        self._model["X"]        : X_batch,
                        self._model["y"]        : y_batch,
                        self._model["seq_length"] : batch_seq_length
                    }

                    _, batch_loss, batch_train_acc = self._sess.run(ops, feed_dict=train_dict)

                    epoch_loss += batch_loss / float(num_train_batches)
                    train_acc += batch_train_acc / float(num_train_batches)

                    # Progress bar
                    # ------------------------------------------------
                    self._progress_bar(batch_t0, train_batch_i, num_train_batches, train_batch_deltas, epoch_loss)
                    # ------------------------------------------------

                # Validation
                # ------------------------------------------------
                batch_seq_length = np.array([sequence.shape[0] for sequence in data.validation.X]).reshape(data.validation.num_examples)
                valid_dict = {
                    self._model["X"]        : data.validation.X,
                    self._model["y"]        : data.validation.y,
                    self._model["seq_length"] : batch_seq_length
                }

                valid_acc = self._sess.run(self._model["accuracy"], feed_dict=valid_dict)

                # Update Validation confusion matrix
                self._update_confusion_matrix("validation", valid_dict, epoch_i)
                # ------------------------------------------------

                # Save metrics
                # ------------------------------------------------
                self.metrics["epochs"].append(epoch_i)
                self.metrics["loss"].append(epoch_loss)
                self.metrics["training"].append(train_acc)
                self.metrics["validation"].append(valid_acc)
                # ------------------------------------------------

                # Check early stopping
                if self._early_stopping:
                    # early stopping
                    if epoch_i > self._early_stopping_start_epoch and self.metrics["loss"][-2] - self.metrics["loss"][-1] > self._early_stopping_min_delta:
                        patience_cnt = 0
                    else:
                        patience_cnt += 1

                    if patience_cnt > self._early_stopping_patience:
                        print("\nStopping Early!")
                        break
                    print("\nLoss: {:0.3f} -- Train Acc: {:0.3f} -- Valid Acc: {:0.3f} -- Patience Count: {}/{}\n".format(epoch_loss, train_acc, valid_acc, patience_cnt, self._early_stopping_patience))
                else:
                    print("\nLoss: {:0.3f} -- Train Acc: {:0.3f} -- Valid Acc: {:0.3f}\n".format(epoch_loss, train_acc, valid_acc))

            # Testing Accuracy
            # ------------------------------------------------
            batch_seq_length = np.array([[sequence.shape[0] for sequence in data.test.X]]).reshape(data.test.num_examples)
            test_dict = {
                self._model["X"]        : data.test.X,
                self._model["y"]        : data.test.y,
                self._model["seq_length"] : batch_seq_length
            }
            test_acc = self._sess.run(self._model["accuracy"], feed_dict=test_dict)

            # Save metrics
            self.metrics["test"] = test_acc

            # Print
            print("\nTest accuracy: {:0.3f}".format(test_acc))

            # Update Validation confusion matrix
            self._update_confusion_matrix("test", test_dict)
            # ------------------------------------------------

            # SAVE
            self._model["saver"].save(self._sess, "models/final_model.ckpt")
            # ***************************************************************

        except KeyboardInterrupt:
            # SAVE
            self._model["saver"].save(self._sess, "models/final_model.ckpt")

        # Final train time
        train_time_tf = time.time()
        self.total_train_time = train_time_tf - train_time_t0
        self.total_train_mins = int(self.total_train_time // 60)
        self.total_train_secs = int(self.total_train_time % 60)
        print("\n Total Time for Training: {:4d}m {:2d}s".format(self.total_train_mins, self.total_train_secs))

    def predict(self, data):
        data = np.expand_dims(data, axis=0)
        data = np.expand_dims(data, axis=-1)

        self._model["saver"].restore(self._sess, self._model_filepath)

        fethces = [self._model["prediction"], self._model["logits"]]

        batch_seq_length = np.array([[sequence.shape[0] for sequence in data]]).reshape(data.shape[0])
        test_dict = {
            self._model["X"] : data,
            self._model["seq_length"] : batch_seq_length
        }

        predictions, logits = self._sess.run(fetches=fethces, feed_dict=test_dict)

        return logits

    def updateML(self, probabilities, data_i, clear=False):

        try:
            data_i = np.array(data_i).flatten()[0]
        except:
            pass

        try:
            self.prediction_data[self.prediction_i] = data_i
        except ValueError:
            print("Error")
            print(data_i)

        logits = self.predict(self.prediction_data)[0].reshape(5, 5)

        self.prediction_i += 1

        # MODELS = ["Stratiform", "Cirriform", "Stratocumuliform", "Cumuliform", "Cumulonibiform"]

        cumuliform_logits = logits[3] # index 3 because this is cumuliform

        # Normalize genus probabilities
        suma = np.sum(np.exp(cumuliform_logits))
        for genus, logit in zip(self.genus_names, cumuliform_logits):
            self.genus_probabilities[genus] = np.exp(logit) / float(suma + 1e-9)

        return self.genus_probabilities

    def reset(self, init_probabilities):
        self.genus_probabilities = init_probabilities
        self.prediction_data = np.zeros(100)
        self.prediction_i = 0

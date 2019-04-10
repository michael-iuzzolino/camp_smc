
# coding: utf-8

# In[1]:

import numpy as np
import h5py
import matplotlib.pyplot as plt
from DynamicsProfiles import *


# In[2]:

time_steps = 10
intensities = []
num_intensities = 100
all_profiles = []

all_profiles.append(Cirrus(startPose=[40,40]))
all_profiles.append(Stratus(startPose=[40,40]))
all_profiles.append(Cumulus(startPose=[40,40]))
all_profiles.append(Nimbostratus(startPose=[40,40]))
all_profiles.append(Cumulonimbus(startPose=[40,40]))
all_profiles.append(Altostratus(startPose=[40,40]))


# In[3]:

full_data = {}
for model in all_profiles:
    model_name = model.name
    model_intensity = model.intensity
    full_data[model_name] = model_intensity
    # plt.plot(model_intensity)
    # plt.title("Class: {}".format(model_name))
    # plt.show()


# In[4]:

classes = full_data.keys()
num_classes = len(classes)


# In[5]:

X_data = np.array(full_data.values())


# In[6]:

y_data = np.identity(num_classes)


# In[7]:

import tensorflow as tf
from tensorflow.contrib.layers import fully_connected
from sklearn.model_selection import train_test_split
import sys


# In[8]:

n_inputs = X_data.shape[1]
n_hidden_1 = 100
n_hidden_2 = 100
n_hidden_3 = n_hidden_1
n_outputs = n_inputs


X = tf.placeholder(tf.float32, [None, n_inputs])
hidden_1 = fully_connected(X, n_hidden_1, activation_fn=tf.nn.tanh)
hidden_2 = fully_connected(hidden_1, n_hidden_2, activation_fn=tf.nn.tanh)
hidden_3 = fully_connected(hidden_2, n_hidden_3, activation_fn=tf.nn.tanh)
logits = fully_connected(hidden_3, n_outputs, activation_fn=None)


# In[9]:

loss = tf.reduce_sum(tf.nn.sigmoid_cross_entropy_with_logits(labels=X, logits=logits))
optimizer = tf.train.AdamOptimizer()
training_op = optimizer.minimize(loss)

init = tf.global_variables_initializer()


# In[10]:

X_train = X_data[5]


# In[ ]:

n_epochs = 50000

plt.ion()
raw_input("Press enter to start.")
with tf.Session() as sess:
    init.run()

    fig, ax = plt.subplots(2, 1)
    for epoch in range(n_epochs):
        sess.run(training_op, feed_dict={X: X_train.reshape(1, 100)})
#         sys.stdout.write("\r {:5.2f}% complete".format(epoch / float(n_epochs) * 100))
#         sys.stdout.flush()
        logits_val = logits.eval(feed_dict={X: X_train.reshape(1, 100)})
        logits_val = logits_val.reshape(100, 1)

        # if epoch < 300:
        #     if epoch % 10 == 0:
        #         ax[0].plot(X_train, 'b')
        #         ax[1].plot(logits_val, 'r')
        #         plt.title("Epoch: {}".format(epoch))
        #         plt.pause(0.0001)
        #         plt.cla()
        # else:
        #     if epoch % 100 == 0:
        #         ax[0].plot(X_train, 'b')
        #         ax[1].plot(logits_val, 'r')
        #         plt.title("Epoch: {}".format(epoch))
        #         plt.pause(0.0001)
        #         plt.cla()
        if epoch % 500 == 0:
            ax[0].plot(X_train, 'b')
            ax[1].plot(logits_val, 'r')
            plt.title("Epoch: {}".format(epoch))
            plt.pause(0.0001)
            plt.cla()


# In[ ]:

logits_val = logits_val.reshape(100, 1)

plt.plot(X_train)
plt.show()
plt.plot(logits_val, 'r')
plt.show()


# In[ ]:

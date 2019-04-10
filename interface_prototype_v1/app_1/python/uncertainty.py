"""
    Reference: http://www.visiondummy.com/2014/04/draw-error-ellipse-representing-covariance-matrix/
"""

import numpy as np
from numpy import linalg as LA
import h5py



# REFERENCE to calculate prob: https://www.fourmilab.ch/rpkp/experiments/analysis/chiCalc.html
def get_ellipse_data(covariance_matrix_POSITION, latitude, longitude, frame_load_index):

    chi_square_values = {"99.9%" : 13.8155, "99.5%" : 10.5966, "99%" : 9.2103, "95%" : 5.9915, "80%" : 3.2188, "65%" : 2.0996}

    eigen_data = getEigenValuesVectors(covariance_matrix_POSITION)

    # IGNORE EIGENVECTORS!
    # *******
    # cov_results = {"ellipses" : {}, "eigenvectors" : []}
    # *******

    cov_results = {"ellipses" : {}}

    for percent_key, chi_value in chi_square_values.items():
        cov_results["ellipses"][percent_key] = calculate_covariance_ellipse(eigen_data, chi_value, longitude, latitude)

    # IGNORE EIGENVECTORS!
    # *******
    # cov_results["eigenvectors"] = {"smallest" : eigen_data["smallest"]["vector"].tolist(), "largest" : eigen_data["largest"]["vector"].tolist()}
    # *******

    return cov_results


def getEigenValuesVectors(cov_matrix):
    # Calculate the eigenvectors and eigenvalues
    eigenval, eigenvec = LA.eig(cov_matrix)

    # Get the index of the largest eigenvector
    largest_eigenval = np.max(eigenval)
    largest_eigenval_index = np.ravel(np.where(eigenval == largest_eigenval))[0]

    # Get the largest eigenvalue
    largest_eigenvec = eigenvec[:, largest_eigenval_index]

    # Get the smallest eigenvector and eigenvalue
    if (largest_eigenval_index == 0):
        smallest_eigenval = eigenval[1]
        smallest_eigenvec = eigenvec[:, 1]
    else:
        smallest_eigenval = eigenval[0]
        smallest_eigenvec = eigenvec[:, 0]

    eigen_data = {"largest" : {"value" : largest_eigenval, "vector" : largest_eigenvec},
                  "smallest" : {"value" : smallest_eigenval, "vector" : smallest_eigenvec}}

    return eigen_data

def calculate_covariance_ellipse(eigen_data, chisquare_val, X0, Y0):

    largest_eigenvec = eigen_data["largest"]["vector"]
    largest_eigenval = eigen_data["largest"]["value"]
    smallest_eigenval = eigen_data["smallest"]["value"]

    # Calculate the angle between the x-axis and the largest eigenvector
    angle = np.arctan2(largest_eigenvec[1], largest_eigenvec[0])

    if angle < 0:
        angle += 2 * np.pi

    # Get the coordinates of the data mean

    theta_grid = np.linspace(0, 2*np.pi, 100)
    phi = angle
    a = chisquare_val * np.sqrt(largest_eigenval)
    b = chisquare_val * np.sqrt(smallest_eigenval)

    # the ellipse in x and y coordinates
    ellipse_x_r = a * np.cos(theta_grid)
    ellipse_y_r = b * np.sin(theta_grid)

    # Define a rotation matrix
    R = np.matrix([[np.cos(phi), np.sin(phi)], [-np.sin(phi), np.cos(phi)]])


    # rotate the ellipse to some angle phi
    r_ellipse = np.transpose([ellipse_x_r, ellipse_y_r]).dot(R)

    X = r_ellipse[:,0] + X0
    Y = r_ellipse[:,1] + Y0

    x_min = np.min(X)
    x_max = np.max(X)
    y_min = np.min(Y)
    y_max = np.max(Y)

    bounds = {"x_min" : x_min, "x_max" : x_max, "y_min" : y_min, "y_max" : y_max}


    return {"ellipse_data": {"X" : X.tolist(), "Y" : Y.tolist()}, "bounds" : bounds}


def write_h5(sig_data, frame_num):

    open_flag = "w" if frame_num == 0 else "a"
    with h5py.File("data/uncertainty/test.h5", open_flag) as outfile:
        outfile.create_dataset("frame_{}".format(frame_num), data=sig_data)

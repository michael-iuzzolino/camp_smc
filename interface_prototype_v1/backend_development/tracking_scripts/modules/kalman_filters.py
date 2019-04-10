from __future__ import division
import sys
import numpy as np
from scipy.linalg import sqrtm

sys.path.append('backend_development/scenario_simulator/modules')
from DynamicsProfiles import *


class NonLinearKalmanFilter(object):

    def __init__(self):
        self.initStateEst = np.matrix([0, 0, 1, 1]).T
        self.initStateCov = np.matrix(np.identity(4) * 10)
        self.deltaT = 1
        self.Q = np.matrix(np.identity(2)) * 10 + np.matrix(np.random.rand(2, 2)) * 2
        self.R = np.matrix(np.identity(2)) * 5 + np.matrix(np.random.rand(2, 2)) * 2


    def getDynamicsModel(self, targetState, processNoise=None, deltaT=None, modelNum = 0):

        return self.dynamicsModel_lin(targetState, processNoise, deltaT)


    def dynamicsModel_lin(self, targetState, processNoise=None, deltaT=None):
        # constant veloctiy target motion model
        if processNoise is None:
            processNoise = np.matrix(np.random.multivariate_normal([0, 0], self.R)).T
        if deltaT is None:
            deltaT=self.deltaT

        a = np.matrix([[1, 0, deltaT, 0], [0, 1, 0, deltaT], [0, 0, 1, 0], [0, 0, 0, 1]]) * targetState
        b = np.matrix([[deltaT * deltaT/2, 0], [0, deltaT * deltaT/2], [deltaT, 0], [0, deltaT]]) * processNoise

        newState = np.add(a, b)
        return newState


    def sensorModel(self, targetState, sensorNoise = None):
        # Returns noisy measurement of target x,y coords
        if sensorNoise is None:
            sensorNoise = np.matrix(np.random.multivariate_normal([0, 0], self.Q)).T
        meas = np.add(np.matrix([targetState[0].tolist()[0], targetState[1].tolist()[0]]), sensorNoise)
        return meas

    def UKFPredict(self, statePrev, covPrev, modelNum = 0):
        Q = self.Q
        R = self.R

        # Augment Matrixes
        xaug = np.r_[statePrev, np.matrix([0, 0]).T]
        tmp1 = np.matrix(np.zeros(shape=(4, 2)))
        tmp2 = np.matrix(np.zeros(shape=(2, 4)))
        tmp3 = np.c_[covPrev, tmp1]
        tmp4 = np.c_[tmp2, Q]
        Paug = np.r_[tmp3, tmp4]

        # Set Constants
        # L = 6
        L = 6
        alpha = 0.001
        beta = 2
        kappa = 0
        lamb = alpha * alpha * (L + kappa) - L

        # Create Sigma Points
        chi = xaug
        tmp = sqrtm((L + lamb) * Paug)

        for i in range(1, L + 1):
            tmp2 = np.add(xaug, np.matrix(tmp[:, i-1]).T)
            chi = np.c_[chi, tmp2]
        for i in range(L + 1, 2 * L + 1):
            tmp2 = np.subtract(xaug, np.matrix(tmp[:, i-L-1]).T)
            chi = np.c_[chi, tmp2]


        # Set up weights
        Ws = lamb/(L + lamb)
        Wc = Ws + (1 - alpha * alpha + beta)
        Ws = np.matrix(Ws)
        Wc = np.matrix(Wc)
        for i in range(1, 2 * L + 1):
            Ws = np.r_[Ws, np.matrix(1/(2 * (L + lamb)))]
            Wc = np.r_[Wc, np.matrix(1/(2 * (L + lamb)))]

        # Propogate Sigma Points
        newChi = self.getDynamicsModel(chi[0:4, 0], chi[4:6, 0], 1, modelNum)
        for i in range(1, 2 * L + 1):
            newChi = np.c_[newChi, self.getDynamicsModel(chi[0:4, i], chi[4:6, i], 1, modelNum)]


        # Recombine Sigma Points for predicted estimate and cov
        xPred = np.matrix(np.zeros(shape=(4, 1)))
        for i in range(0, len(Ws)):
            xPred = np.add(xPred, Ws[i].tolist()[0][0] * newChi[:, i])

        PPred = np.matrix(np.zeros(shape=(4, 4)))
        for i in range(0, 2 * L + 1):
            PPred = np.add(PPred, Wc[i].tolist()[0][0] * (newChi[:, i] - xPred) * (newChi[:, i] - xPred).T)

        return [xPred, PPred]

    def UKFUpdate(self, meas, statePred=None, covPred=None):

        xPred = statePred
        PPred = covPred

        R = self.R
        # Set Constants
        L = 6
        alpha = 0.001
        beta = 2
        kappa = 0
        lamb = alpha * alpha * (L + kappa) - L

        # Set up weights
        Ws = lamb/(L + lamb)
        Wc = Ws + (1 - alpha * alpha + beta)
        Ws = np.matrix(Ws)
        Wc = np.matrix(Wc)
        for i in range(1, 2 * L + 1):
            Ws = np.r_[Ws, np.matrix(1/(2 * (L + lamb)))]
            Wc = np.r_[Wc, np.matrix(1/(2 * (L + lamb)))]

        # Update Step
        # Reaugment matrixes
        xaug = np.c_[xPred.T, 0, 0].T

        tmp1 = np.matrix(np.zeros(shape=(4, 2)))
        tmp2 = np.matrix(np.zeros(shape=(2, 4)))
        tmp3 = np.c_[PPred, tmp1]
        tmp4 = np.c_[tmp2, R]
        Paug = np.r_[tmp3, tmp4]

        # Create New Sigma Points
        chi2 = xaug
        tmp = sqrtm((L + lamb) * Paug)

        for i in range(1, L + 1):
            tmp2 = np.add(xaug, np.matrix(tmp[:, i - 1]).T)
            chi2 = np.c_[chi2, tmp2]
        for i in range(L + 1, 2 * L + 1):
            tmp2 = np.subtract(xaug, np.matrix(tmp[:, i - L - 1]).T)
            chi2 = np.c_[chi2, tmp2]


        # Project Sigma points through observation function
        gamma = self.sensorModel(chi2[0:4, 0], chi2[4:6, 0])
        for i in range(1, 2 * L + 1):
            gamma = np.c_[gamma, self.sensorModel(chi2[0:4, i], chi2[4:6, i])]


        # Recombine sigma points to get predicted measurement and cov
        zhat = np.matrix([0, 0]).T
        for i in range(0, 2 * L + 1):
            zhat = np.add(zhat, Ws[i].tolist()[0][0] * gamma[:, i])

        Pz = np.matrix(np.zeros(shape=(2, 2)))
        for i in range(0, 2 * L + 1):
            Pz = np.add(Pz, Wc[i].tolist()[0][0] * (gamma[:, i] - zhat) * (gamma[:, i] - zhat).T)

        Px = np.matrix(np.zeros(shape=(4, 2)))
        for i in range(0, 2 * L + 1):
            Px = np.add(Px, Wc[i].tolist()[0][0] * (chi2[0:4,i] - xPred) * (gamma[:,i] - zhat).T)


        # Compute Kalman Gain
        KalmanGain = Px * (Pz.I)


        # Get updated Estimate and Covariance
        xNew = xPred + KalmanGain * (meas.T - zhat)
        PNew = PPred - KalmanGain * Pz * KalmanGain.T

        #print(xPred,xNew)

        return [xNew, PNew]


    def UKF(self, statePrev=None, covPrev=None, meas=None, modelNum=0):
        Q = self.Q
        R = self.R

        # Augment Matrixes
        xaug = np.r_[statePrev, np.matrix([0, 0]).T]
        tmp1 = np.matrix(np.zeros(shape=(4, 2)))
        tmp2 = np.matrix(np.zeros(shape=(2, 4)))
        tmp3 = np.c_[covPrev, tmp1]
        tmp4 = np.c_[tmp2, Q]
        Paug = np.r_[tmp3, tmp4]

        # Set Constants
        L = 6
        alpha = 0.001
        beta = 2
        kappa = 0
        lamb = alpha * alpha * (L + kappa) - L

        # Create Sigma Points
        chi = xaug
        tmp = sqrtm((L + lamb) * Paug)

        for i in range(1, L + 1):
            tmp2 = np.add(xaug, np.matrix(tmp[:, i - 1]).T)
            chi = np.c_[chi, tmp2]
            
        for i in range(L + 1, 2 * L + 1):
            tmp2 = np.subtract(xaug, np.matrix(tmp[:, i-L-1]).T)
            chi = np.c_[chi, tmp2]


        # Set up weights
        Ws = lamb/(L + lamb)
        Wc = Ws + (1 - alpha * alpha + beta)
        Ws = np.matrix(Ws)
        Wc = np.matrix(Wc)
        for i in range(1, 2 * L + 1):
            Ws = np.r_[Ws, np.matrix(1/(2 * (L + lamb)))]
            Wc = np.r_[Wc, np.matrix(1/(2 * (L + lamb)))]

        # Propogate Sigma Points
        newChi = self.getDynamicsModel(chi[0:4, 0], chi[4:6, 0], 1, modelNum)
        for i in range(1, 2 * L + 1):
            newChi = np.c_[newChi, self.getDynamicsModel(chi[0:4, i], chi[4:6, i], 1, modelNum)]


        # Recombine Sigma Points for predicted estimate and cov
        xPred = np.matrix(np.zeros(shape=(4, 1)))
        for i in range(0, len(Ws)):
            xPred = np.add(xPred, Ws[i].tolist()[0][0] * newChi[:, i])

        PPred = np.matrix(np.zeros(shape=(4, 4)))
        for i in range(0, 2 * L + 1):
            PPred = np.add(PPred, Wc[i].tolist()[0][0] * (newChi[:, i] - xPred) * (newChi[:, i] - xPred).T)




        # Update Step
        # Reaugment matrixes
        xaug = np.c_[xPred.T, 0, 0].T

        tmp1 = np.matrix(np.zeros(shape=(4, 2)))
        tmp2 = np.matrix(np.zeros(shape=(2, 4)))
        tmp3 = np.c_[PPred, tmp1]
        tmp4 = np.c_[tmp2, R]
        Paug = np.r_[tmp3, tmp4]

        # Create New Sigma Points
        chi2 = xaug
        tmp = sqrtm((L + lamb) * Paug)

        for i in range(1, L + 1):
            tmp2 = np.add(xaug, np.matrix(tmp[:, i - 1]).T)
            chi2 = np.c_[chi2, tmp2]
        for i in range(L + 1, 2 * L + 1):
            tmp2 = np.subtract(xaug, np.matrix(tmp[:, i-L-1]).T)
            chi2 = np.c_[chi2, tmp2]


        # Project Sigma points through observation function
        gamma = self.sensorModel(chi2[0:4, 0], chi2[4:6, 0])
        for i in range(1, 2 * L + 1):
            gamma = np.c_[gamma, self.sensorModel(chi2[0:4, i], chi2[4:6, i])]


        # Recombine sigma points to get predicted measurement and cov
        zhat = np.matrix([0, 0]).T
        for i in range(0, 2 * L + 1):
            zhat = np.add(zhat, Ws[i].tolist()[0][0] * gamma[:, i])

        Pz = np.matrix(np.zeros(shape=(2, 2)))
        for i in range(0, 2 * L + 1):
            Pz = np.add(Pz, Wc[i].tolist()[0][0] * (gamma[:, i] - zhat) * (gamma[:, i] - zhat).T)

        Px = np.matrix(np.zeros(shape=(4, 2)))
        for i in range(0, 2 * L + 1):
            Px = np.add(Px, Wc[i].tolist()[0][0] * (chi2[0:4, i] - xPred) * (gamma[:, i] - zhat).T)


        # Compute Kalman Gain
        KalmanGain = Px * (Pz.I)


        # Get updated Estimate and Covariance
        xNew = xPred + KalmanGain * (meas.T - zhat)
        PNew = PPred - KalmanGain * Pz * KalmanGain.T


        return [xNew, PNew]


    def vanillaFilter(self,muPrev,sigPrev,o=None,predict = True,update = True):
        self.A = np.matrix([[1,0,1,0],[0,1,0,1],[0,0,1,0],[0,0,0,1]])
        self.C = np.matrix([[1,0,0,0],[0,1,0,0]])
        self.R2 = np.matrix([[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]])
        self.Q2 = np.matrix([[1,0],[0,1]])

        if(predict):
            muBar = self.A*muPrev
            sigBar = self.A*sigPrev*self.A.T + self.R2
        if(update is False):
            return [muBar,sigBar]
        else:
            if(predict == False):
                muBar = muPrev
                sigBar = sigPrev

            K = sigBar*self.C.T*(self.C*sigBar*self.C.T + self.Q2).I
            muNew = muBar + K*(o - self.C*muBar)
            sigNew = (np.matrix(np.identity(len(muBar.tolist()))) - K*self.C)*sigBar

            return [muNew,sigNew]

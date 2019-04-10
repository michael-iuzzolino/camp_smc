
    def custom_munkres(self, detections):
        """
            Luke's Munkres
        """

        filterSeed = NLKF()

        # List of tracks is not empty
        # Check if list is empty. If so, return
        if len(self.track_list) == 0:
            return

        # preform prediction step of each track with CV model
        for fil in self.track_list:
            fil = filterSeed.UKFPredict(fil[0], fil[1])


        # create matrix of distances
        cost_matrix = self.defineCostMatrix(detections)


        # Row Reduction Step
        for i in range(0, size):
            rowMin = min(cost_matrix[i])
            for j in range(0, size):
                cost_matrix[i][j] = cost_matrix[i][j] - rowMin



        # Column Reduction Step
        for i in range(0, size):
            colMin = min(cost_matrix[i])
            for j in range(0, size):
                cost_matrix[j][i] = cost_matrix[j][i] - colMin


        # Repeat until number of lines is equal to number of rows
        while True:
            # Do the line covering thing

            # find all zeros
            starZeros = []
            allZeros = []
            for i in range(0, len(cost_matrix)):
                for j in range(0, len(cost_matrix[i])):
                    if cost_matrix[i][j] == 0:
                        allZeros.append([i, j])
                        shouldStar = True
                        for k in range(0, len(cost_matrix)):
                            if [i, k] in starZeros:
                                shouldStar = False
                        for k in range(0, len(cost_matrix)):
                            if [k, j] in starZeros:
                                shouldStar = False
                        if shouldStar:
                            starZeros.append([i, j])

            coverCol = [False for _ in range(0, len(cost_matrix))]
            coverRow = [False for _ in range(0, len(cost_matrix))]
            for sz in starZeros:
                coverCol[sz[1]] = True

            if all(coverCol):
                break

            while True:
                allZeros = []
                for i in range(0, len(cost_matrix)):
                    for j in range(0, len(cost_matrix[i])):
                        if cost_matrix[i][j] == 0:
                            allZeros.append([i, j])

                uncoveredZeros = []
                for i in range(0, len(allZeros)):
                    if (coverCol[allZeros[i][1]] == False) and (coverRow[allZeros[i][0]] == False):
                        uncoveredZeros.append(allZeros[i])


                primeZeros = []
                Step = 6
                while len(uncoveredZeros) != 0:
                    primeZeros.append(uncoveredZeros[0])
                    isStarInRow = False
                    for i in range(0, size):
                        if [uncoveredZeros[0][0], i] in starZeros:
                            isStarInRow = True
                    if not isStarInRow:
                        Step = 5
                        break
                    coverRow[uncoveredZeros[0][0]] = True
                    coverCol[uncoveredZeros[0][1]] = False

                    uncoveredZeros = []
                    for i in range(0, len(allZeros)):
                        if coverCol[allZeros[i][1]] == False and coverRow[allZeros[i][0]] == False:
                            uncoveredZeros.append(allZeros[i])
                if Step == 6:
                    minVal = 10000000
                    for i in range(0, size):
                        for j in range(0, size):
                            if coverRow[i] == False and coverCol[j] == False:
                                minVal = min(minVal, cost_matrix[i][j])
                    for i in range(0, size):
                        for j in range(0, size):
                            if coverRow[i] == True:
                                cost_matrix[i][j] = cost_matrix[i][j] + minVal
                            if coverCol[j] == False:
                                cost_matrix[i][j] = cost_matrix[i][j] - minVal
                else:
                    break
            # Step 5
            zSeries = []
            zSeries.append(primeZeros[-1])

            seriesComplete = True
            while True:
                for i in range(0, size):
                    if [i, zSeries[-1][1]] in starZeros:
                        zSeries.append([i, zSeries[-1][1]])
                        seriesComplete = False
                        break
                if seriesComplete == False:
                    for j in range(0, size):
                        if [zSeries[-1][0], j] in primeZeros:
                            zSeries.append([zSeries[-1][0], j])
                            break
                else:
                    break

            for i in range(0, len(zSeries)):
                if zSeries[i] in starZeros:
                    starZeros.remove(zSeries[i])
                if zSeries[i] in primeZeros:
                    starZeros.append(zSeries[i])

            primeZeros = []
            coverCol = [False for i in range(0, len(cost_matrix))]
            coverRow = [False for i in range(0, len(cost_matrix))]


        return starZeros


import numpy as np
from BayesHandler import BayesHandler
from classification import HumanTester
import sys
from copy import deepcopy
import json
sys.path.append("./HMM/modules")
sys.path.append("./RNN/modules")
from RNN_Classifiers import RNN
from classification import HumanTester as HMMClassifier
import matplotlib.pyplot as plt 

def runTester():

	np.random.seed(2)


	stepsToConverge = {}; 
	stepsToConverge['Novice'] = []; 
	stepsToConverge['Expert'] = []; 
	stepsToConverge['None'] = []; 

	correctRuns = {'Novice':0,'Expert':0,'None':0}; 

	#for 100 runs
	for run in range(0,1000):
		print("Run:{}".format(run)); 
		genu = np.random.randint(0,5); 


		human = HumanTester('./HMM/data/histModels_fams.npy',genus=genu);
		#print(human.species.genus);
		# with open("RNN/models/architecture_build/rnn_params.json", "r") as infile:
		# 	rnn_params = json.load(infile)

		# rnn_params["model_filepath"] = "RNN/models/final_model.ckpt"

		# RNN_clf_novice = RNN(**rnn_params)
		# RNN_clf_expert = RNN(**rnn_params) 


		BH = {}; 
		BH['HMM'] = {'Novice':BayesHandler(HMMClassifier(modelFileName='./HMM/data/histModels_fams.npy',genus=genu),'novice'),'Expert':BayesHandler(HMMClassifier(modelFileName='./HMM/data/histModels_fams.npy',genus=genu),'expert')}
		BH['None'] = BayesHandler(HMMClassifier(modelFileName='./HMM/data/histModels_fams.npy',genus=genu)); 
		#BH['RNN'] = {'Novice':BayesHandler(RNN_clf_novice,'novice'),'Expert':BayesHandler(RNN_clf_expert,'expert')}

		genus_names = ['Cumuliform0','Cumuliform1','Cumuliform2','Cumuliform3','Cumuliform4']


		#make a random sequence
		data = deepcopy(human.species.intensityModel)
		data = data+np.random.normal(0,0.25,(len(data)))
		for k in range(0,len(data)):
		    data[k] = max(data[k],1)
		data = data[0:100]

		noviceFlag = False; 
		expertFlag = False; 
		noneFlag = False;

		for timestep in range(0,100):
			if(noviceFlag and expertFlag and noneFlag):
				break; 

			if(not noviceFlag):
				hobsNovice = np.random.choice([i for i in range(0,15)],p=BH["HMM"]["Novice"].human_observation_model['Cumuliform{}'.format(genu)]);
				BH["HMM"]["Novice"].update(data=data[timestep],human_observation=[hobsNovice]);
			if(not expertFlag):
				hobsExpert = np.random.choice([i for i in range(0,15)],p=BH["HMM"]["Expert"].human_observation_model['Cumuliform{}'.format(genu)]);  
				BH["HMM"]["Expert"].update(data=data[timestep],human_observation=[hobsExpert]);  
			if(not noneFlag):
				BH['None'].update(data=data[timestep]);  

			if(noviceFlag == False and max(BH['HMM']['Novice'].probabilities.values()) > .9999):
				noviceFlag = True; 
				stepsToConverge['Novice'].append(timestep);  
			if(expertFlag == False and max(BH['HMM']['Expert'].probabilities.values()) > .9999):
				expertFlag = True;
				stepsToConverge['Expert'].append(timestep);  
			if(noneFlag == False and max(BH['None'].probabilities.values()) > .9999):
				noneFlag = True; 
				stepsToConverge['None'].append(timestep); 

		if(BH['None'].probabilities['Cumuliform{}'.format(genu)] == max(BH['None'].probabilities.values())):
			correctRuns['None'] += 1; 

		if(BH['HMM']['Novice'].probabilities['Cumuliform{}'.format(genu)] == max(BH['HMM']['Novice'].probabilities.values())):
			correctRuns['Novice'] += 1;

		if(BH['HMM']['Expert'].probabilities['Cumuliform{}'.format(genu)] == max(BH['HMM']['Expert'].probabilities.values())):
			correctRuns['Expert'] += 1; 

	print(stepsToConverge);
	print(correctRuns); 

	f = open('MonteCarloData4.npy','w'); 
	np.save(f,[correctRuns,stepsToConverge]); 


def dataAnalysis():
	[correctRuns,stepsToConverge] = np.load('MonteCarloData2.npy').tolist(); 
	
	print(correctRuns);

	print('None, Mean: {}, STD: {}'.format(np.mean(stepsToConverge['None']),np.std(stepsToConverge['None'])));
	print('Novice, Mean: {}, STD: {}'.format(np.mean(stepsToConverge['Novice']),np.std(stepsToConverge['Novice']))); 
	print('Expert, Mean: {}, STD: {}'.format(np.mean(stepsToConverge['Expert']),np.std(stepsToConverge['Expert'])));  

	fig,axarr = plt.subplots(3); 
	axarr[0].hist(stepsToConverge['None'],bins=15); 
	axarr[0].set_xlim([0,100]); 
	axarr[1].hist(stepsToConverge['Novice'],bins=15); 
	axarr[1].set_xlim([0,100]); 
	axarr[2].hist(stepsToConverge['Expert'],bins=15);
	axarr[2].set_xlim([0,100]); 
	plt.show();  

if __name__ == '__main__':
	#runTester(); 
	dataAnalysis(); 

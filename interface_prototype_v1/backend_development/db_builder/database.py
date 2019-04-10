import h5py
import numpy as np
import copy
from datetime import datetime

def store_event(track_info,time=datetime.today()):
	profile_type = 'Alsostratus' # hardcoded until classification is incorporated
	data = track_info['data']
	new_velocities = data['velocity']
	new_intensities = data['intensity']
	new_centroids = data['centroids']
	coordinates = data['region_spatial_extent']
	structured_noise = data['structured_noise']
	track_everything_else = data['track_everything_else']
	target_and_noise = track_everything_else['ground_truth']+track_everything_else['noise']+track_everything_else['pixel_bleed']+track_everything_else['shake_base']+track_everything_else['shotgun_noise']
	with h5py.File('model_db.h5','a') as outfile:
		if profile_type in outfile.keys():
			group=outfile[profile_type]
		else:
			group=outfile.create_group(profile_type)
		try:
			data_group=group.create_group(str(time))
		except ValueError:
			data_group=group[str(time)]
		for key, value in coordinates.iteritems():
			data_group.attrs.create(key,value)
		try:
			data_group.create_dataset('StructuredNoise',data = structured_noise)
			data_group.create_dataset('Target_and_Noise',data = target_and_noise)
		except RuntimeError:
			pass
		if 'profiles' in group.keys():
			profile_group=group['profiles']
		else:
			profile_group=group.create_group('profiles')
		if 'intensities' in profile_group.keys():
			intensities=profile_group['intensities']
		else:
			intensities=profile_group.create_group('intensities')
		intensities.create_dataset(str(time),data = new_intensities)
		if 'centroids' in profile_group.keys():
			centroids=profile_group['centroids']
		else:
			centroids=profile_group.create_group('centroids')
		centroids.create_dataset(str(time),data = new_centroids)
		if 'velocities' in profile_group.keys():
			velocities=profile_group['velocities']
			v_angles=velocities['v_angle']
			v_mags=velocities['v_mag']
			vxs=velocities['vx']
			vys=velocities['vy']
		else:
			velocities=profile_group.create_group('velocities')
			v_angles=velocities.create_group('v_angles')
			v_mags=velocities.create_group('v_mags')
			vxs=velocities.create_group('vxs')
			vys=velocities.create_group('vys')
		v_angles.create_dataset(str(time), data = new_velocities['v_angle'])
		v_mags.create_dataset(str(time), data = new_velocities['v_mag'])
		vxs.create_dataset(str(time), data = new_velocities['vx'])
		vys.create_dataset(str(time), data = new_velocities['vy'])
		# get average intensity from intensities #TODO
		# get average velocity from velocities #TODO
		# group.attrs.create('intensity',average_intensity)
		# group.attrs.create('velocity',average_velocity)

def find_profile(data):
	infile = h5py.File('past_events.h5','r')
	all_profiles=infile.keys()
	all_intensities=[]
	for profile in all_profiles:
		all_intensities.append(profile.attrs.get('intensity'))
	allCor = []
   	for i in range(len(all_intensities)):
   		allCor.append(np.correlate(all_intensities[i],new_intensity))
   	allCor_sorted=copy.copy(allCor)
   	allCor_sorted.sort()
   	for correlation in allCor_sorted:
   		# for testing
   		print all_profiles[allCor.index(correlation)],correlation
   	# return the most likely profile
   	return all_profiles[allCor.index(max(allCor_sorted))]

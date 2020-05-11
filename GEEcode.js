// Harvesting the image collection
// OFFL version is selected due to it's larger coverage instead of NRTI
var collection = ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_NO2')
  .select('tropospheric_NO2_column_number_density')
  .filterDate('2019-03-01', '2019-04-30'); 
// Add image to the map
var band_viz = {
  min: 0,
  max: 0.0002,
  palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']
};// Selected bands and min and max wavelengths.
Map.addLayer(collection.mean(), band_viz, 'S5P N02');
Map.setCenter(65.27, 24.11, 4);
// Converting image from mols to tons. Using weight of one mol of NO2 as 46g
// This is a way in which functions are defined in GEE
var mol_to_ton = collection.map(function (image){
  return image.multiply(0.000046)});
// Region of interest setup. Selected India as region of Interest. 
// Used FAO GAUL: Global Administrative Unit Layers 2015, Country Boundaries.
// By checking the the dataset on the earth engine website.
// I selected ADMO_NAME from the table schema which help us select UN Country name.
// Region of interest setup. Selected India as region of Interest. 
// Used FAO GAUL: Global Administrative Unit Layers 2015, Country Boundaries.
// By checking the the dataset on the earth engine website.
// I selected ADMO_NAME from the table schema which help us select UN Country name.
var area = dataset.filter(ee.Filter.inList('ADM0_NAME', ee.List(["India"])));
//Clip on the selected Area
var region_clip = mol_to_ton.mean().clip(area);
Map.addLayer(region_clip, band_viz, 'S5P N02')
//Calculating the region area
var emission_area = ee.Image.pixelArea().reduceRegion({// reduceRegion that 
// I have used here This reduces all the pixels in the region(s) 
//to a statistic or other compact representation of the pixel 
//data in the region (e.g. histogram)
 reducer: ee.Reducer.sum(),// the reduction is specified by providing the reducer
 geometry: area,
 scale: 1113// I checked that the resolution of band used for Sentinel 5P
 // 0.01 arc degrees and I googled it and found that for 0.01 arc degrees
 // the distance from eqautor is 1.1132 kms so I used 1113m. 
});
var region_area = emission_area.values().getInfo()[0]// the result obtained
// using reduceRegion is in the form of dictionary so I took the first 
// element out of it. 
// Calculate NO2 concentration (ton) in ROI
var mean_NO2_emission = region_clip.reduceRegion({
 reducer: ee.Reducer.mean(),
 geometry: area,
 scale: 1113,
});
// Calculate NO2 total concentration (ton) in ROI in 2019
var tot_emission = mean_NO2_emission.values().getInfo()[0];
var tot = ee.Number(tot_emission).multiply(region_area);// Used a simple 
// Number constructor which takes tot_emission as the argument and then 
// a simple mathematical equation can be applied on it to get the final 
// results. 
print("N02 Concentration (ton) in March and April 2019", tot);

// I repeated the same thing for year 2020 to enable comparison. 
var collection_2020 = ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_NO2')
 .select('tropospheric_NO2_column_number_density')
 .filterDate('2020-03-01', '2020-04-30');
var mol_to_ton_2020 = collection_2020.map(function (image) {
 return image.multiply(0.000046);
});
var region_clip_2020 = mol_to_ton_2020.mean().clip(area);
var mean_NO2_emission_2020 = region_clip_2020.reduceRegion({
 reducer: ee.Reducer.mean(),
 geometry: area,
 scale: 1113,
});
// Ton/m2.
var tot_emission_2020 = mean_NO2_emission_2020.values().getInfo()[0];
// Calculate NO2 total concentration (tons) in ROI in 2019
var tot_2020 = ee.Number(tot_emission_2020).multiply(region_area);
print("N02 Concentration (ton) in March and April 2019", tot_2020);
// Calculate NO2 total concentration DIFFERENCE (%) btw 2019 AND 2020
var diff = ((tot_2020.multiply(100)).divide(tot)).subtract(100);
print("Percentage difference in concentration", diff);
// Exported it to my google drive
var y_2020 = region_clip_2020.reduceRegions({// Difference between 
// reduceRegion and reduceRegions is that the latter one is used for
// collection of images i.e in case when we use FeatureCollection.
 'collection': area,
 'reducer': ee.Reducer.mean(),
 'scale': 1113
});
var y_2019 = region_clip.reduceRegions({
 'collection': area,
 'reducer': ee.Reducer.mean(),
 'scale': 1113
});
var taskParams = { 'driveFolder' : '', 'fileFormat' : 'CSV' };
Export.table(y_2019, 'y_2019', taskParams);
Export.table(y_2020, 'y_2020', taskParams);
 

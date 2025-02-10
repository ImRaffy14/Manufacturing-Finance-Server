const tf = require('@tensorflow/tfjs');
const inflowTransactionRecords = require('../../../Model/inflowsTransactionModel')


// Fetch records from MongoDB with pagination (for large datasets)
const fetchTransactionRecords = async () => {
  try {
    const records = await inflowTransactionRecords.find({})

    return records.map(record => ({
      id: record._id.toString(),
      dateTime: record.dateTime,
      auditor: record.auditor.toString(),
      auditorId: record.auditorId.toString(),
      invoiceId: record.invoiceId.toString(),
      customerName: record.customerName,
      totalAmount: record.totalAmount
    }));

  } catch (error) {
    console.error('Error fetching records:', error);
    return [];
  }
};

// Prepare data for training (log-transform and standardize)
const prepareData = (records) => {
  const totalAmounts = records.map(record => record.totalAmount);

  // Log transformation for more stable scaling
  const logTransformedAmounts = totalAmounts.map(amount => Math.log(amount + 1));

  // Standardize the data
  const meanAmount = logTransformedAmounts.reduce((acc, curr) => acc + curr, 0) / logTransformedAmounts.length;
  const stdAmount = Math.sqrt(logTransformedAmounts.reduce((acc, curr) => acc + Math.pow(curr - meanAmount, 2), 0) / logTransformedAmounts.length);
  const standardizedAmounts = logTransformedAmounts.map(amount => (amount - meanAmount) / stdAmount);

  return { standardizedAmounts, meanAmount, stdAmount };
};

// Build a simpler autoencoder model
const buildModel = () => {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [1] }));
  model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'linear' }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError',
  });

  return model;
};

// Train the model with more epochs and proper feedback
const oTrainModel = async (inputData) => {
  const model = buildModel();

  if (inputData == null || inputData.shape == null) {
    throw new Error('Input data is undefined or has no shape!');
  }

  await model.fit(inputData, inputData, {
    epochs: 500, // Increased epochs for better training
    batchSize: 5,
    verbose: 1, // Show training progress
  });

  return model;
};

// Calculate the dynamic error threshold based on mean + 2*std of errors
const calculateErrorThreshold = (reconstructionErrors) => {
  const meanError = reconstructionErrors.reduce((acc, err) => acc + err, 0) / reconstructionErrors.length;
  const stdError = Math.sqrt(reconstructionErrors.reduce((acc, err) => acc + Math.pow(err - meanError, 2), 0) / reconstructionErrors.length);

  const threshold = meanError + (2 * stdError); // Dynamic threshold based on error mean + 2*std
  return threshold;
};

// Anomaly detection logic (Dynamic thresholding)
const oDetectAnomalies = async (model, records, standardizedAmounts) => {
  const reconstructionError = [];
  const inputData = tf.tensor2d(standardizedAmounts, [standardizedAmounts.length, 1]);

  // Check if tensor creation is valid
  if (inputData.shape[0] === 0) {
    console.log("No data to process for anomaly detection.");
    return [];
  }

  const predictions = model.predict(inputData).arraySync();

  standardizedAmounts.forEach((amount, index) => {
    const error = Math.abs(amount - predictions[index][0]);
    reconstructionError.push(error);
  });

  const threshold = calculateErrorThreshold(reconstructionError);

  const anomalies = reconstructionError
    .map((error, index) => {
      if (error > threshold) {
        return records[index];
      }
      return null;
    })
    .filter(record => record !== null);

  return anomalies;
};

// Run the anomaly detection process
const iRunAnomalyDetection = async () => {
  const records = await fetchTransactionRecords();

  if (records.length === 0) {
    console.log("No records found in the database.");
    return [];
  }

  const { standardizedAmounts, meanAmount, stdAmount } = prepareData(records);
  if (standardizedAmounts.length === 0 ) {
    console.log("No valid data for training.");
    return [];
  }


  const model = await oTrainModel(tf.tensor2d(standardizedAmounts, [standardizedAmounts.length, 1]));

  if (!model) {
    console.log("Model training failed. Exiting.");
    return [];
  }

  const anomalies = await oDetectAnomalies(model, records, standardizedAmounts);

  return anomalies || [];
};


module.exports = {
  iRunAnomalyDetection,
};

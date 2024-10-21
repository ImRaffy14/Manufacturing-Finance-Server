const mongoose = require('mongoose');
const InflowsTransaction = require('../Model/inflowsTransactionModel');
const OutflowsTransaction = require('../Model/outflowsTransactionModel');

// Helper function to determine arrow direction
const getArrow = (difference) => {
  if (difference > 0) return '↑'; // Up arrow
  if (difference < 0) return '↓'; // Down arrow
  return ''; // No change
};

const aggregateTransactionsCurrentMonth = async () => {
  try {
    // Get the current date, year, and month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Start of the current month
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    // Start of the next month
    const startOfNextMonth = new Date(currentYear, currentMonth, 1);

    // Start of the previous month
    const startOfPreviousMonth = new Date(currentYear, currentMonth - 2, 1);
    const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);

    // Date format
    const dateFormat = "%m/%d/%Y %H:%M:%S";

    // Aggregation for inflows (current month, grouped by week)
    const inflowsAggregation = await InflowsTransaction.aggregate([
      {
        // Convert the dateTime string to a Date object and match current month records
        $addFields: { 
          date: { 
            $dateFromString: { 
              dateString: "$dateTime", 
              format: dateFormat
            } 
          }
        }
      },
      {
        $match: {
          date: { $gte: startOfMonth, $lt: startOfNextMonth }
        }
      },
      {
        // Group by week number
        $group: {
          _id: { $week: "$date" },
          totalInflowAmount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { '_id.week': 1 } } 
    ]);

    // Calculate total inflows for the current month
    const totalInflows = await InflowsTransaction.aggregate([
      {
        $addFields: { 
          date: { 
            $dateFromString: { 
              dateString: "$dateTime", 
              format: dateFormat
            } 
          }
        }
      },
      {
        $match: {
          date: { $gte: startOfMonth, $lt: startOfNextMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalInflowAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    // Aggregation for outflows (current month, grouped by week)
    const outflowsAggregation = await OutflowsTransaction.aggregate([
      {
        // Convert the dateTime string to a Date object and match current month records
        $addFields: { 
          date: { 
            $dateFromString: { 
              dateString: "$dateTime", 
              format: dateFormat
            } 
          }
        }
      },
      {
        $match: {
          date: { $gte: startOfMonth, $lt: startOfNextMonth }
        }
      },
      {
        // Group by week number
        $group: {
          _id: { $week: "$date" },
          totalOutflowAmount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { '_id.week': 1 } }
    ]);

    // Calculate total outflows for the current month
    const totalOutflows = await OutflowsTransaction.aggregate([
      {
        $addFields: { 
          date: { 
            $dateFromString: { 
              dateString: "$dateTime", 
              format: dateFormat
            } 
          }
        }
      },
      {
        $match: {
          date: { $gte: startOfMonth, $lt: startOfNextMonth }
        }
      },
      {
        $group: {
          _id: null, // Group all together
          totalOutflowAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    // Prepare the totals for the current month
    const totalInflowsAmount = totalInflows[0]?.totalInflowAmount || 0;
    const totalOutflowsAmount = totalOutflows[0]?.totalOutflowAmount || 0;

    // Get total net income for the current month
    const netIncome = totalInflowsAmount - totalOutflowsAmount;

    // -- Trend Calculations --
    // Aggregation for total inflows of the previous month
    const totalInflowsPreviousMonth = await InflowsTransaction.aggregate([
      {
        $addFields: { 
          date: { 
            $dateFromString: { 
              dateString: "$dateTime", 
              format: dateFormat 
            } 
          }
        }
      },
      {
        $match: {
          date: { $gte: startOfPreviousMonth, $lt: startOfCurrentMonth }
        }
      },
      {
        $group: {
          _id: null, 
          totalInflowAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    // Aggregation for total outflows of the previous month
    const totalOutflowsPreviousMonth = await OutflowsTransaction.aggregate([
      {
        $addFields: { 
          date: { 
            $dateFromString: { 
              dateString: "$dateTime", 
              format: dateFormat 
            } 
          }
        }
      },
      {
        $match: {
          date: { $gte: startOfPreviousMonth, $lt: startOfCurrentMonth }
        }
      },
      {
        $group: {
          _id: null, 
          totalOutflowAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

     // Calculate total inflows sales for the current month
     const totalInflowSales = await InflowsTransaction.aggregate([
      {
        $addFields: { 
          date: { 
            $dateFromString: { 
              dateString: "$dateTime", 
              format: dateFormat
            } 
          }
        }
      },
      {
        $match: {
          date: { $gte: startOfMonth, $lt: startOfNextMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 }
        }
      }
    ]);

      // Calculate total inflows sales for the previous month
      const totalInflowSalesPrevious = await InflowsTransaction.aggregate([
      {
        $addFields: { 
          date: { 
            $dateFromString: { 
              dateString: "$dateTime", 
              format: dateFormat
            } 
          }
        }
      },
      {
        $match: {
          date: { $gte: startOfPreviousMonth, $lt: startOfCurrentMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 }
        }
      }
    ]);

    // Prepare the totalSales for the current month
    const totalSalesVolumeCurrent = totalInflowSales[0]?.totalSales || 0;

    // Prepare the totalSales for the previous month
    const totalSalesVolumePrevious = totalInflowSalesPrevious[0]?.totalSales || 0;

    // Calculate the difference and percentage change for inflow sales volume
    const totalSalesVolumeDifference = totalSalesVolumeCurrent - totalSalesVolumePrevious
    const totalSalesVolumePercentageChange = totalSalesVolumePrevious && totalSalesVolumePrevious !== 0
    ? (totalSalesVolumeDifference / totalSalesVolumePrevious) * 100
    : (totalSalesVolumeCurrent > 0 ? 100 : 0)

    // Prepare the totals for the previous month
    const totalInflowsAmountPrevious = totalInflowsPreviousMonth[0]?.totalInflowAmount || 0;
    const totalOutflowsAmountPrevious = totalOutflowsPreviousMonth[0]?.totalOutflowAmount || 0;

    // Calculate the difference and percentage change for inflows
    const inflowDifference = totalInflowsAmount - totalInflowsAmountPrevious;
    const inflowPercentageChange = totalInflowsAmountPrevious !== 0 
      ? (inflowDifference / totalInflowsAmountPrevious) * 100 
      : (totalInflowsAmount > 0 ? 100 : 0);

    // Calculate the difference and percentage change for outflows
    const outflowDifference = totalOutflowsAmount - totalOutflowsAmountPrevious;
    const outflowPercentageChange = totalOutflowsAmountPrevious !== 0 
      ? (outflowDifference / totalOutflowsAmountPrevious) * 100 
      : (totalOutflowsAmount > 0 ? 100 : 0);

    // Return the results with arrows for differences and percentage changes
    return {
      inflows: inflowsAggregation,
      outflows: outflowsAggregation,
      totalInflows: totalInflowsAmount,
      totalOutflows: totalOutflowsAmount,
      netIncome: netIncome,
      inflowDifference: inflowDifference,
      inflowPercentageChange: inflowPercentageChange.toFixed(2),
      inflowDifferenceArrow: getArrow(inflowDifference),
      inflowPercentageChangeArrow: getArrow(inflowPercentageChange),
      outflowDifference: outflowDifference,
      outflowPercentageChange: outflowPercentageChange.toFixed(2),
      outflowDifferenceArrow: getArrow(outflowDifference),
      outflowPercentageChangeArrow: getArrow(outflowPercentageChange),
      salesVolume: totalSalesVolumeCurrent,
      salesVolumeDifference: totalSalesVolumeDifference,
      salesVolumePercentageChange: totalSalesVolumePercentageChange.toFixed(2),
      salesVolumeDifferenceArrow: getArrow(totalSalesVolumeDifference),
      salesVolumePercentageChangeArrow: getArrow(totalSalesVolumePercentageChange)
    }

  } catch (error) {
    console.error('Error in aggregation:', error);
  }
};

const transactionRecordsCurrentMonth = async () => {
  try {
    // Get the current date, year, and month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; 

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const startOfNextMonth = new Date(currentYear, currentMonth, 1);

    // date format
    const dateFormat = "%m/%d/%Y %H:%M:%S";

    // Aggregation for inflows records
    const inflowsRecords = await InflowsTransaction.aggregate([
      {
        $addFields: { 
          date: { 
            $dateFromString: { 
              dateString: "$dateTime", 
              format: dateFormat 
            } 
          }
        }
      },
      {
        $match: {
          date: { $gte: startOfMonth, $lt: startOfNextMonth }
        }
      },
    ]);

    // Aggregation for outflows records
    const outflowsRecords = await OutflowsTransaction.aggregate([
      {
        $addFields: { 
          date: { 
            $dateFromString: { 
              dateString: "$dateTime", 
              format: dateFormat
            } 
          }
        }
      },
      {
        $match: {
          date: { $gte: startOfMonth, $lt: startOfNextMonth }
        }
      },
    ]);

    return {
      inflowsRecords,
      outflowsRecords,
    };

  } catch (error) {
    console.error('Error in fetching transaction records:', error);
  }
};

module.exports = {
  aggregateTransactionsCurrentMonth,
  transactionRecordsCurrentMonth,
};

const invoiceRecord = require("../Model/invoiceRecordsModel")

const getPendingSalesData = async () => {

  const pendingSalesData = await invoiceRecord.aggregate([
      {
      $match: { Status: 'Pending' } 
      },
      {
      $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          totalCount: { $sum: 1 }
      }
      }
  ]);

  const pendingSalesCount = pendingSalesData.length > 0
  ? { totalAmount: pendingSalesData[0].totalAmount, totalCount: pendingSalesData[0].totalCount }
  : { totalAmount: 0, totalCount: 0 };

  const pendingSales = await invoiceRecord.find({ Status: 'Pending' }).sort({createdAt : -1});

  return { pendingSales, pendingSalesCount };
};


const getNonPendingRecords = async () => {
    const records = await invoiceRecord.find({
      Status: { $ne: 'Pending' }
    }).sort({createdAt : -1});
    return records;
  };

const getToAuditRecords = async () => {
  const records = await invoiceRecord.find({
    Status: 'To review' 
  }).sort({createdAt : -1});

  const recordsCount = records.length

  return {records, recordsCount}
}

module.exports = { 
    getPendingSalesData,
    getNonPendingRecords,
    getToAuditRecords
 };
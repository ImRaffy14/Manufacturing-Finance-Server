const axios = require('axios')
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_SECRET);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generateReport = async (data) => {

  
    try {
        const prompt = `Generate a concise and insightful financial narrative report based on the following data, YOUR ROLE IS A FINANCIAL OFFICER THAT CREATE NARRATIVE REPORT:

        **Current Period:**
        *   Date: ${data.date} (month/day/year format)
        *   Total Revenue: ₱${data.salesRevenue}
        *   Gross Profit: ₱${data.grossProfit}
        *   Total COGS: ₱${data.totalCogs}
        *   Total Operating Expenses: ₱${data.totalOperatingExpenses}
        *   Net Cash Flow: ₱${data.netCashFlow}
        
        **Previous Period:**
        
        *   Last Month Date: ${data.lmDate} (month/day/year format)
        *   Last Month Total Revenue: ₱${data.lmSalesRevenue}
        *   Last Month Gross Profit: ₱${data.lmGrossProfit}
        *   Last Month Total COGS: ₱${data.lmTotalCogs}
        *   Last Month Total Operating Expenses: ₱${data.lmTotalOperatingExpenses}
        *   Last Month Net Cash Flow: ₱${data.lmNetCashFlow}
        * 
        The report should be a narrative (no tables or charts) and should include:
        
        *   A brief overview of the key financial highlights and trends.
        *   A comparison of revenue, expenses, and profit between the current and previous periods, including percentage changes where relevant. Explain any significant variances.  Address any discrepancy between sales and revenue, suggesting possible reasons for the difference (e.g., other revenue streams, timing of revenue recognition).
        *   A discussion of the profit performance and factors contributing to the profit or loss.
        *   An assessment of the overall financial health of the business based on the data.
        *   Identify any areas that warrant further investigation (e.g., the relationship between sales and revenue, expense analysis).
        
        Keep the report concise and to the point. Assume the report is for stakeholders who may not be financial experts. Use professional financial language and tone, but explain any complex concepts in simple terms. Avoid bullet points; use paragraphs.  Do not make assumptions about the type of business; focus on the provided financial data.
        Make it simple, shorter and formal narrative report.
        Remove Financial Performance Report at the first.
        If the data is undefined consider it as a 0 value.
        Don't add reccomendation or suggestion.`;

        const result = await model.generateContent(prompt);
        return result.response.text()
      } catch (error) {
        console.error("Error generating report:", error);
      }
}

module.exports = {
    generateReport
}
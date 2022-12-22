const fetch = require("node-fetch");

const getTransaction = async(client, transactionId) => {
  let transaction = await fetch(`https://plugin.tebex.io/payments/${transactionId}`, {
    headers: {
      "X-Tebex-Secret": `${client.config.tebex.secret}`,
			"Content-Type": "application/json",
    }
  });

  let result = await transaction.json();
  if(result.error_code) return client.utils.sendError("Tebex Secret Key in Config File (tebex.secret) is Invalid or doesn't exist.");

  return result;
}

module.exports = {
  getTransaction,
}
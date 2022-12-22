const fetch = require("node-fetch");

const getPayment = async(client, transactionId) => {
  let transaction = await fetch(`https://api.craftingstore.net/v7/payments`, {
    method: "GET",
    headers: {
      "token": `Uz7Gaez6d359KvXpuzu5PHgjYkHexx4IQnf6zrtTc6xdRs1ULF`,
			"Content-Type": "application/json",
    }
  });

  let result = await transaction.json();
  const foundData = result.data.find((x) => x.transactionId.toLowerCase() == transactionId.toLowerCase());

  return foundData;
}

module.exports = {
  getPayment,
}
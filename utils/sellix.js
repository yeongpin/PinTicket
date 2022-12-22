const fetch = require("node-fetch");

const URL = "https://dev.sellix.io/v1";

const getOrder = async(client, orderId) => {
  let order = await fetch(`${URL}/orders/${orderId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${client.config.sellix.secret}`
    }
  });

  let result = await order.json();
  if(result.status == 401) return client.utils.sendError("Sellix API Key in Config File (sellix.secret) is Invalid or doesn't exist.");

  return result;
}

const getProduct = async(client, productId) => {
  let product = await fetch(`${URL}/products/${productId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${client.config.sellix.secret}`
    }
  });

  let result = await product.json();
  if(result.status == 401) return client.utils.sendError("Sellix API Key in Config File (sellix.secret) is Invalid or doesn't exist.");

  return result;
}

module.exports = {
  getOrder,
  getProduct
}
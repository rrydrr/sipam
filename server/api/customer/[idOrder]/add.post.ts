export default defineEventHandler(async (event) => {
  const orderId = event.context.params;
  const query = getQuery(event);
  console.log('Order ID:', orderId, 'Query:', query);
  return 'Hello Nitro'
})

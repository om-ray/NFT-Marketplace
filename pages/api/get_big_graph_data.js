export default function handler(req, res) {
  req.body = JSON.parse(req.body);
  fetch(req.body.DBUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query MyQuery {
          allNftData(
            condition: {tokenAddress: "${req.body.collection_addr}"}
            orderBy: TIMESTAMP_DESC
            ) {
              nodes {
                timestamp
                tokenAddress
                value
              }
            }
          }`,
    }),
  }).then((response) => {
    response.json().then((response) => {
      res.status(200).send(response);
    });
  });
}

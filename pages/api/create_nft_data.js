export default function handler(req, res) {
  req.body = JSON.parse(req.body);
  fetch(req.body.DBUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        mutation MyMutation {
          createNftDatum(input: {nftDatum: {value: "${req.body.token.value}", timestamp: "${req.body.token.block_timestamp}", tokenAddress: "${req.body.token.token_address}"}}) {
            nftDatum {
              timestamp
              tokenAddress
              value
            }
          }
        }`,
    }),
  }).then((response) => {
    res.status(200).send(response);
  });
}

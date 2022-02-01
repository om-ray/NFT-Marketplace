// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  req.body = JSON.parse(req.body);
  fetch(req.body.DBUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
      query MyQuery {
        allNftData(condition: {tokenAddress: "${req.body.collection_addr}"}, orderBy: TIMESTAMP_DESC) {
          nodes {
            timestamp
            tokenAddress
            value
          }
        }
      }
      `,
    }),
  })
    .then((NFTData) => {
      NFTData.json().then((NFTData) => {
        res.status(200).send(NFTData.data.allNftData.nodes.length);
      });
    })
    .catch((err) => {
      res.status(500).send(err);
    });
}

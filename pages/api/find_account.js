export default function handler(req, res) {
  req.body = JSON.parse(req.body);
  fetch(req.body.DBUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query MyQuery {
        allAccounts(condition: {userId:"${req.body.user_id}"}) {
          nodes {
            addresses
          }
        }
      }`,
    }),
  })
    .then((response) => {
      response.json().then((response) => {
        res.status(200).send(response);
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
}

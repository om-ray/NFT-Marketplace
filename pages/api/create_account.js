export default function handler(req, res) {
  req.body = JSON.parse(req.body);
  fetch(req.body.DBUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation MyMutation {
        createAccount(
          input: {account: {userId:"${req.body.user_id}"}}
        ){
          account {
            addresses
          }
        }
      }
      `,
    }),
  })
    .then((response) => {
      response.json().then((response) => {
        res.status(200).send(response);
      });
    })
    .catch((err) => {
      res.status(500).send(err);
    });
}

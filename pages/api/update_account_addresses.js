export default function handler(req, res) {
  req.body = JSON.parse(req.body);
  fetch(req.body.DBUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation MyMutation {
        updateAccountByEmail(input: {accountPatch: {addresses: "${req.body.addresses}"}, email: "${req.body.email}"}) {
          account {
            email
            password
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
      res.status(500).send(err);
    });
}

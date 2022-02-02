export default function handler(req, res) {
  req.body = JSON.parse(req.body);
  fetch(req.body.DBUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation MyMutation {
        createAccount(
          input: {account: {email: "${req.body.email}", password: "${req.body.password}", addresses: "${req.body.addresses}"}}
        ){
          account {
            addresses
            email
            password
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

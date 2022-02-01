// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  if (req.method === "POST") {
    let reqBody = req.body;
    let response = eval(`fetch("http://0.0.0.0/graphiql", {
      method:"POST",
      headers: { "Content-Type": "application/json" },
      body:JSON.stringify(${reqBody}),
    },`);
    res.status(200).send(response);
  }
}

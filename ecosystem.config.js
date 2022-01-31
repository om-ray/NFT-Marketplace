module.exports = {
  apps: [
    {
      name: "postgraphile",
      script: "/home/ec2-user/.nvm/versions/node/v17.4.0/bin/postgraphile",
      args: "-c postgres://postgres:postgres@nft-data.ctebvyvrwlrm.ap-south-1.rds.amazonaws.com:5432/postgres --host 0.0.0.0 --watch --port 5000 --enhance-graphiql --dynamic-json -o --cors",
    },
    {
      name: "ngrok",
      script: "ngrok",
      args: "ngrok http --region=us --hostname=nft-marketplace.ngrok.io 3000",
    },
  ],

  deploy: {
    production: {
      user: "SSH_USERNAME",
      host: "SSH_HOSTMACHINE",
      ref: "origin/master",
      repo: "GIT_REPOSITORY",
      path: "DESTINATION_PATH",
      "pre-deploy-local": "",
      "post-deploy": "npm install && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
};

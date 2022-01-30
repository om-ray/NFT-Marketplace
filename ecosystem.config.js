module.exports = {
  apps: [
    {
      name: "postgraphile",
      script: "/usr/local/bin/postgraphile",
      args: "-c postgres://postgres:postgres@nft-data.ctebvyvrwlrm.ap-south-1.rds.amazonaws.com:5432/postgres --host 0.0.0.0 --watch --port 5000 --enhance-graphiql --dynamic-json -o",
      // "instances": 1,
      // "exec_mode": "cluster",
      //   "env": {
      // "PGUSER": "theuser",
      //     "PGPASSWORD": "thepassword",
      //     "PGPORT": 5432,
      //   }
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

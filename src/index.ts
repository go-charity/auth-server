import app from "./app";

app.listen(process.env.PORT, () =>
  console.log(`Auth server listening on port ${process.env.PORT}`)
);

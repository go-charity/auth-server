import app from "./app";

app.listen(process.env.PORT || 5000, () =>
  console.log(`Auth server listening on port ${process.env.PORT || 5000}`)
);

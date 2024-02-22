import { NextFunction, Request, Response } from "express";
import client from "prom-client";

// * REGISTERES A NEW PROMETHEUS CLIENT
const register = new client.Registry();
client.collectDefaultMetrics({ register: register });

export const get_metrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader("Content-type", register.contentType);
  res.send(await register.metrics());
};

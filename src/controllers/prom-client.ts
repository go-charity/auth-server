import { MetricLabelClass, metric_label_enum } from "./../utils/utils";
import { NextFunction, Request, Response, Send } from "express";
import client from "prom-client";

// * REGISTERES A NEW PROMETHEUS CLIENT
const register = new client.Registry();
client.collectDefaultMetrics({ register: register, prefix: "goa_" });

// * The http_response rate histogram for measuring the response rates for each http request
const http_response_rate_histogram = new client.Histogram({
  name: "goa_http_duration",
  labelNames: [
    metric_label_enum.PATH,
    metric_label_enum.METHOD,
    metric_label_enum.STATUS_CODE,
  ],
  help: "The duration of HTTP requests in ms",
  buckets: [
    0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8,
    3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0,
    20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0, 200.0, 250.0, 300.0,
    350.0, 400.0, 450.0, 500.0, 550.0, 600.0, 650.0, 700.0, 750.0, 800.0, 850.0,
    900.0, 950.0, 1000.0,
  ],
});
const http_request_total = new client.Counter({
  name: "goa_http_request_total",
  help: "The total number of HTTP requests received",
  labelNames: [
    metric_label_enum.PATH,
    metric_label_enum.METHOD,
    metric_label_enum.STATUS_CODE,
  ],
});

// * Registers the HTTP response rate metric
register.registerMetric(http_response_rate_histogram);
// * Registers the HTTP request counter metric
register.registerMetric(http_request_total);

/**
 * Get's the metrics to be fed to the prometheus server
 * @param req The express Js req object
 * @param res The express Js response object
 * @param next The express Js next function
 */
export const get_metrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader("Content-type", register.contentType);
  res.send(await register.metrics());
};

// The middleware responsible for intercepting, setting the timer, and incrementing the http_request_total metric on each request
export const manage_metric_middlewares = (
  req: Request & {
    endTimer: (
      labels?:
        | Partial<
            Record<
              | metric_label_enum.PATH
              | metric_label_enum.METHOD
              | metric_label_enum.STATUS_CODE,
              string | number
            >
          >
        | undefined
    ) => number;
  },
  res: Response,
  next: NextFunction
) => {
  // Get's the Req URL object
  const req_url = new URL(req.url, `http://${req.headers.host}`);
  // console.log(req.url, req.headers.host, req_url);

  // Start's the prom-client histogram timer for the request
  const endTimer = http_response_rate_histogram.startTimer();
  req.endTimer = endTimer;
  // Copies the original res.send function to a variable
  const original_res_send_function = res.send;

  // Creates a new send function with the functionality of ending the timer, and incrementing the http_request_total metric whenever the response.send function is called
  const res_send_interceptor: any = function (this: any, body: any) {
    // Ends the histogram timer for the request
    const timer = req.endTimer(
      new MetricLabelClass(req.method, req_url.pathname, res.statusCode)
    );
    // Increment the http_request_total metric
    http_request_total.inc(
      new MetricLabelClass(req.method, req_url.pathname, res.statusCode)
    );

    // console.log("Ended timer", timer);
    // Calls the original response.send function
    original_res_send_function.call(this, body);
  };

  // Overrides the existing response.send object/property with the function defined above
  res.send = res_send_interceptor;
  // console.log("Started timer");
  next();
};

// const endHistogramTimer = (
//   err: any,
//   req: Request & {
//     endTimer: (
//       labels?:
//         | Partial<Record<"route" | "method" | "status_code", string | number>>
//         | undefined
//     ) => number;
//   },
//   res: Response,
//   next: NextFunction
// ) => {
//   console.log("Reached here");
//   // console.log(req.url);
//   const req_url = new URL(req.url, `http://${req.headers.host}`);
//   try {
//     const timer = req.endTimer({
//       method: req.method,
//       status_code: res.statusCode,
//       route: req_url.pathname,
//     });
//     console.log("Ended timer", timer);
//   } catch (error) {
//     console.error("Couldn't end timer");
//   }

//   next();
// };

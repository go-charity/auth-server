import {
  MetricLabelClass,
  calculate_cpu_usage,
  metric_label_enum,
} from "./../utils/utils";
import { NextFunction, Request, Response } from "express";
import { memoryUsage } from "process";
import client from "prom-client";
import { RequestType } from "../types";

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
// * The http_request counter for measuring the total no of requests made to the application
const http_request_total = new client.Counter({
  name: "goa_http_request_total",
  help: "The total number of HTTP requests received",
  labelNames: [
    metric_label_enum.PATH,
    metric_label_enum.METHOD,
    metric_label_enum.STATUS_CODE,
  ],
});
// * The node_js memory gauge for measuring the memory of the application in use
const nodejs_memory = new client.Gauge({
  name: "goa_nodejs_memory_usage_bytes",
  help: "Current memory usage of the Node.js process in bytes",
});
// * The node_js CPU usage gauge for measuring the memory of the application in use
const nodejs_cpu_usage = new client.Gauge({
  name: "nodejs_cpu_usage_percent",
  help: "CPU utilization of the Node.js process in percentage",
});
// * The requests_in_progress gauge for measuring the number of ongoing requests in the web server
const requests_in_progress = new client.Gauge({
  name: "goa_requests_in_progress",
  help: "Total number of ongoing requests/requests in progress in the web server",
  labelNames: [metric_label_enum.PATH],
});

// * Registers the HTTP response rate metric
register.registerMetric(http_response_rate_histogram);
// * Registers the HTTP request counter metric
register.registerMetric(http_request_total);
// * Registers the Node Js memory gauge metric
register.registerMetric(nodejs_memory);
// * Registers the Node Js cpu usage gauge metric
register.registerMetric(nodejs_cpu_usage);
// * Registeres the Requests in progress gauge metric
register.registerMetric(requests_in_progress);

/**
 * * Get's the metrics to be fed to the prometheus server
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

/**
 * * The middleware responsible for intercepting, setting the timer, and incrementing the http_request_total metric on each request
 * @param req The Express Js request object
 * @param res The Express Js response object
 * @param next The Express Js next function
 */
export const manage_metric_middlewares = (
  req: Request & {
    endTimer: (
      labels?: Partial<Record<metric_label_enum, string | number>> | undefined
    ) => void;
    used_memory_before: number;
    used_cpu_before: number;
    req_url: URL;
  },
  res: Response,
  next: NextFunction
) => {
  // Get's the Req URL object
  const req_url = new URL(req.url, `http://${req.headers.host}`);
  req.req_url = req_url;
  //! console.log(req.url, req.headers.host, req_url);

  // Start's the prom-client histogram timer for the request
  const endTimer = http_response_rate_histogram.startTimer();
  req.endTimer = endTimer;

  //Collect's the memory usage before processing the requests
  const used_memory_before = memoryUsage().rss;
  req.used_memory_before = used_memory_before;
  //Collect's the CPU usage before processing the requests
  const used_cpu_before = calculate_cpu_usage();
  req.used_cpu_before = used_cpu_before;

  // Increment the number of ongoing requests in the web server
  requests_in_progress.inc({ [metric_label_enum.PATH]: req_url.pathname });

  // ! REMOVE
  console.log(
    `Incremented requests in progress for ${req_url.pathname} endpoint`
  );

  // Copies the original res.send function to a variable
  const original_res_send_function = res.send;
  const original_res_json_function = res.json;
  const original_res_jsonp_function = res.jsonp;

  /**
   * * Creates a function with the functionality of ending the timer, and incrementing the http_request_total metric whenever the response.send function is called
   */
  const response_interceptor: any = function () {
    //Collect's the memory usage after processing the requests
    const used_memory_after = memoryUsage().rss;
    //Collect's the CPU usage after processing the requests
    const used_cpu_after = calculate_cpu_usage();

    // Ends the histogram timer for the request
    const timer = req.endTimer(
      new MetricLabelClass(req.method, req_url.pathname, res.statusCode)
    );
    // Increment the http_request_total metric
    http_request_total.inc(
      new MetricLabelClass(req.method, req_url.pathname, res.statusCode)
    );

    // Update the nodejs_memory guage with the differences in the memory usage
    nodejs_memory.set(used_memory_after - used_memory_before);
    // Update the nodejs_cpu_usage guage with the differences in the cpu usage
    nodejs_cpu_usage.set(used_cpu_after - used_cpu_before);

    // Decrement the number of ongoing requests in the web server
    requests_in_progress.dec({ [metric_label_enum.PATH]: req_url.pathname });
    // ! REMOVE
    console.log(
      `Decremented requests in progress for ${req_url.pathname} endpoint`
    );
  };

  /**
   * * Function to intercept the response.send function
   * @param this The this object for the parents' function scope
   * @param body the body of the response
   */
  const response_send_interceptor: any = function (this: any, body: any) {
    response_interceptor();
    // Calls the original response.send function
    original_res_send_function.call(this, body);
  };
  /**
   * * Function to intercept the response.json function
   * @param this The this object for the parents' function scope
   * @param body the body of the response
   */
  const response_json_interceptor: any = function (this: any, body: any) {
    response_interceptor();
    // Calls the original response.json function
    original_res_json_function.call(this, body);
  };
  /**
   * * Function to intercept the response.jsonp function
   * @param this The this object for the parents' function scope
   * @param body the body of the response
   */
  const response_jsonp_interceptor: any = function (this: any, body: any) {
    response_interceptor();
    // Calls the original response.jsonp function
    original_res_jsonp_function.call(this, body);
  };

  // Overrides the existing response.send, response.json and response.jsonp objects/properties with the function defined above
  res.send = response_send_interceptor;
  res.json = response_json_interceptor;
  res.jsonp = response_jsonp_interceptor;

  // ! console.log("Started timer");
  next();
};

/**
 * * Function responseible for ending/decrementing all prom-client counters, timers and guages for each request on error or 404 response
 * @param req The request object
 * @param res The Express response object
 */
const end_metric_counter_and_gauges_on_error = (
  req: RequestType,
  res: Response
) => {
  // Get's the Req URL object

  // ! REMOVE
  console.log(`REACHED HERE ERROR for ${req.req_url.pathname} endpoint`);

  //Collect's the memory usage after processing the requests
  const used_memory_after = memoryUsage().rss;
  //Collect's the CPU usage after processing the requests
  const used_cpu_after = calculate_cpu_usage();

  // Ends the histogram timer for the request
  const timer = req.endTimer(
    new MetricLabelClass(req.method, req.req_url.pathname, res.statusCode)
  );
  // Increment the http_request_total metric
  http_request_total.inc(
    new MetricLabelClass(req.method, req.req_url.pathname, res.statusCode)
  );

  // Update the nodejs_memory guage with the differences in the memory usage
  nodejs_memory.set(used_memory_after - req.used_memory_before);
  // Update the nodejs_cpu_usage guage with the differences in the cpu usage
  nodejs_cpu_usage.set(used_cpu_after - req.used_cpu_before);

  // Decrement the number of ongoing requests in the web server
  requests_in_progress.dec({ [metric_label_enum.PATH]: req.req_url.pathname });
  // ! REMOVE
  console.log(
    `Decremented requests in progress for ${req.req_url.pathname} endpoint from ERROR`
  );
};

/**
 * * The middleware responsible for handling uncaught errors from each endpoint in the webserver
 * @param error The Express Js error parameter
 * @param req The Express Js request object
 * @param res The Express Js response object
 * @param next The Express Js next function
 */
export const manage_error_middleware = (
  error: any,
  req: RequestType,
  res: Response,
  next: NextFunction
) => {
  end_metric_counter_and_gauges_on_error(req, res);
  console.error(error);
  next();
};

/**
 * * The middleware responsible for handling 404 responses in the web server. I.e. when an endpoint doesn't exist
 * @param req The Express Js request object
 * @param res The Express Js response object
 * @param next The Express Js next function
 */
export const manage_404_middleware = (
  req: RequestType,
  res: Response,
  next: NextFunction
) => {
  end_metric_counter_and_gauges_on_error(req, res);
  next();
};

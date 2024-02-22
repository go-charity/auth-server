import { Router } from "express";
import { get_metrics } from "../controllers/prom-client";

/**
 * @swagger
 * tags:
 *     - name: Prometheus app monitoring
 *       description: The endpoints responsible for exposing the application's metrics to Prometheus
 */
const prom_client_routes = Router();

/**
 * @swagger
 * /metrics:
 *  get:
 *     tags:
 *          - Prometheus app monitoring
 *     summary: Returns the application's metrics to the prometheus server
 *     responses:
 *      200:
 *          description: The file containing the metrics
 *          content:
 *              text/plain:
 *                  example: "# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
 *                            # TYPE process_cpu_user_seconds_total counter
 *                            process_cpu_user_seconds_total 0.703
 *
 *                            # HELP process_cpu_system_seconds_total Total system CPU time spent in seconds.
 *                            # TYPE process_cpu_system_seconds_total counter
 *                            process_cpu_system_seconds_total 0.062
 *
 *                            # HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.
 *                            # TYPE process_cpu_seconds_total counter
 *                             process_cpu_seconds_total 0.765
 *
 *                            # HELP process_start_time_seconds Start time of the process since unix epoch in seconds.
 *                            # TYPE process_start_time_seconds gauge
 *                            process_start_time_seconds 1708563098..."
 */
prom_client_routes.get("/", get_metrics);

export default prom_client_routes;

import { runVercelRoute } from './_route.js';

export const config = { api: { bodyParser: false } };

export default (req, res) => runVercelRoute(req, res, '/api/stripe-webhook');

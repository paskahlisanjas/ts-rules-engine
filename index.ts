import express from "express";
import parser from "body-parser";

import { EventsEvaluator, RulesEngine } from "./rules-engine";

interface RiskScoringResult {
  riskScore: "LOW" | "MEDIUM" | "HIGH";
  reason?: any;
}
type Actions = "set-risk-score";

// setup rules engine
const rulesEngine = new RulesEngine("./rules", 10_000);

// setup actions mapper
const eventsEvaluator = new EventsEvaluator<Actions, RiskScoringResult>({
  "set-risk-score": (result, params) => {
    result.riskScore = params?.riskScore;
    result.reason = params?.reason;
  },
});

// setup express server
const app = express();
const port = 3000;

app.post("/aggregate-amount-check", parser.json(), async (req, res) => {
  const fact = req.body;
  const evaluation = await rulesEngine.run(fact);

  const result = eventsEvaluator.evaluate(evaluation.events, {
    riskScore: "LOW",
    reason: "",
  });

  res.send(result);
});

app.listen(port, () => {
  console.log("App is started on port", port);
});

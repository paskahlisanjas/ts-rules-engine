import { Engine, EngineResult, Event } from "json-rules-engine";
import { readdirSync, readFileSync } from "fs";

export interface Evaluation extends EngineResult {}
export type Obj = Record<string, any>;

export class RulesEngine {
  private engine: Engine;

  public constructor(dir: string, refreshInterval: number) {
    const refreshRule = () => this.loadRules(dir);
    refreshRule();
    setInterval(refreshRule, refreshInterval);
  }

  private loadRules(dir: string) {
    this.engine = new Engine();

    const fileNames = readdirSync(dir);
    fileNames.forEach((name) => {
      const file = readFileSync(`${dir}/${name}`, "utf8");
      const rule = JSON.parse(file);
      this.engine.addRule({
        ...rule,
        onSuccess: (_e, _a, ruleResult) => {
          console.log(`${ruleResult.name} - conditions met`);
        },
      });
    });

    console.log(new Date(), "Rules loaded ✅");
  }

  public async run(fact: Obj): Promise<Evaluation> {
    return await this.engine.run(fact);
  }
}

export type ActionsMap<A extends string, R> = Record<
  A,
  (result: R, params?: Obj) => void
>;

export class EventsEvaluator<A extends string, R> {
  private actionsMap: ActionsMap<A, R>;

  constructor(actionsMap: ActionsMap<A, R>) {
    this.actionsMap = actionsMap;
  }

  public evaluate(events: Event[], initialResult: R): R {
    const result = initialResult;

    const mapEventTypeToAction = ({ type, params }: Event) => {
      if (!this.actionsMap[type]) throw new Error("unrecognized event type");
      this.actionsMap[type](result, params);
    };

    events.forEach(mapEventTypeToAction);
    return result;
  }
}

import { injectable } from 'inversify';
import newrelic from 'newrelic';

@injectable()
export class MetricsReporter {
  apply = (name: string, attributes: { [keys: string]: string | number | boolean }): void => {
    newrelic.recordCustomEvent(name, attributes);
  };
}

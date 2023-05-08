import { Container, interfaces } from 'inversify';
import { apply as containerFactory } from '../factories/ContainerFactory';

class Application {
  private static _instance: Application;
  private container: Container;

  private constructor() {
    this.container = containerFactory();
  }

  public static get instance(): Application {
    return (this._instance = this._instance || new Application());
  }

  public static get<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T {
    return Application.instance.container.get(serviceIdentifier);
  }
}

export default Application;

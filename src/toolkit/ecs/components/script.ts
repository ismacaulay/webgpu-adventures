import { ComponentType, ScriptComponent } from 'toolkit/types/ecs/components';

export function createScriptComponent(cb: Function): ScriptComponent {
  return {
    type: ComponentType.Script,

    update(dt) {
      cb(dt);
    },
  };
}

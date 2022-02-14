export function createScriptSystem(entityManager: EntityManager) {
  return {
    update(dt: number) {
      const view = entityManager.view([ComponentType.Script]);

      let result = view.next();
      while (!result.done) {
        const script = result.value[0] as ScriptComponent;

        script.update(dt);

        result = view.next();
      }
    },
  };
}

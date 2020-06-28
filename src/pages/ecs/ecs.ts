import { createEntityManager } from "toolkit/ecs/entity-manager";
import { createRenderSystem } from "toolkit/ecs/render-system";

export async function create(canvas: HTMLCanvasElement) {
    const entityManager = createEntityManager();

    const renderSystem = createRenderSystem();

    const lightEntity = entityManager.create();
    entityManager.addComponent(lightEntity, createTransformComponent({
        position: [1.2, 1.0, 2.0],
        scale: [0.1, 0.1, 0.1],
    }))

    let rafId: number;
    let lastTime = performance.now();
    function render() {
        const now = performance.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;


        renderSystem.update();

        rafId = requestAnimationFrame(render);
    }
    render();

    return {
        destroy() {},
    };
}
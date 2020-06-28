import { mat4 } from "toolkit/math/mat4";

export type Entity = number;

type ComponentFlags = number;
export enum ComponentType {
    Transform = 0x1,
    Movement = 0x2,
    Renderer = 0x4,
}

export interface Component {
    type: ComponentType;
}

export interface TransformComponent extends Component {
    type: ComponentType.Transform;

    readonly matrix: mat4;

    multiply(mat: mat4): void;
}


type ComponentMap = Map<ComponentType, Component>;

export interface EntityManager {
    create(): Entity;

    addComponent(entity: Entity, component: Component): void;
    view(components: ComponentType[]): Iterator<Component[]>;
}

export function createEntityManager(): EntityManager {
    let next: Entity = 0;

    const entityComponentFlags = new Map<Entity, ComponentFlags>();
    const entityComponents = new Map<Entity, ComponentMap>();

    return {
        create() {
            const id = next;
            next++;
            return id;
        },

        addComponent(entity: Entity, component: Component) {
            if (entity >= next) {
                throw `Invalid entity: ${entity}`;
            }

            const flags =
                (entityComponentFlags.get(entity) || 0x0) | component.type;
            entityComponentFlags.set(entity, flags);

            let components = entityComponents.get(entity);
            if (!components) {
                components = new Map();
                entityComponents.set(entity, components);
            }

            components.set(component.type, component);
        },

        view(components: ComponentType[]): Iterator<Component[]> {
            if (!components) {
                return {
                    next: function () {
                        return {
                            done: true,
                            value: [],
                        };
                    },
                };
            }

            const entIter = entityComponentFlags.keys();
            return {
                next: function () {
                    while (true) {
                        const nextEnt = entIter.next();
                        if (nextEnt.done) {
                            return {
                                done: true,
                                value: [],
                            };
                        }

                        let entHasAllComponents = true;
                        let flags =
                            entityComponentFlags.get(nextEnt.value) || 0x0;
                        for (let i = 0; i < components.length; ++i) {
                            if ((flags & components[i]) === 0) {
                                entHasAllComponents = false;
                                break;
                            }
                        }

                        if (!entityComponentFlags) {
                            continue;
                        }

                        const comps = entityComponents.get(nextEnt.value);
                        let value: Component[] = [];
                        if (comps) {
                            for (let i = 0; i < components.length; ++i) {
                                value.push(comps.get(components[i]) as Component);
                            }
                        }

                        return {
                            done: false,
                            value: value,
                        };
                    }
                },
            };
        },
    };
}

import {ComponentType, Component} from "./types";

export interface ScriptComponent extends Component {
    type: ComponentType.Script,

    update: (dt?: number) => void;
}

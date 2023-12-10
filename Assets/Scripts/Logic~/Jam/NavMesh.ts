import { Behaviour, addCustomExtensionPlugin, serializable } from "@needle-tools/engine";
import { Mesh, Object3D, Vector3 } from "three";
import { Pathfinding } from 'three-pathfinding';

export class NavMesh extends Behaviour {

    static Pathfinding?: Pathfinding;

    static FindPath(from: Vector3, to: Vector3): Vector3[] {
        // Find path from A to B.
        const groupID = NavMesh.Pathfinding.getGroup(NavMesh.ZONE, from);
        const path = NavMesh.Pathfinding.findPath(from, to, NavMesh.ZONE, groupID);

        return path;
    }

    static ZONE = 'level1';

    @serializable(Object3D)
    navMesh?: Object3D;

    awake(): void {
        if(!this.navMesh) return;

        // Create level.
        const pathfinding = NavMesh.Pathfinding ??= new Pathfinding();

        if (this.navMesh instanceof Mesh) {
            pathfinding.setZoneData(NavMesh.ZONE, Pathfinding.createZone(this.navMesh.geometry));
        }
    }
}